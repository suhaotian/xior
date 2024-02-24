import { XiorPlugin } from '../types';

// TODO
export default function xiorRepeatRequestFilterPlugin(options = {}): XiorPlugin {
  return function (adapter) {
    return async (config) => {
      return adapter(config);
    };
  };
}
