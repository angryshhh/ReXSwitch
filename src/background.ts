import MessageSender = chrome.runtime.MessageSender;
import Rule = chrome.declarativeNetRequest.Rule;
import RuleActionType = chrome.declarativeNetRequest.RuleActionType;
import { Config, InnerMessage } from './type';
import { EXTENSION_MODULE, EXTENSION_NAME, INNER_MESSAGE_TYPE } from './enum';
import { getInnerMessage } from './utils';

const getRulesFromConfig = (config: Config): Rule[] => {
  const { redirectRules = [], headersRules = [] } = config;
  const rules: Rule[] = [];

  let id = 1;

  for (const rule of redirectRules) {
    rules.push({
      id,
      condition: { regexFilter: rule.targetUrl },
      action: {
        type: RuleActionType.REDIRECT,
        redirect: { regexSubstitution: rule.redirectUrl },
      },
    });
    id++;
  }

  for (const rule of headersRules) {
    rules.push({
      id,
      condition: { regexFilter: rule.targetUrl },
      action: {
        type: RuleActionType.MODIFY_HEADERS,
        requestHeaders: rule.requestHeaders,
      },
    });
    id++;
  }

  return rules;
};

const THIS_MODULE_NAME = EXTENSION_MODULE.BACKGROUND;

const disableConfig = () => {
  chrome.declarativeNetRequest.getDynamicRules((rules) => {
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: rules.map(({ id }) => id),
    });
  });
  chrome.storage.sync.set({ currentConfigName: '' });
};

const enableConfig = (configName: string) => {
  chrome.storage.sync.get(['configs'], (result) => {
    const { configs = {} } = result;
    if (!!configs[configName]) {
      chrome.declarativeNetRequest.getDynamicRules((rules) => {
        chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: rules.map(({ id }) => id),
          addRules: getRulesFromConfig(configs[configName]),
        });
      });
      chrome.storage.sync.set({ currentConfigName: configName });
    }
  });
};

const addConfig = (config: Config) => {
  chrome.storage.sync.get(['configs'], (result) => {
    const { configs = {} } = result;
    configs[config.name] = config;
    chrome.storage.sync.set({ configs });
  });
};

const deleteConfig = (configName: string) => {
  chrome.storage.sync.get(['configs'], (result) => {
    const { configs = {} } = result;
    if (configs[configName]) {
      delete configs[configName];
    }
    chrome.storage.sync.set({ configs });
  });
};

const updateConfig = (config: Config) => {
  chrome.storage.sync.get(['configs'], (result) => {
    const { configs = {} } = result;
    configs[config.name] = config;

    chrome.storage.sync.set({ configs }).then(() => {
      chrome.storage.sync.get(['currentConfigName'], ({ currentConfigName }) => {
        if (currentConfigName === config.name) {
          enableConfig(config.name);
        }
      });
    });
  });
};

const moduleMessageListener = (
  message: InnerMessage,
  sender: MessageSender,
  response: (message: InnerMessage) => void,
) => {
  if (message[EXTENSION_NAME] && message.target === THIS_MODULE_NAME) {
    const { type, content } = message;
    if (type === INNER_MESSAGE_TYPE.USER_ADD_CONFIG) {
      const { config } = content;
      addConfig(config);
      response(
        getInnerMessage(
          THIS_MODULE_NAME,
          EXTENSION_MODULE.CONTENT_SCRIPT,
          INNER_MESSAGE_TYPE.USER_ADD_CONFIG_RESULT,
          { success: true },
        ),
      );
    } else if (type === INNER_MESSAGE_TYPE.USER_ENABLE_CONFIG) {
      const { configName } = content;
      enableConfig(configName);
      response(
        getInnerMessage(
          THIS_MODULE_NAME,
          EXTENSION_MODULE.CONTENT_SCRIPT,
          INNER_MESSAGE_TYPE.USER_ENABLE_CONFIG_RESULT,
          { success: true },
        ),
      );
    } else if (type === INNER_MESSAGE_TYPE.USER_DISABLE_CONFIG) {
      disableConfig();
      response(
        getInnerMessage(
          THIS_MODULE_NAME,
          EXTENSION_MODULE.CONTENT_SCRIPT,
          INNER_MESSAGE_TYPE.USER_DISABLE_CONFIG_RESULT,
          { success: true },
        ),
      );
    } else if (type === INNER_MESSAGE_TYPE.POPUP_ADD_CONFIG) {
      const { config } = content;
      addConfig(config);
    } else if (type === INNER_MESSAGE_TYPE.POPUP_DELETE_CONFIG) {
      const { configName } = content;
      deleteConfig(configName);
    } else if (type === INNER_MESSAGE_TYPE.POPUP_UPDATE_CONFIG) {
      const { config } = content;
      updateConfig(config);
    } else if (type === INNER_MESSAGE_TYPE.POPUP_ENABLE_CONFIG) {
      const { configName } = content;
      enableConfig(configName);
    } else if (type === INNER_MESSAGE_TYPE.POPUP_DISABLE_CONFIG) {
      disableConfig();
    }
  }
};

chrome.runtime.onMessage.addListener(moduleMessageListener);

// fetch('http://127.0.0.1:15018/webpack-dev-server/').then((res) => {
//   res.text().then((text) => {
//     console.log(text);
//   });
// });

// chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
//   console.log('request captured');
//   console.log(info);
// });
