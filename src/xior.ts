import {
  ClearableSignal,
  XiorTimeoutError,
  anySignal,
  isAbsoluteURL,
  XiorError,
  merge,
  joinPath,
  encodeParams,
  // @ts-ignore
} from 'xior/utils';

import defaultRequestInterceptor from './interceptors';
import type {
  XiorInterceptorRequestConfig,
  XiorPlugin,
  XiorRequestConfig,
  XiorResponse,
} from './types';

const supportAbortController = typeof AbortController !== 'undefined';

export type XiorInstance = xior;

export class xior {
  static create(options?: XiorRequestConfig): XiorInstance {
    return new xior(options);
  }
  static VERSION = '0.3.11';

  config?: XiorRequestConfig;
  defaults: XiorInterceptorRequestConfig;

  constructor(options?: XiorRequestConfig) {
    this.config = options;
    this.defaults = {
      params: {},
      headers: {},
    } as XiorInterceptorRequestConfig;
  }

  /** request interceptors */
  REQI: ((
    config: XiorInterceptorRequestConfig
  ) => Promise<XiorInterceptorRequestConfig> | XiorInterceptorRequestConfig)[] = [];
  /** response interceptors */
  RESI: {
    fn: (config: {
      data: any;
      config: XiorInterceptorRequestConfig;
      request: XiorInterceptorRequestConfig;
      response: Response;
    }) =>
      | Promise<{
          data: any;
          config: XiorInterceptorRequestConfig;
          request: XiorInterceptorRequestConfig;
          response: Response;
        }>
      | {
          data: any;
          config: XiorInterceptorRequestConfig;
          request: XiorInterceptorRequestConfig;
          response: Response;
        };
    onRejected?: (error: XiorError) => any;
  }[] = [];

  get interceptors() {
    return {
      request: {
        use: (
          fn: (
            config: XiorInterceptorRequestConfig
          ) => Promise<XiorInterceptorRequestConfig> | XiorInterceptorRequestConfig,
          /** @deprecated useless here */
          onRejected?: (error: any) => any
        ) => {
          this.REQI.push(fn);
          return fn;
        },
        eject: (
          fn: (
            config: XiorInterceptorRequestConfig
          ) => Promise<XiorInterceptorRequestConfig> | XiorInterceptorRequestConfig
        ) => {
          this.REQI = this.REQI.filter((item) => item !== fn);
        },
        clear: () => {
          this.REQI = [];
        },
      },
      response: {
        use: (
          fn: (config: {
            data: any;
            config: XiorInterceptorRequestConfig;
            request: XiorInterceptorRequestConfig;
            response: Response;
          }) =>
            | Promise<{
                data: any;
                config: XiorInterceptorRequestConfig;
                request: XiorInterceptorRequestConfig;
                response: Response;
              }>
            | {
                data: any;
                config: XiorInterceptorRequestConfig;
                request: XiorInterceptorRequestConfig;
                response: Response;
              },
          onRejected?: (error: XiorError) => any
        ) => {
          this.RESI.push({ fn, onRejected });
          return fn;
        },
        eject: (
          fn: (config: {
            data: any;
            config: XiorInterceptorRequestConfig;
            request: XiorInterceptorRequestConfig;
            response: Response;
          }) =>
            | Promise<{
                data: any;
                config: XiorInterceptorRequestConfig;
                request: XiorInterceptorRequestConfig;
                response: Response;
              }>
            | {
                data: any;
                config: XiorInterceptorRequestConfig;
                request: XiorInterceptorRequestConfig;
                response: Response;
              }
        ) => {
          this.RESI = this.RESI.filter((item) => item.fn !== fn);
        },
        clear: () => {
          this.RESI = [];
        },
      },
    };
  }

  /** plugins */
  P: XiorPlugin[] = [];
  get plugins() {
    return {
      use: (plugin: XiorPlugin) => {
        this.P.push(plugin);
        return plugin;
      },
      eject: (plugin: XiorPlugin) => {
        this.P = this.P.filter((item) => item !== plugin);
      },
      clear: () => {
        this.P = [];
      },
    };
  }

  async request<T>(options?: XiorRequestConfig | string) {
    let requestConfig: XiorRequestConfig = merge(
      {},
      this.config || {},
      this.defaults || {},
      typeof options === 'string' ? { url: options } : options || {},
      { headers: {}, params: {} }
    );
    if (!requestConfig.paramsSerializer) {
      requestConfig.paramsSerializer = encodeParams;
    }
    for (const item of this.REQI) {
      requestConfig = await item(requestConfig as XiorInterceptorRequestConfig);
    }

    let finalPlugin = this.fetch.bind(this);
    this.P.forEach((plugin) => {
      finalPlugin = plugin(finalPlugin, this);
    });
    return finalPlugin<T>(requestConfig);
  }

