import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Button, Card, Input, Menu, message as Message, Modal, Select } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { EXTENSION_MODULE, INNER_MESSAGE_TYPE } from '../enum';
import { Config, Configs } from '../type';
import 'antd/dist/antd.css';
import './index.css';
import { getInnerMessage } from '../utils';
import StorageChange = chrome.storage.StorageChange;
import AreaName = chrome.storage.AreaName;
import HeaderOperation = chrome.declarativeNetRequest.HeaderOperation;

const THIS_MODULE_NAME = EXTENSION_MODULE.POPUP;

function useLatestRef<T>(val: T) {
  const ref = useRef(val);

  useEffect(() => {
    ref.current = val;
  });

  return ref;
}

function useLatestCallback<T extends (...args: any[]) => any>(cb: T): T {
  const ref = useLatestRef(cb);

  return useCallback<any>((...args: any[]) => ref.current(...args), [ref]);
}

const getThisModuleMessage = (type: INNER_MESSAGE_TYPE, content?: any) =>
  getInnerMessage(THIS_MODULE_NAME, EXTENSION_MODULE.BACKGROUND, type, content);

const PopupContainer = styled.div`
  height: 100vh;
  display: flex;

  .left-part {
    flex-shrink: 0;
    height: 100%;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }
`;

const ConfigContainer = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  padding: 0 8px;

  .config-name {
    display: flex;
    align-items: center;
  }
`;

const RulesContainer = styled.div`
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const updateConfig = (nextConfig: Config) => {
  chrome.runtime.sendMessage(
    getThisModuleMessage(INNER_MESSAGE_TYPE.POPUP_UPDATE_CONFIG, {
      config: nextConfig,
    }),
  );
};

