import { EXTENSION_MODULE, EXTENSION_NAME, INNER_MESSAGE_TYPE } from './enum';
import ModifyHeaderInfo = chrome.declarativeNetRequest.ModifyHeaderInfo;

export interface Config {
  /** 配置名，英文，唯一 */
  name: string;

  /**
   * 转发规则，数组
   *
   * 元素.targetUrl为正则匹配，元素.redirectUrl均为正则替换
   *
   * targetUrl匹配的url会用redirectUrl替换
   */
  redirectRules?: {
    targetUrl: string;
    redirectUrl: string;
  }[];

  /**
   * 替换规则，数组
   *
   * 元素.targetUrl为正则匹配
   *
   * 元素.requestHeaders为需要增加和替换的headers，需要设置name、value和operation
   *
   * targetUrl匹配的request的headers会被修改
   */
  headersRules?: {
    targetUrl: string;
    requestHeaders: ModifyHeaderInfo[];
  }[];
}

export interface Configs {
  [configName: string]: Config;
}

export interface InnerMessage {
  [EXTENSION_NAME]: boolean;
  type: INNER_MESSAGE_TYPE;
  origin: EXTENSION_MODULE;
  target: EXTENSION_MODULE;
  content?: any;
}
