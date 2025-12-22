import { lru } from 'tiny-lru';

import { ICacheLike } from './cache/utils';
import type { XiorPlugin, XiorRequestConfig, XiorResponse } from '../types';
import { buildSortedURL, isAbsoluteURL, joinPath } from '../utils';
import { f, GET, undefinedValue } from '../shorts';

type XiorPromise = Promise<XiorResponse>;

export type XiorCacheOptions = {
  /**
   * check if we need enable cache, default only `GET` method or`isGet: true` enable cache
   */
  enableCache?: boolean | ((config?: XiorRequestConfig) => boolean);
  defaultCache?: ICacheLike<XiorPromise>;
  /** max cache number in LRU, default is 100 */
  cacheItems?: number;
  /** cache time in ms, default is 5 minutes */
  cacheTime?: number;
  /** remove the key from data/params */
  omitKey?: (
    data?: Record<string, string>,
    params?: Record<string, string>
  ) => { data?: Record<string, string>; params?: Record<string, string> };
};

/** @ts-ignore */
declare module 'xior' {
  interface XiorRequestConfig extends Omit<XiorCacheOptions, 'cacheItems' | 'cacheTime'> {
    /** forceUpdate, default: false */
    forceUpdate?: boolean;
  }
  interface XiorResponse {
    fromCache?: boolean;
    cacheTime?: number;
    cacheKey?: string;
  }

  interface XiorInterceptorResponseConfig {
    fromCache?: boolean;
    cacheTime?: number;
    cacheKey?: string;
  }
}

export default function xiorCachePlugin(options: XiorCacheOptions = {}): XiorPlugin {
  const {
    enableCache: _enableCache,
    omitKey: _omitKey,
    defaultCache: _defaultCache = lru(
      options.cacheItems || 100,
      options.cacheTime || 1000 * 60 * 5
    ),
  } = options;

  return function (adapter) {
    return async (config) => {
      const {
        enableCache = _enableCache,
        omitKey = _omitKey,
        forceUpdate,
        defaultCache = _defaultCache,
        paramsSerializer,
      } = config as XiorCacheOptions & {
        forceUpdate?: boolean;
      } & XiorRequestConfig;

      const isGet = config.method === GET || config.isGet;
      const typeOfEnable = typeof enableCache;
      const enableIsFunction = typeOfEnable === f;

      let enabled: boolean | undefined = undefinedValue;
      if (enableIsFunction) {
        enabled = (enableCache as (config: XiorRequestConfig) => boolean | undefined)(config);
      }
      if (enabled === undefinedValue) {
        enabled =
          enableIsFunction || typeOfEnable === `${undefinedValue}` ? isGet : Boolean(enableCache);
      }

      let key = '';
      if (enabled) {
        const cache: ICacheLike<XiorPromise> = defaultCache;
        const { data, params } = omitKey?.(config.data, config.params) || config;
        key = buildSortedURL(
          config.url && isAbsoluteURL(config.url)
            ? config.url
            : joinPath(config.baseURL, config.url),
          { a: data, b: params },
          paramsSerializer as (obj: Record<string, any>) => string
        );
        let responsePromise = cache.get(key);

        if (!responsePromise || forceUpdate) {
          responsePromise = (async () => {
            try {
              const res = await adapter(config);
              if (res) (res as any).cacheKey = key;
              return res;
            } catch (reason) {
              if ('delete' in cache) {
                cache.delete(key);
              } else {
                cache.del(key);
              }
              throw reason;
            }
          })();

          cache.set(key, responsePromise);

          return responsePromise;
        }

        return responsePromise.then((res) => {
          (res as any).fromCache = true;
          (res as any).cacheTime = Date.now();
          if (key) (res as any).cacheKey = key;

          return res;
        });
      }

      return adapter(config);
    };
  };
}
