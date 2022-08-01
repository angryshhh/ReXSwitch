import { InnerMessage } from './type';
import { EXTENSION_MODULE, EXTENSION_NAME, INNER_MESSAGE_TYPE } from './enum';

export const getInnerMessage = (
  origin: EXTENSION_MODULE,
  target: EXTENSION_MODULE,
  type: INNER_MESSAGE_TYPE,
  content?: any,
): InnerMessage => {
  return {
    [EXTENSION_NAME]: true,
    origin,
    target,
    type,
    content,
  };
};

