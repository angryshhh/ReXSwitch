import * as React from 'react';
import styled from 'styled-components';
import { Button, Card, Input, Menu, Select } from 'antd';
import { useEffect, useState } from 'react';
import { EXTENSION_MODULE } from '../enum';
import { Configs } from '../type';
import 'antd/dist/antd.css';
import './index.css';

const THIS_MODULE_NAME = EXTENSION_MODULE.POPUP;

const PopupContainer = styled.div`
  height: 100vh;
  display: flex;
`;

const RulesContainer = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const App = () => {
  const [configs, setConfigs] = useState<Configs>({});
  const [currentConfigName, setCurrentConfigName] = useState('');
  const [selectedConfigName, setSelectedConfigName] = useState('');

  const selectedConfig = configs[selectedConfigName];

  useEffect(() => {
    chrome.storage.sync.get(['configs', 'currentConfigName'], (result) => {
      const { configs = {}, currentConfigName = '' } = result;
      setConfigs(configs);
      setCurrentConfigName(currentConfigName);
      setSelectedConfigName(currentConfigName);
    });
  }, []);

  return (
    <PopupContainer>
      <div>
        <Input placeholder="过滤" />
        <Menu
          items={Object.values(configs).map(({ name }) => ({
            label: name === currentConfigName ? `🏃${name}` : name,
            key: name,
          }))}
          selectedKeys={[selectedConfigName]}
        />
      </div>
      {selectedConfig && (
        <RulesContainer>
          <Card title="重定向配置" bodyStyle={{ padding: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(selectedConfig.redirectRules ?? []).map((redirectRule, redirectRuleIndex) => (
                <div style={{ display: 'flex' }} key={redirectRuleIndex}>
                  <div>
                    <Input addonBefore="目标URL（正则）" value={redirectRule.targetUrl} />
                    <Input addonBefore="替换URL（正则）" value={redirectRule.redirectUrl} />
                  </div>
                  <div>
                    <Button style={{ height: '100%' }} danger>
                      删除
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="headers配置" bodyStyle={{ padding: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(selectedConfig.headersRules ?? []).map((headersRule, headersRuleIndex) => (
                <div key={headersRuleIndex}>
                  <div style={{ display: 'flex' }}>
                    <Input addonBefore="目标URL（正则）" value={headersRule.targetUrl} />
                    <Button style={{ height: '100%' }} danger>
                      删除
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
                      />
                      <Input
                        value={requestHeader.header}
                        disabled={!requestHeader.operation}
                        style={{ flexGrow: 1 }}
                      />
                      {requestHeader.operation && requestHeader.operation !== 'remove' && (
                        <Input value={requestHeader.value} style={{ flexGrow: 1 }} />
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Card>
        </RulesContainer>
      )}
    </PopupContainer>
  );
};

export default App;
