import { lru } from 'tiny-lru';

import buildSortedURL from './cache/build-sorted-url';
import { ICacheLike } from './cache/utils';
import type { XiorPlugin, XiorRequestConfig, XiorResponse } from '../types';
import { isAbsoluteURL, joinPath } from '../utils';

type XiorPromise = Promise<XiorResponse>;

export type RecordedCache = {
  timestamp: number;
  value?: XiorPromise;
};

export type XiorThrottleOptions = {
  /** threshold in milliseconds, default: 1000ms */
  threshold?: number;
  /**
   * check if we need enable throttle, default only `GET` method or`isGet: true` enable
   */
  enableThrottle?: boolean | ((config?: XiorRequestConfig) => boolean);
  throttleCache?: ICacheLike<RecordedCache>;
};

/** @ts-ignore */
declare module 'xior' {
  interface XiorRequestConfig extends Omit<XiorThrottleOptions, 'throttleCache'> {
    //
  }
}

export default function xiorThrottlePlugin(options: XiorThrottleOptions = {}): XiorPlugin {
  const {
    enableThrottle: _enableThrottle,
    threshold: _threshold = 1000,
    throttleCache = lru<RecordedCache>(10),
  } = options;

  const cache = throttleCache;

  return function (adapter) {
    const recordCacheWithRequest = (index: string, config: XiorRequestConfig) => {
      const responsePromise = (async () => {
        try {
          const response = await adapter(config);
          cache.set(index, {
            timestamp: Date.now(),
            value: Promise.resolve(response),
          });

          return response;
        } catch (reason) {
          if ('delete' in cache) {
            cache.delete(index);
          } else {
            cache.del(index);
          }
          throw reason;
        }
      })();

      cache.set(index, {
        timestamp: Date.now(),
        value: responsePromise,
      });

      return responsePromise;
    };

    return async (config) => {
      const {
        paramsSerializer,
        threshold = _threshold,
        enableThrottle = _enableThrottle,
      } = config as XiorThrottleOptions & XiorRequestConfig;

      const isGet = config.method === 'GET' || config.isGet;

      const t = typeof enableThrottle;
      const enabled =
        t === 'undefined'
          ? isGet
          : t === 'function'
            ? (enableThrottle as Function)(config)
            : Boolean(enableThrottle);

      if (enabled) {
        const index = buildSortedURL(
          config.url && isAbsoluteURL(config.url)
            ? config.url
            : joinPath(config.baseURL || '', config.url || ''),
          { a: config.data, b: config.params },
          paramsSerializer as (obj: Record<string, any>) => string
        );

        const now = Date.now();
        const cachedRecord = cache.get(index) || { timestamp: now };

        if (now - cachedRecord.timestamp <= threshold) {
          const responsePromise = cachedRecord.value;
          if (responsePromise) {
            return responsePromise;
          }
        }

        return recordCacheWithRequest(index, config);
      }

      return adapter(config);
    };
  };
}
