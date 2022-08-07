import { InnerMessage } from './type';
import { EXTENSION_MODULE, EXTENSION_NAME, INNER_MESSAGE_TYPE } from './enum';
import { getInnerMessage } from './utils';

const THIS_MODULE_NAME = EXTENSION_MODULE.CONTENT_SCRIPT;

(() => {
  // 在content script向dom注入脚本
  let script = document.createElement('script');
  script.setAttribute('type', 'text/javascript');
  script.setAttribute('src', chrome.runtime.getURL('inject-script.js'));
  document.body.appendChild(script);
})();

const backgroundResponseHandler = (message: InnerMessage) => {
  if (message[EXTENSION_NAME] && message.target === THIS_MODULE_NAME) {
    const { type, content } = message;
    if (
      type === INNER_MESSAGE_TYPE.USER_ADD_CONFIG_RESULT ||
      type === INNER_MESSAGE_TYPE.USER_ENABLE_CONFIG_RESULT ||
      type === INNER_MESSAGE_TYPE.USER_DISABLE_CONFIG_RESULT
    ) {
      window.postMessage(
        getInnerMessage(THIS_MODULE_NAME, EXTENSION_MODULE.INJECT_SCRIPT, type, content),
        '*',
      );
    }
  }
};

const moduleMessageListener = (event: MessageEvent<InnerMessage>) => {
  const { data } = event;

  if (data[EXTENSION_NAME] && data.target === THIS_MODULE_NAME) {
    const { type, content } = data;
    if (
      type === INNER_MESSAGE_TYPE.USER_ADD_CONFIG ||
      type === INNER_MESSAGE_TYPE.USER_ENABLE_CONFIG ||
      type === INNER_MESSAGE_TYPE.USER_DISABLE_CONFIG
    ) {
      chrome.runtime
        .sendMessage(getInnerMessage(THIS_MODULE_NAME, EXTENSION_MODULE.BACKGROUND, type, content))
        .then(backgroundResponseHandler);
    }
  }
};

window.addEventListener('message', moduleMessageListener);
