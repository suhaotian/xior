import buildSortedURL from './cache/build-sorted-url';
import type { XiorPlugin, XiorRequestConfig } from '../types';

export type XiorDedupeOptions = {
  /**
   * check if we need enable throttle, default only `GET` method or`isGet: true` enable
   */
  enableDedupe?: boolean | ((config?: XiorRequestConfig) => boolean);
};

/** @ts-ignore */
declare module 'xior' {
  interface XiorRequestConfig extends Omit<XiorDedupeOptions, 'dedupeCache'> {
    //
  }
}

export const inflight = new Map<string, any[]>();

/*
 * Prevents having multiple identical requests on the fly at the same time.
 */
export default function xiorDedupePlugin(options: XiorDedupeOptions = {}): XiorPlugin {
  const { enableDedupe: _enableDedupe } = options;

  return function (adapter) {
    return async (config) => {
      const {
        _url,
        encode,
        enableDedupe = _enableDedupe,
        data,
      } = config as XiorDedupeOptions & XiorRequestConfig;

      const isGet = config.method === 'GET' || config.isGet;

      const t = typeof enableDedupe;
      const enabled =
        t === 'undefined'
          ? isGet
          : t === 'function'
            ? (enableDedupe as Function)(config)
            : Boolean(enableDedupe);

      if (!enabled) {
        return adapter(config);
      }

      const key = buildSortedURL(
        _url as string,
        data,
        encode as (obj: Record<string, any>) => string
      );
      if (!inflight.has(key)) {
        inflight.set(key, []);
      } else {
        return new Promise((resolve, reject) => {
          inflight.get(key)?.push([resolve, reject]);
        });
      }
      try {
        const response = await adapter(config);
        inflight.get(key)?.forEach(([resolve]) => resolve(response));
        inflight.delete(key);
        return response;
      } catch (error) {
        inflight.get(key)?.forEach(([, reject]) => reject(error));
        inflight.delete(key);
        throw error;
      }
    };
  };
}
