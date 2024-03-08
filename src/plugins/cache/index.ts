import { lru } from 'tiny-lru';

import buildSortedURL from './build-sorted-url';
import { ICacheLike } from './utils';
import type { XiorPlugin, XiorRequestConfig, XiorResponse } from '../../types';

type XiorPromise = Promise<XiorResponse>;

export type XiorCacheOptions = {
  /**
   * check if we need enable cache, default only `GET` method enable cache
   */
  enableCache?: boolean | ((config?: XiorRequestConfig) => boolean);
  defaultCache?: ICacheLike<XiorPromise>;
};

/** @ts-ignore */
declare module 'xior' {
  interface XiorRequestConfig extends XiorCacheOptions {
    /** forceUpdate, default: false */
    forceUpdate?: boolean;
  }
  interface XiorResponse {
    fromCache?: boolean;
  }
}

export default function xiorCachePlugin(options: XiorCacheOptions = {}): XiorPlugin {
  const { enableCache: _enableCache, defaultCache: _defaultCache = lru(100, 1000 * 60 * 5) } =
    options;

  return function (adapter) {
    return async (config) => {
      const {
        enableCache = _enableCache,
        forceUpdate,
        defaultCache = _defaultCache,
        _url,
        encode,
        data,
      } = config as XiorCacheOptions & {
        forceUpdate?: boolean;
      } & XiorRequestConfig;

      const isGet = config.method === 'GET' || config.isGet;

      const t = typeof enableCache;
      const enabled =
        t === 'undefined'
          ? isGet
          : t === 'function'
            ? (enableCache as Function)(config)
            : Boolean(enableCache);

      if (enabled) {
        const cache: ICacheLike<XiorPromise> = defaultCache;

        const index = buildSortedURL(
          _url as string,
          data,
          encode as (obj: Record<string, any>) => string
        );
        let responsePromise = cache.get(index);

        if (!responsePromise || forceUpdate) {
          responsePromise = (async () => {
            try {
              return await adapter(config);
            } catch (reason) {
              if ('delete' in cache) {
                cache.delete(index);
              } else {
                cache.del(index);
              }
              throw reason;
            }
          })();

          cache.set(index, responsePromise);

          return responsePromise;
        }

        return responsePromise.then((res) => {
          (res as any).fromCache = true;
          return res;
        });
      }

      return adapter(config);
    };
  };
}
