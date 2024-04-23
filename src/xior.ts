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
  XiorInterceptorOptions,
  XiorInterceptorRequestConfig,
  XiorPlugin,
  XiorRequestConfig,
  XiorResponse,
  XiorResponseInterceptorConfig,
} from './types';

const supportAbortController = typeof AbortController !== 'undefined';
const undefinedValue = undefined;
export type XiorInstance = xior;

async function getData(
  response: Response,
  responseType?: 'json' | 'text' | 'stream' | 'document' | 'arraybuffer' | 'blob' | 'original'
) {
  let data: any;
  if (!responseType || !response.ok || ['text', 'json'].includes(responseType)) {
    data = await response.text();
    if (data && responseType !== 'text') {
      try {
        data = JSON.parse(data);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {}
    }
  } else if (responseType === 'blob') {
    data = await response.blob();
  } else if (responseType === 'arraybuffer') {
    data = await response.arrayBuffer();
  }
  return data;
}

export class xior {
  static create(options?: XiorRequestConfig): XiorInstance {
    return new xior(options);
  }
  static VERSION = '0.3.12';

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
    fn: (
      config: XiorResponseInterceptorConfig
    ) => Promise<XiorResponseInterceptorConfig> | XiorResponseInterceptorConfig;
    onRejected?: null | ((error: XiorError) => any);
  }[] = [];

  get interceptors() {
    return {
      request: {
        use: (
          fn: (
            config: XiorInterceptorRequestConfig
          ) => Promise<XiorInterceptorRequestConfig> | XiorInterceptorRequestConfig,
          /** @deprecated useless here */
          onRejected?: null | ((error: any) => any),
          options?: XiorInterceptorOptions
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
          fn: (
            config: XiorResponseInterceptorConfig
          ) => Promise<XiorResponseInterceptorConfig> | XiorResponseInterceptorConfig,
          onRejected?: null | ((error: XiorError) => any)
        ) => {
          this.RESI.push({ fn, onRejected });
          return fn;
        },
        eject: (
          fn: (
            config: XiorResponseInterceptorConfig
          ) => Promise<XiorResponseInterceptorConfig> | XiorResponseInterceptorConfig
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
    let timer: ReturnType<typeof setTimeout> | undefined = undefinedValue;
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

    const handleResponseRejects = async (error: XiorError) => {
      let hasReject = false;
      for (const item of this.RESI) {
        if (item.onRejected) {
          hasReject = true;
          const res = await item.onRejected(error);
          if (res?.response?.ok) return res;
        }
      }
      if (!hasReject) throw error;
    };

    let response: Response;
    try {
      response = await fetch(finalURL, {
        body: isGet ? undefinedValue : _data,
        ...rest,
        signal,
        method,
        headers,
      });
    } catch (e) {
      await handleResponseRejects(e as XiorError);
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
    const { responseType } = requestConfig;
    if (!response.ok) {
      const data = await getData(response, responseType);

      const error = new XiorError(
        !response.status ? `Network error` : `Request failed with status code ${response.status}`,
        requestConfig,
        {
          data,
          ...commonRes,
        }
      );
      await handleResponseRejects(error);
      throw error;
    }

    if (method === 'HEAD') {
      return {
        data: undefinedValue as T,
        request: requestConfig,
        ...commonRes,
      };
    }

    const result = await getData(response, responseType);

    try {
      let lastRes = {
        ...commonRes,
        data: result as T,
        config: requestConfig as XiorInterceptorRequestConfig,
        request: requestConfig as XiorInterceptorRequestConfig,
        response,
      };
      for (const item of this.RESI) {
        // eslint-disable-next-line no-inner-declarations
        async function run() {
          return item.fn(lastRes);
        }
        const res = await run().catch(async (error) => {
          await handleResponseRejects(error as XiorError);
        });
        if (res) {
          lastRes = res;
        }
      }
      return lastRes;
    } catch (error) {
      await handleResponseRejects(error as XiorError);
      throw error;
    }
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
