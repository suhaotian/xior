// @ts-ignore
import { joinPath, isAbsoluteURL, buildSortedURL } from 'xior/utils';

import type { XiorPlugin, XiorRequestConfig } from '../types';

export type XiorDedupeOptions = {
  /**
   * check if we need enable throttle, default only `GET` method or`isGet: true` enable
   */
  enableDedupe?: boolean | ((config?: XiorRequestConfig) => boolean);
  onDedupe?: (config: XiorRequestConfig) => void;
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
  const { enableDedupe: _enableDedupe, onDedupe: _onDedupe } = options;

  return function (adapter) {
    return async (config) => {
      const {
        paramsSerializer,
        enableDedupe = _enableDedupe,
        onDedupe = _onDedupe,
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
        config.url && isAbsoluteURL(config.url)
          ? config.url
          : joinPath(config.baseURL || '', config.url || ''),
        { a: config.data, b: config.params },
        paramsSerializer as (obj: Record<string, any>) => string
      );
      if (!inflight.has(key)) {
        inflight.set(key, []);
      } else {
        if (onDedupe) onDedupe(config);
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
