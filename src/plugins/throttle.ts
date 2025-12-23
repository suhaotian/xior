import { lru } from 'tiny-lru';

import { ICacheLike } from './cache/utils';
import type { XiorPlugin, XiorRequestConfig, XiorResponse } from '../types';
import { isAbsoluteURL, joinPath, buildSortedURL } from '../utils';
import { GET, f, undefinedValue } from '../shorts';
import { mergeConfig } from '..';

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
  onThrottle?: (config: XiorRequestConfig) => void;
  /** max throttle numbers in LRU, default is 100 */
  throttleItems?: number;

  /** Process the config before generating the key based on data/params. The config is a new object, not a request reference. */
  normalizeParams?: (config: XiorRequestConfig) => XiorRequestConfig;
};

/** @ts-ignore */
declare module 'xior' {
  interface XiorRequestConfig extends Omit<XiorThrottleOptions, 'throttleCache' | 'throttleItems'> {
    //
  }
}

export default function xiorThrottlePlugin(options: XiorThrottleOptions = {}): XiorPlugin {
  const {
    enableThrottle: _enableThrottle,
    normalizeParams: _normalizeParams,
    threshold: _threshold = 1000,
    throttleCache = lru<RecordedCache>(options.throttleItems || 100),
    onThrottle: _onThrottle,
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
        normalizeParams = _normalizeParams,
        onThrottle = _onThrottle,
      } = config as XiorThrottleOptions & XiorRequestConfig;

      const isGet = config.method === GET || config.isGet;

      const typeOfEnable = typeof enableThrottle;
      const enableIsFunction = typeOfEnable === f;

      let enabled: boolean | undefined = undefinedValue;
      if (enableIsFunction) {
        enabled = (enableThrottle as (config: XiorRequestConfig) => boolean | undefined)(config);
      }

      if (enabled === undefinedValue) {
        enabled =
          enableIsFunction || typeOfEnable === `${undefinedValue}`
            ? isGet
            : Boolean(enableThrottle);
      }

      if (enabled) {
        const { data, params } = normalizeParams?.(mergeConfig(config, {})) || config;
        const index = buildSortedURL(
          config.url && isAbsoluteURL(config.url)
            ? config.url
            : joinPath(config.baseURL, config.url),
          { a: data, b: params },
          paramsSerializer as (obj: Record<string, any>) => string
        );

        const now = Date.now();
        const cachedRecord = cache.get(index) || { timestamp: now };
        const responsePromise = cachedRecord.value;
        if (responsePromise && now - cachedRecord.timestamp <= threshold) {
          onThrottle?.(config);
          return responsePromise;
        }

        return recordCacheWithRequest(index, config);
      }

      return adapter(config);
    };
  };
}