const App = () => {
  const [configs, setConfigs] = useState<Configs>({});
  const [currentConfigName, setCurrentConfigName] = useState('');
  const [selectedConfigName, setSelectedConfigName] = useState('');

  const selectedConfig = configs[selectedConfigName];

  const [configNameModalVisible, setConfigNameModalVisible] = useState(false);
  const [configNameModalValue, setConfigNameModalValue] = useState('');

  const setData = useLatestCallback((result: { [p: string]: any }) => {
    const { configs = {}, currentConfigName = '' } = result;
    setConfigs(configs);
    setCurrentConfigName(currentConfigName);
    if (!selectedConfigName) {
      setSelectedConfigName(currentConfigName);
    }
  });

  const storageChangedListener = useLatestCallback(
    (changes: { [p: string]: StorageChange }, areaName: AreaName) => {
      if (areaName === 'sync') {
        chrome.storage.sync.get(['configs', 'currentConfigName']).then(setData);
      }
    },
  );

  useEffect(() => {
    chrome.storage.sync.get(['configs', 'currentConfigName']).then(setData);

    chrome.storage.onChanged.addListener(storageChangedListener);
    return () => {
      chrome.storage.onChanged.removeListener(storageChangedListener);
    };
  }, []);

  return (
    <PopupContainer>
      <div className="left-part">
        <Input placeholder="过滤" />
        <Menu
          style={{ flexGrow: 1, overflowY: 'auto', border: 0 }}
          items={Object.values(configs).map(({ name }) => ({
            label: name === currentConfigName ? `🏃${name}` : name,
            key: name,
          }))}
          selectedKeys={[selectedConfigName]}
          onSelect={({ key }) => setSelectedConfigName(key)}
        />

        <div style={{ padding: '8px' }}>
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            style={{ width: '100%' }}
            onClick={() => {
              setConfigNameModalVisible(true);
              setConfigNameModalValue('');
            }}
          >
            添加配置
          </Button>
        </div>
      </div>
      {selectedConfig && (
        <ConfigContainer>
          <div className="config-name">
            <div style={{ flexGrow: 1 }}>{selectedConfigName}</div>
            {selectedConfigName === currentConfigName && (
              <Button
                onClick={() => {
                  chrome.runtime.sendMessage(
                    getThisModuleMessage(INNER_MESSAGE_TYPE.POPUP_DISABLE_CONFIG),
                  );
                }}
              >
                停用配置
              </Button>
            )}
            {selectedConfigName !== currentConfigName && (
              <>
                <Button
                  onClick={() => {
                    chrome.runtime.sendMessage(
                      getThisModuleMessage(INNER_MESSAGE_TYPE.POPUP_ENABLE_CONFIG, {
                        configName: selectedConfigName,
                      }),
                    );
                  }}
                >
                  启用配置
                </Button>
                <Button
                  danger
                  onClick={() => {
                    chrome.runtime.sendMessage(
                      getThisModuleMessage(INNER_MESSAGE_TYPE.POPUP_DELETE_CONFIG, {
                        configName: selectedConfigName,
                      }),
                    );
                  }}
                >
                  删除配置
                </Button>
              </>
            )}
          </div>
          <RulesContainer>
            <Card title="重定向规则" bodyStyle={{ padding: '0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(selectedConfig.redirectRules ?? []).map((redirectRule, redirectRuleIndex) => (
                  <div key={redirectRuleIndex}>
                    <div style={{ display: 'flex' }}>
                      <Input
                        addonBefore="目标URL（正则）"
                        value={redirectRule.targetUrl}
                        onChange={(event) => {
                          selectedConfig.redirectRules[redirectRuleIndex].targetUrl =
                            event.target.value;
                          updateConfig(selectedConfig);
                        }}
                      />
                      <Button
                        danger
                        onClick={() => {
                          selectedConfig.redirectRules.splice(redirectRuleIndex, 1);
                          updateConfig(selectedConfig);
                        }}
                      >
                        删除规则
                      </Button>
                    </div>
                    <Input
                      addonBefore="替换URL（正则）"
                      value={redirectRule.redirectUrl}
                      onChange={(event) => {
                        selectedConfig.redirectRules[redirectRuleIndex].redirectUrl =
                          event.target.value;
                        updateConfig(selectedConfig);
                      }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ padding: '8px' }}>
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  style={{ width: '100%' }}
                  onClick={() => {
                    selectedConfig.redirectRules = [
                      ...(selectedConfig.redirectRules ?? []),
                      { targetUrl: '', redirectUrl: '' },
                    ];
                    updateConfig(selectedConfig);
                  }}
                >
                  添加规则
                </Button>
              </div>
            </Card>

            <Card title="headers操作" bodyStyle={{ padding: '0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(selectedConfig.headersRules ?? []).map((headersRule, headersRuleIndex) => (
                  <div key={headersRuleIndex}>
                    <div style={{ display: 'flex' }}>
                      <Input
                        addonBefore="目标URL（正则）"
                        value={headersRule.targetUrl}
                        onChange={(event) => {
                          selectedConfig.headersRules[headersRuleIndex].targetUrl =
                            event.target.value;
                          updateConfig(selectedConfig);
                        }}
                      />
                      <Button
                        danger
                        onClick={() => {
                          selectedConfig.headersRules.splice(headersRuleIndex, 1);
                          updateConfig(selectedConfig);
                        }}
                      >
                        删除规则
                      </Button>
                    </div>
                    {(headersRule.requestHeaders ?? []).map((requestHeader, requestHeaderIndex) => (
                      <div key={requestHeaderIndex} style={{ display: 'flex' }}>
                        <Select
                          value={requestHeader.operation}
                          options={[
                            { label: '设置', value: 'set' },
                            { label: '追加', value: 'append' },
                            { label: '移除', value: 'remove' },
                          ]}
                          onChange={(value) => {
                            selectedConfig.headersRules[headersRuleIndex].requestHeaders[
                              requestHeaderIndex
                            ].operation = value;
                            if (value === HeaderOperation.REMOVE) {
                              delete selectedConfig.headersRules[headersRuleIndex].requestHeaders[
                                requestHeaderIndex
                              ].value;
                            }
                            updateConfig(selectedConfig);
                          }}
                        />
                        <Input
                          addonBefore="header"
                          value={requestHeader.header}
                          style={{ flexGrow: 1 }}
                          onChange={(event) => {
                            selectedConfig.headersRules[headersRuleIndex].requestHeaders[
                              requestHeaderIndex
                            ].header = event.target.value;
                            updateConfig(selectedConfig);
                          }}
                        />
                        {requestHeader.operation && requestHeader.operation !== 'remove' && (
                          <Input
                            addonBefore="value"
                            value={requestHeader.value}
                            style={{ flexGrow: 1 }}
                            onChange={(event) => {
                              selectedConfig.headersRules[headersRuleIndex].requestHeaders[
                                requestHeaderIndex
                              ].value = event.target.value;
                              updateConfig(selectedConfig);
                            }}
                          />
                        )}
                      </div>
                    ))}
                    <div>
                      <Button
                        style={{ width: '50%' }}
                        onClick={() => {
                          selectedConfig.headersRules[headersRuleIndex].requestHeaders = [
                            ...selectedConfig.headersRules[headersRuleIndex].requestHeaders,
                            { operation: HeaderOperation.APPEND, header: '', value: '' },
                          ];
                          updateConfig(selectedConfig);
                        }}
                      >
                        增加header操作
                      </Button>
                      <Button
                        style={{ width: '50%' }}
                        disabled={
                          selectedConfig.headersRules[headersRuleIndex].requestHeaders.length <= 1
                        }
                        onClick={() => {
                          selectedConfig.headersRules[headersRuleIndex].requestHeaders.splice(
                            -1,
                            1,
                          );
                          updateConfig(selectedConfig);
                        }}
                      >
                        删除header操作
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '8px' }}>
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  style={{ width: '100%' }}
                  onClick={() => {
                    selectedConfig.headersRules = [
                      ...(selectedConfig.headersRules ?? []),
                      {
                        targetUrl: '',
                        requestHeaders: [
                          { operation: HeaderOperation.APPEND, header: '', value: '' },
                        ],
                      },
                    ];
                    updateConfig(selectedConfig);
                  }}
                >
                  添加规则
                </Button>
              </div>
            </Card>
          </RulesContainer>
        </ConfigContainer>
      )}

      <Modal
        title="配置名"
        visible={configNameModalVisible}
        onOk={() => {
          if (configNameModalValue) {
            if (configs[configNameModalValue]) {
              Message.error('配置名已存在');
            } else {
              chrome.runtime.sendMessage(
                getThisModuleMessage(INNER_MESSAGE_TYPE.POPUP_ADD_CONFIG, {
                  config: { name: configNameModalValue },
                }),
              );
            }
          }
          setConfigNameModalVisible(false);
        }}
        onCancel={() => setConfigNameModalVisible(false)}
      >
        <Input
          value={configNameModalValue}
          onChange={(e) => setConfigNameModalValue(e.target.value)}
        />
      </Modal>
    </PopupContainer>
  );
};

export default App;
