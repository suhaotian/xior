import defaultRequestInterceptor from './interceptors';
import {
  DELETE,
  GET,
  HEAD,
  json,
  OPTIONS,
  PATCH,
  POST,
  PUT,
  text,
  undefinedValue,
  qs,
  status,
  h,
} from './shorts';
import type {
  XiorInterceptorOptions,
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
  encodeParams,
} from './utils';

const supportAbortController = typeof AbortController !== `${undefinedValue}`;
export type XiorInstance = Xior;
export type AxiosInstance = Xior;
export type Fetch = typeof fetch;

async function getResponseData(
  response: Response,
  responseType?:
    | 'json'
    | 'text'
    | 'blob'
    | 'arraybuffer'
    | 'stream'
    | 'document'
    | 'original'
    | 'custom'
) {
  let data: any;
  if (!responseType || !response.ok || [text, json].includes(responseType)) {
    data = await response[text]();
    if (data && responseType !== text) {
      try {
        data = JSON.parse(data);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {}
    }
  } else if (responseType === 'blob') {
    return response.blob();
  } else if (responseType === 'arraybuffer') {
    return response.arrayBuffer();
  }
  return data;
}

const createManager = <T>(array: T[]) => ({
  use: (item: T) => (array.push(item), item),
  eject: (key: T) => {
    array.splice(0, array.length, ...array.filter((x) => x !== key));
  },
  clear: () => (array.length = 0),
});

function createXiorInstance<T extends { request: XiorInstance['request'] }>(context: T) {
  const fn = context.request.bind(context);
  Object.assign(fn, context);
  Object.setPrototypeOf(fn, Object.getPrototypeOf(context));
  return fn as T & XiorInstance['request'];
}

const createXior = (options?: XiorRequestConfig) => {
  return createXiorInstance(new Xior(options));
};

export class Xior {
  static create = createXior;
  static VERSION = '0.8.2.alpha-0';

  config?: XiorRequestConfig;
  defaults: XiorInterceptorRequestConfig;

  constructor(options?: XiorRequestConfig) {
    this.config = options;
    this.defaults = {
      params: {},
      [h]: {},
    } as XiorInterceptorRequestConfig;
  }

  /** request interceptors */
  REQI: ((
    config: XiorInterceptorRequestConfig
  ) => Promise<XiorInterceptorRequestConfig> | XiorInterceptorRequestConfig)[] = [];
  /** response interceptors */
  RESI: {
    fn: (config: XiorResponse) => Promise<XiorResponse> | XiorResponse;
    /** error: XiorError | Error | TypeError */
    onRejected?: null | ((error: XiorError) => any);
  }[] = [];

  interceptors = {
    request: {
      ...createManager(this.REQI),
      use: (
        fn: (
          requestConfig: XiorInterceptorRequestConfig
        ) => Promise<XiorInterceptorRequestConfig> | XiorInterceptorRequestConfig,
        /** @deprecated useless here */
        onRejected?: null | ((error: any) => any),
        options?: XiorInterceptorOptions
      ) => {
        this.REQI.push(fn);
        return fn;
      },
    },
    response: {
      ...createManager(this.RESI),
      use: (
        fn: (config: XiorResponse) => Promise<XiorResponse> | XiorResponse,
        /** error: XiorError | Error | TypeError */
        onRejected?: null | ((error: XiorError) => any)
      ) => {
        const handler = { fn, onRejected };
        this.RESI.push(handler);
        return handler;
      },
    },
  };

  /** plugins */
  P: XiorPlugin[] = [];
  plugins = createManager(this.P);

  async request<T, R = XiorResponse<T>>(options: XiorRequestConfig | string) {
    let requestConfig: XiorRequestConfig = merge(
      this.config || {},
      this.defaults,
      typeof options === 'string' ? { url: options } : options
    );
    const credentials = 'credentials';
    if (requestConfig.withCredentials && !requestConfig[credentials]) {
      requestConfig[credentials] = 'include';
    }
    // qs: 'paramsSerializer'
    if (!requestConfig[qs]) {
      requestConfig[qs] = encodeParams;
    }
    for (const item of this.REQI) {
      requestConfig = await item(requestConfig as XiorInterceptorRequestConfig);
    }

    let finalPlugin = this._.bind(this);
    this.P.forEach((plugin) => {
      finalPlugin = plugin(finalPlugin, this);
    });
    let promise = finalPlugin<T>(requestConfig);

    if (!requestConfig._did) {
      let i = 0;
      const responseInterceptorChain: any[] = [];
      this.RESI.forEach(function pushResponseInterceptors(interceptor) {
        responseInterceptorChain.push(interceptor.fn, interceptor.onRejected);
      });
      while (responseInterceptorChain.length > i) {
        promise = promise.then(responseInterceptorChain[i++], responseInterceptorChain[i++]);
      }
    }

    return promise as Promise<R>;
  }

  /** @deprecated for internal use only */
  async _<T>(requestConfig: XiorRequestConfig): Promise<XiorResponse<T>> {
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
      fetch: _fetch,
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
    if (reqSignal) signals.push(reqSignal);
    signal = signals[0];
    if (signals.length > 1) {
      signal = anySignal(signals, () => {
        clearTimeout(timer);
      });
    }

    let finalURL = _url || url;
    const baseURL = 'baseURL';
    if (requestConfig[baseURL] && !isAbsoluteURL(finalURL)) {
      finalURL = joinPath(requestConfig[baseURL], finalURL);
    }

    return ((_fetch as Fetch) || fetch)(finalURL, {
      body: isGet ? undefinedValue : _data,
      ...rest,
      signal,
      method,
      headers,
    })
      .then(async (response) => {
        const { responseType } = requestConfig;
        const data = await getResponseData(response, responseType);
        const commonRes = {
          data,
          response,
          config: requestConfig as XiorInterceptorRequestConfig,
          request: requestConfig as XiorInterceptorRequestConfig,
          [status]: response[status],
          statusText: response.statusText,
          [h]: response[h],
        };
        if (!response.ok) {
          const error = new XiorError(
            !response[status]
              ? `Network error`
              : `Request failed with status code ${response[status]}`,
            requestConfig,
            commonRes
          );
          return Promise.reject(error);
        }
        return commonRes;
      })
      .finally(() => {
        if (timer) clearTimeout(timer);
        (signal as ClearableSignal)?.clear?.();
      });
  }

  /** create get like method */
  cG<T>(method: string) {
    return (url: string | XiorRequestConfig, options?: XiorRequestConfig) => {
      return this.request<T>(
        typeof url === 'string' ? { ...options, method, url } : { ...url, ...options, method }
      );
    };
  }

  /** create post like method */
  cP<T>(method: string) {
    return (url: string | XiorRequestConfig, data?: any, options?: XiorRequestConfig) => {
      return this.request<T>(
        typeof url === 'string'
          ? { data, ...options, method, url }
          : { data, ...url, ...options, method }
      );
    };
  }

  get<T = any, R = XiorResponse<T>>(
    url: string | XiorRequestConfig,
    options?: XiorRequestConfig & {
      /** @deprecated No `data` in `GET` method */
      data?: any;
    }
  ) {
    return this.cG<T>(GET)(url, options) as Promise<R>;
  }
  head<T = any, R = XiorResponse<T>>(
    url: string | XiorRequestConfig,
    options?: XiorRequestConfig & {
      /** @deprecated No `data` in `HEAD` method */
      data?: any;
    }
  ) {
    return this.cG<T>(HEAD)(url, options) as Promise<R>;
  }

  post<T = any, R = XiorResponse<T>>(
    url: string | XiorRequestConfig,
    data?: any,
    options?: XiorRequestConfig
  ) {
    return this.cP<T>(POST)(url, data, options) as Promise<R>;
  }

  put<T = any, R = XiorResponse<T>>(
    url: string | XiorRequestConfig,
    data?: any,
    options?: XiorRequestConfig
  ) {
    return this.cP<T>(PUT)(url, data, options) as Promise<R>;
  }

  patch<T = any, R = XiorResponse<T>>(
    url: string | XiorRequestConfig,
    data?: any,
    options?: XiorRequestConfig
  ) {
    return this.cP<T>(PATCH)(url, data, options) as Promise<R>;
  }

  delete<T = any, R = XiorResponse<T>>(
    url: string | XiorRequestConfig,
    options?: XiorRequestConfig
  ) {
    return this.cG<T>(DELETE)(url, options) as Promise<R>;
  }

  options<T = any, R = XiorResponse<T>>(
    url: string | XiorRequestConfig,
    options?: XiorRequestConfig & {
      /** @deprecated No `data` in `OPTIONS` method */
      data?: any;
    }
  ) {
    return this.cG<T>(OPTIONS)(url, options);
  }
}
