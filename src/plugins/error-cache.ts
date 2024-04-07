// @ts-ignore
import { XiorError, joinPath, isAbsoluteURL, buildSortedURL } from 'xior/utils';

import { ICacheLike } from './utils';
import type { XiorPlugin, XiorRequestConfig, XiorResponse } from '../types';

const _cache: Record<string, { loading?: boolean; res?: XiorResponse }> = {};
const cacheObj = {
  get(key: string) {
    return _cache[key];
  },
  set(key: string, result: { loading?: boolean; res?: XiorResponse }) {
    _cache[key] = result;
  },
};

export type XiorErrorCacheOptions = {
  /**
   * check if we need enable cache, default only `GET` method or`isGet: true` enable cache @error-cache-plugin
   */
  enableCache?: boolean | ((config?: XiorRequestConfig) => boolean);
  defaultCache?: ICacheLike<{ loading?: boolean; res?: XiorResponse }>;
  /** if `useCacheFirst: true` and have cache, will return the cache response first, then run fetching in the background  @error-cache-plugin  */
  useCacheFirst?: boolean;
  /** for logging purpose @error-cache-plugin */
  onCacheRequest?: (config?: XiorRequestConfig) => void;
};

/** @ts-ignore */
declare module 'xior' {
  interface XiorRequestConfig extends XiorErrorCacheOptions {
    //
  }
  interface XiorResponse {
    fromCache?: boolean;
    error?: XiorError;
  }
}

export default function xiorErrorCachePlugin(options: XiorErrorCacheOptions = {}): XiorPlugin {
  const {
    enableCache: _enableCache,
    defaultCache: _defaultCache = cacheObj,
    useCacheFirst: _inBg,
    onCacheRequest: _cacheRequest,
  } = options;

  return function (adapter) {
    return async (config) => {
      const {
        enableCache = _enableCache,
        defaultCache = _defaultCache,
        useCacheFirst = _inBg,
        onCacheRequest = _cacheRequest,
        paramsSerializer,
      } = config as XiorErrorCacheOptions & XiorRequestConfig;

      const isGet = config.method === 'GET' || config.isGet;

      const t = typeof enableCache;
      let enabled: boolean | undefined = undefined;
      if (t === 'function') {
        enabled = (enableCache as (config: XiorRequestConfig) => boolean | undefined)(config);
      }
      if (enabled === undefined) {
        enabled = t === 'undefined' ? isGet : Boolean(enableCache);
      }

      if (!enabled) return adapter(config);

      const cache = defaultCache;

      const index = buildSortedURL(
        config.url && isAbsoluteURL(config.url)
          ? config.url
          : joinPath(config.baseURL || '', config.url || ''),
        { a: config.data, b: config.params },
        paramsSerializer as (obj: Record<string, any>) => string
      );

      try {
        if (useCacheFirst) {
          const result = cache.get(index);
          cache.set(index, { loading: true, res: result?.res });
          if (result?.res) {
            if (!result?.loading) {
              onCacheRequest?.(config);
              (async () => {
                try {
                  const res = await adapter(config);
                  cache.set(index, { loading: false, res });
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (e) {
                  const result = cache.get(index);
                  if (useCacheFirst) cache.set(index, { loading: false, res: result?.res });
                }
              })();
            }
            (result as any).res.fromCache = true;
            return result?.res;
          }
        }
        const res = await adapter(config);
        cache.set(index, { loading: false, res });
        return res;
      } catch (e) {
        const result = cache.get(index);
        if (useCacheFirst) cache.set(index, { loading: false, res: result?.res });
        if (result?.res) {
          (result as any).res.fromCache = true;
          (result as any).res.error = e;
          return result.res;
        }
        throw e;
      }
    };
  };
}
