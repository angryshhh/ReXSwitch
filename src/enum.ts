export const EXTENSION_NAME = 'ReXSwitch';

export enum EXTENSION_MODULE {
  INJECT_SCRIPT = 'inject-script',
  CONTENT_SCRIPT = 'content-script',
  BACKGROUND = 'background',
  POPUP = 'popup',
}

export enum INNER_MESSAGE_TYPE {
  USER_ADD_CONFIG = 'user_add_config',
  USER_ADD_CONFIG_RESULT = 'user_add_config_result',

  USER_ENABLE_CONFIG = 'user_enable_config',
  USER_ENABLE_CONFIG_RESULT = 'user_enable_config_result',

  USER_DISABLE_CONFIG = 'user_disable_config',
  USER_DISABLE_CONFIG_RESULT = 'user_disable_config_result',

  POPUP_ADD_CONFIG = 'popup_add_config',
  POPUP_DELETE_CONFIG = 'popup_delete_config',
  POPUP_UPDATE_CONFIG = 'popup_update_config',
  POPUP_ENABLE_CONFIG = 'popup_enable_config',
  POPUP_DISABLE_CONFIG = 'popup_disable_config',
}
