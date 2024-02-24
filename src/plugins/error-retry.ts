import { delay } from './utils';
import { XiorPlugin } from '../types';
import { XiorError, XiorTimeoutError } from '../utils';

export type ErrorRetryOptions = {
  /** retry times, default: 0 */
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
  shouldRetryOnError?: (error: XiorError) => boolean;
};

/** @ts-ignore */
declare module 'xior' {
  interface XiorRequestConfig extends Omit<ErrorRetryOptions, 'shouldRetryOnError'> {}
}

export default function xiorErrorRetryPlugin(options: ErrorRetryOptions = {}): XiorPlugin {
  const {
    retryTimes: _retryTimes,
    retryInterval: _retryInterval,
    shouldRetryOnError,
  } = options || {
    retryTimes: 0,
    retryInterval: 3000,
  };

  return function (adapter) {
    return async (config) => {
      const { retryTimes = _retryTimes, retryInterval = _retryInterval } =
        config as ErrorRetryOptions;

      let timeUp = false;
      let count = 0;

      async function handleRequest() {
        try {
          return await adapter(config);
        } catch (error) {
          if (error instanceof XiorError || error instanceof XiorTimeoutError) {
            const shouldRetry = shouldRetryOnError ? shouldRetryOnError(error) : true;
            timeUp = retryTimes === count;
            if (timeUp || !shouldRetry) {
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
