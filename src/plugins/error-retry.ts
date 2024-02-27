import { delay } from './utils';
import { XiorPlugin, XiorRequestConfig } from '../types';
import { XiorError, XiorTimeoutError } from '../utils';

export type ErrorRetryOptions = {
  /** retry times, default: 2 */
  retryTimes?: number;
  /**
   * Retry after milliseconds, default: 3000
   * after first time error retry, retry interval
   */
  retryInterval?: number;
  /**
   * default: true,
   * it's useful because we don't want retry when the error  because of token expired
   */
  enableRetry?: boolean | ((config: XiorRequestConfig, error: XiorError) => boolean);
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
      } = config as ErrorRetryOptions;

      let timeUp = false;
      let count = 0;

      async function handleRequest() {
        try {
          return await adapter(config);
        } catch (error) {
          if (error instanceof XiorError || error instanceof XiorTimeoutError) {
            const isGet = config.method === 'GET';
            const t = typeof enableRetry;
            const enabled =
              t === 'undefined'
                ? isGet
                : t === 'function'
                  ? (enableRetry as (config: XiorRequestConfig, error: XiorError) => boolean)(
                      config,
                      error
                    )
                  : Boolean(enableRetry);

            timeUp = retryTimes === count;
            if (timeUp || !enabled) {
              throw error;
            }

            if (retryInterval && retryInterval > 0 && count > 0) {
              await delay(retryInterval);
            }

            count++;
            return handleRequest();
          }

          throw error;
        }
      }

      return handleRequest();
    };
  };
}