  async fetch<T>(requestConfig: XiorRequestConfig): Promise<XiorResponse<T>> {
    const {
      url,
      method,
      headers,
      timeout,
      signal: reqSignal,
      data,
      _data,
      _url,
      isGet,
      ...rest
    } = await defaultRequestInterceptor(requestConfig as XiorInterceptorRequestConfig);
    requestConfig._url = _url;

    /** timeout */
    let signal: AbortSignal;
    const signals: AbortSignal[] = [];
    let timer: ReturnType<typeof setTimeout> | undefined = undefined;
    if (timeout && supportAbortController) {
      const controller = new AbortController();
      timer = setTimeout(() => {
        controller.abort(new XiorTimeoutError(`timeout of ${timeout}ms exceeded`, requestConfig));
      }, timeout);
      signals.push(controller.signal);
    }
    if (reqSignal) {
      signals.push(reqSignal);
    }
    signal = signals[0];
    if (signals.length > 1) {
      signal = anySignal(signals, () => {
        clearTimeout(timer);
      });
    }

    let finalURL = _url || url || '';
    if (requestConfig.baseURL && !isAbsoluteURL(finalURL)) {
      finalURL = joinPath(requestConfig.baseURL, finalURL);
    }

    let response: Response;
    try {
      response = await fetch(finalURL, {
        body: isGet ? undefined : _data,
        ...rest,
        signal,
        method,
        headers,
      });
    } catch (e) {
      for (const item of this.RESI) {
        if (item.onRejected) {
          await item.onRejected(e as XiorError);
        }
      }
      throw e;
    } finally {
      if (timer) clearTimeout(timer);
      (signal as ClearableSignal)?.clear?.();
    }

    const commonRes = {
      response,
      config: requestConfig as XiorInterceptorRequestConfig,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    };
    if (!response.ok) {
      let data: any = undefined;
      try {
        data = await response.text();
        if (data) {
          data = JSON.parse(data);
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {}
      const error = new XiorError(
        !response.status ? `Network error` : `Request failed with status code ${response.status}`,
        requestConfig,
        {
          data,
          ...commonRes,
        }
      );
      for (const item of this.RESI) {
        if (item.onRejected) {
          const res = await item.onRejected(error);
          if (res?.response?.ok) return res;
        }
      }
      throw error;
    }

    if (method === 'HEAD') {
      return {
        data: undefined as T,
        request: requestConfig,
        ...commonRes,
      };
    }

    const { responseType } = requestConfig;
    if (!responseType || ['json', 'text'].includes(responseType)) {
      let data: any;
      try {
        data = (await response.text()) as T;
        if (data && responseType !== 'text') {
          data = JSON.parse(data as string);
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        //
      }
      let responseObj = {
        data: data as T,
        config: requestConfig as XiorInterceptorRequestConfig,
        request: requestConfig as XiorInterceptorRequestConfig,
        response,
      };

      for (const item of this.RESI) {
        responseObj = await item.fn(responseObj);
      }
      return {
        data: responseObj.data,
        request: requestConfig,
        ...commonRes,
      };
    }

    return {
      data: undefined as T,
      request: requestConfig,
      ...commonRes,
    };
  }

  /** create get method */
  cG<T>(method: string) {
    return (url: string, options?: XiorRequestConfig) => {
      return this.request<T>(options ? { ...options, method, url } : { method, url });
    };
  }

  /** create post method */
  cP<T>(method: string) {
    return (url: string, data?: any, options?: XiorRequestConfig) => {
      return this.request<T>(options ? { ...options, method, url, data } : { method, url, data });
    };
  }

  get<T = any>(
    url: string,
    options?: XiorRequestConfig & {
      /** @deprecated No `data` in `GET` method */
      data?: any;
    }
  ) {
    return this.cG<T>('GET')(url, options);
  }
  head<T = any>(
    url: string,
    options?: XiorRequestConfig & {
      /** @deprecated No `data` in `HEAD` method */
      data?: any;
    }
  ) {
    return this.cG<T>('HEAD')(url, options);
  }

  post<T = any>(url: string, data?: any, options?: XiorRequestConfig) {
    return this.cP<T>('POST')(url, data, options);
  }

  put<T = any>(url: string, data?: any, options?: XiorRequestConfig) {
    return this.cP<T>('PUT')(url, data, options);
  }

  patch<T = any>(url: string, data?: any, options?: XiorRequestConfig) {
    return this.cP<T>('PATCH')(url, data, options);
  }

  delete<T = any>(url: string, options?: XiorRequestConfig) {
    return this.cG<T>('DELETE')(url, options);
  }

  options<T = any>(
    url: string,
    options?: XiorRequestConfig & {
      /** @deprecated No `data` in `OPTIONS` method */
      data?: any;
    }
  ) {
    return this.cG<T>('OPTIONS')(url, options);
  }
}
