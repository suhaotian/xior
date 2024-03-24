import buildSortedURL from './cache/build-sorted-url';
import { ICacheLike } from './utils';
import type { XiorPlugin, XiorRequestConfig, XiorResponse } from '../types';
import { XiorError, joinPath, isAbsoluteURL } from '../utils';

const _cache: Record<string, XiorResponse> = {};
const cacheObj = {
  get(key: string) {
    return _cache[key];
  },
  set(key: string, result: XiorResponse) {
    _cache[key] = result;
  },
};

export type XiorErrorCacheOptions = {
  /**
   * check if we need enable cache, default only `GET` method or`isGet: true` enable cache
   */
  enableCache?: boolean | ((config?: XiorRequestConfig) => boolean);
  defaultCache?: ICacheLike<XiorResponse>;
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
  const { enableCache: _enableCache, defaultCache: _defaultCache = cacheObj } = options;

  return function (adapter) {
    return async (config) => {
      const {
        enableCache = _enableCache,
        defaultCache = _defaultCache,
        paramsSerializer,
      } = config as XiorErrorCacheOptions & XiorRequestConfig;

      const isGet = config.method === 'GET' || config.isGet;

      const t = typeof enableCache;
      const enabled =
        t === 'undefined'
          ? isGet
          : t === 'function'
            ? (enableCache as Function)(config)
            : Boolean(enableCache);

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
        const res = await adapter(config);
        cache.set(index, res);
        return res;
      } catch (e) {
        const res = cache.get(index);
        if (res) {
          (res as any).fromCache = true;
          (res as any).error = e;
          return res;
        }
        throw e;
      }
    };
  };
}
