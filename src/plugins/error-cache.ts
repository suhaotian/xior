import { lru } from 'tiny-lru';

import { ICacheLike } from './utils';
import type { XiorPlugin, XiorRequestConfig, XiorResponse } from '../types';
import { XiorError, joinPath, isAbsoluteURL, buildSortedURL } from '../utils';
import { f, GET, undefinedValue } from '../shorts';
import { mergeConfig } from '..';

export type XiorErrorCacheOptions = {
  /**
   * check if we need enable cache, default only `GET` method or`isGet: true` enable cache @error-cache-plugin
   */
  enableCache?: boolean | ((config?: XiorRequestConfig) => boolean);
  defaultCache?: ICacheLike<{ loading?: boolean; res?: XiorResponse; cacheTime?: number }>;
  /** if `useCacheFirst: true` and have cache, will return the cache response first, then run fetching in the background  @error-cache-plugin  */
  useCacheFirst?: boolean;
  /** for logging purpose @error-cache-plugin */
  onCacheRequest?: (config?: XiorRequestConfig) => void;
  /** max cache numbers in LRU, default is 100 */
  cacheItems?: number;

  /** Process the config before generating the key based on data/params. The config is a new object, not a request reference. */
  normalizeParams?: (config: XiorRequestConfig) => XiorRequestConfig;
};

/** @ts-ignore */
declare module 'xior' {
  interface XiorRequestConfig extends Omit<XiorErrorCacheOptions, 'cacheItems'> {
    //
  }
  interface XiorResponse {
    fromCache?: boolean;
    error?: XiorError;
    cacheTime?: number;
  }
}

export default function xiorErrorCachePlugin(options: XiorErrorCacheOptions = {}): XiorPlugin {
  const {
    enableCache: _enableCache,
    normalizeParams: _normalizeParams,
    defaultCache: _defaultCache = lru<{
      loading?: boolean;
      res?: XiorResponse;
      cacheTime?: number;
    }>(options.cacheItems || 100),
    useCacheFirst: _inBg,
    onCacheRequest: _cacheRequest,
  } = options;

  return function (adapter) {
    return async (config) => {
      const {
        enableCache = _enableCache,
        normalizeParams = _normalizeParams,
        defaultCache = _defaultCache,
        useCacheFirst = _inBg,
        onCacheRequest = _cacheRequest,
        paramsSerializer,
      } = config as XiorErrorCacheOptions & XiorRequestConfig;

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

      if (!enabled) return adapter(config);

      const cache = defaultCache;
      const { data, params } = normalizeParams?.(mergeConfig(config, {})) || config;
      const index = buildSortedURL(
        config.url && isAbsoluteURL(config.url) ? config.url : joinPath(config.baseURL, config.url),
        { a: data, b: params },
        paramsSerializer as (obj: Record<string, any>) => string
      );

      try {
        if (useCacheFirst) {
          const result = cache.get(index);
          cache.set(index, { loading: true, res: result?.res, cacheTime: result?.cacheTime });
          if (result?.res) {
            if (!result?.loading) {
              onCacheRequest?.(config);
              (async () => {
                try {
                  const res = await adapter(config);
                  cache.set(index, { loading: false, res, cacheTime: Date.now() });
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (e) {
                  const result = cache.get(index);
                  if (useCacheFirst)
                    cache.set(index, {
                      loading: false,
                      res: result?.res,
                      cacheTime: result?.cacheTime,
                    });
                }
              })();
            }
            (result as any).res.fromCache = true;
            (result as any).res.cacheTime = result?.cacheTime;
            return result?.res;
          }
        }
        const res = await adapter(config);
        cache.set(index, { loading: false, res, cacheTime: Date.now() });
        return res;
      } catch (e) {
        const result = cache.get(index);
        if (useCacheFirst)
          cache.set(index, { loading: false, res: result?.res, cacheTime: result?.cacheTime });
        if (result?.res) {
          (result as any).res.fromCache = true;
          (result as any).res.error = e;
          (result as any).res.cacheTime = result?.cacheTime;
          return result.res;
        }
        throw e;
      }
    };
  };
}
