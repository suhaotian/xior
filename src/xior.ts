import defaultRequestInterceptor, { formUrl, likeGET } from './interceptors';
import type {
  XiorInterceptorRequestConfig,
  XiorPlugin,
  XiorRequestConfig,
  XiorResponse,
} from './types';
import {
  ClearableSignal,
  XiorTimeoutError,
  anySignal,
  isAbsoluteURL,
  XiorError,
  merge,
  joinPath,
} from './utils';

const supportAbortController = typeof AbortController !== 'undefined';

export type XiorInstance = xior;

export class xior {
  static create(options?: XiorRequestConfig): XiorInstance {
    return new xior(options);
  }
  static VERSION = '0.2.6';

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
  ) => Promise<XiorInterceptorRequestConfig> | XiorInterceptorRequestConfig)[] = [
    defaultRequestInterceptor,
  ];
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
          this.REQI = [this.REQI[0]];
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

  _plugins: XiorPlugin[] = [];
  get plugins() {
    return {
      use: (plugin: XiorPlugin) => {
        this._plugins.push(plugin);
        return plugin;
      },
      eject: (plugin: XiorPlugin) => {
        this._plugins = this._plugins.filter((item) => item !== plugin);
      },
      clear: () => {
        this._plugins = [];
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
    for (const item of this.REQI) {
      requestConfig = await item(requestConfig as XiorInterceptorRequestConfig);
    }

    let finalPlugin = this.fetch.bind(this);
    this._plugins.forEach((plugin) => {
      finalPlugin = plugin(finalPlugin);
    });
    return finalPlugin<T>(requestConfig);
  }

  async fetch<T>(requestConfig: XiorRequestConfig): Promise<XiorResponse<T>> {
    if (this._plugins.length > 0) {
      for (const item of this.REQI.slice(1)) {
        requestConfig = await item(requestConfig as XiorInterceptorRequestConfig);
      }
    }
    const {
      url,
      method,
      headers,
      timeout,
      signal: reqSignal,
      data,
      _data,
      ...rest
    } = requestConfig;

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

    let finalURL = requestConfig._url || url || '';
    if (requestConfig.baseURL && !isAbsoluteURL(finalURL)) {
      finalURL = joinPath(requestConfig.baseURL, finalURL);
    }

    const response = await fetch(finalURL, {
      body:
        likeGET(requestConfig.method) || requestConfig.headers?.['Content-Type'] === formUrl
          ? undefined
          : _data,
      ...rest,
      signal,
      method,
      headers,
    });

    if (timer) clearTimeout(timer);
    (signal as ClearableSignal)?.clear?.();

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

    if (requestConfig.method === 'HEAD') {
      return {
        data: undefined as T,
        request: requestConfig,
        ...commonRes,
      };
    }

    const { responseType } = requestConfig;
    if (!responseType || responseType === 'json' || responseType === 'text') {
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

  createGet<T>(method: string) {
    return (url: string, options?: XiorRequestConfig) => {
      return this.request<T>(options ? { ...options, method, url } : { method, url });
    };
  }

  createPost<T>(method: string) {
    return (url: string, data?: any, options?: XiorRequestConfig) => {
      return this.request<T>(options ? { ...options, method, url, data } : { method, url, data });
    };
  }

  get<T = any>(url: string, options?: XiorRequestConfig) {
    return this.createGet<T>('GET')(url, options);
  }
  head<T = any>(url: string, options?: XiorRequestConfig) {
    return this.createGet<T>('HEAD')(url, options);
  }

  post<T = any>(url: string, data?: any, options?: XiorRequestConfig) {
    return this.createPost<T>('POST')(url, data, options);
  }

  put<T = any>(url: string, data?: any, options?: XiorRequestConfig) {
    return this.createPost<T>('PUT')(url, data, options);
  }

  patch<T = any>(url: string, data?: any, options?: XiorRequestConfig) {
    return this.createPost<T>('PATCH')(url, data, options);
  }

  delete<T = any>(url: string, options?: XiorRequestConfig) {
    return this.createGet<T>('DELETE')(url, options);
  }

  options<T = any>(url: string, options?: XiorRequestConfig) {
    return this.createGet<T>('OPTIONS')(url, options);
  }
}
