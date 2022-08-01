import MessageSender = chrome.runtime.MessageSender;
import { Config, InnerMessage } from './type';
import { EXTENSION_MODULE, EXTENSION_NAME, INNER_MESSAGE_TYPE } from './enum';
import { getInnerMessage } from './utils';
import Rule = chrome.declarativeNetRequest.Rule;
import RuleActionType = chrome.declarativeNetRequest.RuleActionType;

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
    }
  }
};

chrome.runtime.onMessage.addListener(moduleMessageListener);

// fetch('http://127.0.0.1:15018/webpack-dev-server/').then((res) => {
//   res.text().then((text) => {
//     console.log(text);
//   });
// });

chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
  console.log(
    `ruleSet ${info.rule.rulesetId} id ${info.rule.ruleId} rule matched url ${info.request.url} type ${info.request.type}`,
  );
});
