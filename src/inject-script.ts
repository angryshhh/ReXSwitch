import { Config, InnerMessage } from './type';
import { EXTENSION_MODULE, EXTENSION_NAME, INNER_MESSAGE_TYPE } from './enum';
import { getInnerMessage } from './utils';

const THIS_MODULE_NAME = EXTENSION_MODULE.INJECT_SCRIPT;

const getThisModuleMessage = (type: INNER_MESSAGE_TYPE, content: any) =>
  getInnerMessage(THIS_MODULE_NAME, EXTENSION_MODULE.CONTENT_SCRIPT, type, content);

const testConfig: Config = {
  name: 'addTest',
  redirectRules: [
    {
      targetUrl:
        'https://(?:dev\\.)?g\\.alicdn\\.com/wdk-frontend-release/rex-pdca/(?:.+)/pages/(.*)/index\\.js.*',
      redirectUrl: 'http://127.0.0.1:15018/\\1/index.js',
    },
    {
      targetUrl: 'https://(?:pre-)?portalpro\\.hemaos\\.com/(.*)\\.hot-update\\.(json|js)',
      redirectUrl: 'http://127.0.0.1:15018/\\1.hot-update.\\2',
    },
  ],
  headersRules: [
    {
      targetUrl: '(.*)',
      requestHeaders: [
        // @ts-ignore
        { header: 'test-modify-header', operation: 'set', value: 'testModifyHeader' },
      ],
    },
  ],
};

// @ts-ignore
window.ReXSwitch = {
  addConfig: (config: Config = testConfig) => {
    window.postMessage(
      getThisModuleMessage(INNER_MESSAGE_TYPE.USER_ADD_CONFIG, { config }),
      '*',
    );
  },
  enableConfig: (configName: string) => {
    window.postMessage(
      getThisModuleMessage(INNER_MESSAGE_TYPE.USER_ENABLE_CONFIG, { configName }),
      '*',
    );
  },
  disableConfig: (configName: string) => {
    window.postMessage(
      getThisModuleMessage(INNER_MESSAGE_TYPE.USER_DISABLE_CONFIG, { configName }),
      '*',
    );
  },
};

const moduleMessageListener = (event: MessageEvent<InnerMessage>) => {
  const { data } = event;
  if (data[EXTENSION_NAME] && data.target === THIS_MODULE_NAME) {
    const { type, content } = data;
    if (
      type === INNER_MESSAGE_TYPE.USER_ADD_CONFIG_RESULT ||
      type === INNER_MESSAGE_TYPE.USER_ENABLE_CONFIG_RESULT ||
      type === INNER_MESSAGE_TYPE.USER_DISABLE_CONFIG_RESULT
    ) {
      if (!content.success) {
        console.error(content.message);
      }
    }
  }
};

window.addEventListener('message', moduleMessageListener);
