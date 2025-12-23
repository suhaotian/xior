import { mergeConfig } from '..';
import { f, GET, undefinedValue } from '../shorts';
import type { XiorPlugin, XiorRequestConfig } from '../types';
import { joinPath, isAbsoluteURL, buildSortedURL } from '../utils';

export type XiorDedupeOptions = {
  /**
   * check if we need enable throttle, default only `GET` method or`isGet: true` enable
   */
  enableDedupe?: boolean | ((config?: XiorRequestConfig) => boolean);
  onDedupe?: (config: XiorRequestConfig) => void;
  /** 
  Process the config before generating the key based on data/params. The config is a new object, not a request reference. */
  normalizeParams?: (config: XiorRequestConfig) => XiorRequestConfig;
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
  const {
    enableDedupe: _enableDedupe,
    onDedupe: _onDedupe,
    normalizeParams: _normalizeParams,
  } = options;

  return function (adapter) {
    return async (config) => {
      const {
        paramsSerializer,
        enableDedupe = _enableDedupe,
        normalizeParams = _normalizeParams,
        onDedupe = _onDedupe,
      } = config as XiorDedupeOptions & XiorRequestConfig;

      const isGet = config.method === GET || config.isGet;
      const typeOfEnable = typeof enableDedupe;
      const enableIsFunction = typeOfEnable === f;

      let enabled: boolean | undefined = undefinedValue;
      if (enableIsFunction) {
        enabled = (enableDedupe as (config: XiorRequestConfig) => boolean | undefined)(config);
      }
      if (enabled === undefinedValue) {
        enabled =
          enableIsFunction || typeOfEnable === `${undefinedValue}` ? isGet : Boolean(enableDedupe);
      }

      if (!enabled) {
        return adapter(config);
      }
      const { data, params } = normalizeParams?.(mergeConfig(config, {})) || config;
      const key = buildSortedURL(
        config.url && isAbsoluteURL(config.url) ? config.url : joinPath(config.baseURL, config.url),
        { a: data, b: params },
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
