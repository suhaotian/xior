import { lru } from 'tiny-lru';
// @ts-ignore
import { buildSortedURL, isAbsoluteURL, joinPath } from 'xior/utils';

import { ICacheLike } from './utils';
import type { XiorPlugin, XiorRequestConfig, XiorResponse } from '../../types';

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
  }
}

export default function xiorCachePlugin(options: XiorCacheOptions = {}): XiorPlugin {
  const {
    enableCache: _enableCache,
    defaultCache: _defaultCache = lru(
      options.cacheItems || 100,
      options.cacheTime || 1000 * 60 * 5
    ),
  } = options;

  return function (adapter) {
    return async (config) => {
      const {
        enableCache = _enableCache,
        forceUpdate,
        defaultCache = _defaultCache,
        paramsSerializer,
      } = config as XiorCacheOptions & {
        forceUpdate?: boolean;
      } & XiorRequestConfig;

      const isGet = config.method === 'GET' || config.isGet;

      const t = typeof enableCache;
      let enabled: boolean | undefined = undefined;
      if (t === 'function') {
        enabled = (enableCache as (config: XiorRequestConfig) => boolean | undefined)(config);
      }
      if (enabled === undefined) {
        enabled = t === 'undefined' ? isGet : Boolean(enableCache);
      }

      if (enabled) {
        const cache: ICacheLike<XiorPromise> = defaultCache;

        const index = buildSortedURL(
          config.url && isAbsoluteURL(config.url)
            ? config.url
            : joinPath(config.baseURL, config.url),
          { a: config.data, b: config.params },
          paramsSerializer as (obj: Record<string, any>) => string
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
          (res as any).cacheTime = Date.now();
          return res;
        });
      }

      return adapter(config);
    };
  };
}
