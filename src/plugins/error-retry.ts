import { delay } from './utils';
import { XiorPlugin, XiorRequestConfig } from '../types';
import { XiorError } from '../utils';

export type ErrorRetryOptions = {
  /** retry times, default: 2 */
  retryTimes?: number;
  /**
   * Retry after milliseconds, default: 3000
   * after first time error retry, retry interval
   */
  retryInterval?: number | ((count: number) => number);
  /**
   * default: true,
   * it's useful because we don't want retry when the error  because of token expired
   */
  enableRetry?: boolean | ((config: XiorRequestConfig, error: XiorError) => boolean);
  onRetry?: (config: XiorRequestConfig, error: XiorError, count: number) => void;
};

/** @ts-ignore */
declare module 'xior' {
  interface XiorRequestConfig extends ErrorRetryOptions {}
}

export default function xiorErrorRetryPlugin(options: ErrorRetryOptions = {}): XiorPlugin {
  const {
    retryTimes: _retryTimes,
    retryInterval: _retryInterval,
    enableRetry: _enableRetry,
    onRetry: _onRetry,
  } = options || {
    retryTimes: 2,
    retryInterval: 3000,
  };

  return function (adapter) {
    return async (config) => {
      const {
        retryTimes = _retryTimes,
        retryInterval = _retryInterval,
        enableRetry = _enableRetry,
        onRetry = _onRetry,
      } = config as ErrorRetryOptions;

      let timeUp = false;
      let count = 0;

      async function handleRequest() {
        try {
          return await adapter(config);
        } catch (error) {
          const isGet = config.method === 'GET' || config.isGet;
          const t = typeof enableRetry;
          const enabled =
            t === 'undefined'
              ? isGet
              : t === 'function'
                ? (enableRetry as (config: XiorRequestConfig, error: XiorError | Error) => boolean)(
                    config,
                    error as XiorError
                  )
                : Boolean(enableRetry);

          timeUp = retryTimes === count;
          if (timeUp || !enabled) {
            throw error;
          }

          const delayTime =
            typeof retryInterval === 'function' ? retryInterval(count) : retryInterval;
          if (delayTime && delayTime > 0 && count > 0) {
            await delay(delayTime);
          }
          count++;
          if (onRetry) onRetry(config, error as XiorError, count);
          return handleRequest();
        }
      }

      return handleRequest();
    };
  };
}
