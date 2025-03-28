import { f, GET, undefinedValue } from '../shorts';
import { XiorInterceptorRequestConfig, XiorPlugin, XiorRequestConfig } from '../types';
import { XiorError, delay } from '../utils';

export type ErrorRetryOptions = {
  /** retry times, default: 2 */
  retryTimes?: number;
  /**
   * Retry after milliseconds, default: 3000
   * after first time error retry, retry interval
   */
  retryInterval?:
    | number
    | ((count: number, config: XiorInterceptorRequestConfig, error: XiorError) => number);
  /**
   * default: true,
   * it's useful because we don't want retry when the error  because of token expired
   */
  enableRetry?: boolean | ((config: XiorRequestConfig, error: XiorError) => boolean | undefined);
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
  } = {
    retryTimes: 2,
    retryInterval: 3000,
    ...options,
  };

  return function (adapter, instance) {
    return async (config) => {
      const {
        retryTimes = _retryTimes,
        retryInterval = _retryInterval,
        enableRetry = _enableRetry,
        onRetry = _onRetry,
      } = config as ErrorRetryOptions;

      let count = 0;

      async function handleRequest(isRetry = false) {
        if (isRetry && instance?.REQI) {
          for (const item of instance.REQI) {
            config = await item(config as XiorInterceptorRequestConfig);
          }
        }
        try {
          let promise = adapter(config);
          let i = 0;
          const responseInterceptorChain: any[] = [];
          instance?.RESI?.forEach(function pushResponseInterceptors(interceptor) {
            responseInterceptorChain.push(interceptor.fn, interceptor.onRejected);
          });
          while (responseInterceptorChain.length > i) {
            promise = promise.then(responseInterceptorChain[i++], responseInterceptorChain[i++]);
          }
          config._did = true;
          return await promise;
        } catch (error) {
          const isGet = config.method === GET || Boolean(config.isGet);
          const typeOfEnable = typeof enableRetry;
          const enableIsFunction = typeOfEnable === f;

          let enabled: boolean | undefined = undefinedValue;
          if (enableIsFunction) {
            enabled = (
              enableRetry as (
                config: XiorRequestConfig,
                error: XiorError | Error
              ) => boolean | undefined
            )(config, error as XiorError);
          }
          if (enabled === undefinedValue) {
            enabled =
              enableIsFunction || typeOfEnable === `${undefinedValue}`
                ? isGet
                : Boolean(enableRetry);
          }

          // Check if we've reached the retry limit
          if (count >= retryTimes || !enabled) {
            throw error;
          }

          // Increment count before calculating delay time
          count++;

          const delayTime =
            typeof retryInterval === f
              ? (retryInterval as Function)(
                  count,
                  config as XiorInterceptorRequestConfig,
                  error as XiorError
                )
              : retryInterval;

          // Apply delay only when needed
          if (delayTime && delayTime > 0) {
            await delay(delayTime);
          }

          if (onRetry) onRetry(config, error as XiorError, count);
          return handleRequest(true);
        }
      }

      return handleRequest();
    };
  };
}
