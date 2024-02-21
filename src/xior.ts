import { defaultRequestInterceptor } from './interceptors';
import { XiorInterceptorRequestConfig, XiorRequestConfig } from './types';
import {
  ClearableSignal,
  XiorTimeoutError,
  anySignal,
  isAbsoluteURL,
  XiorError,
  merge,
} from './utils';

const supportAbortController = typeof AbortController !== 'undefined';

export class xior {
  static create(options?: XiorRequestConfig) {
    return new xior(options);
  }

  config?: XiorRequestConfig;
  constructor(options?: XiorRequestConfig) {
    this.config = options;
  }

  private requestInterceptors: ((
    config: XiorInterceptorRequestConfig
  ) => Promise<XiorInterceptorRequestConfig> | XiorInterceptorRequestConfig)[] = [
    defaultRequestInterceptor,
  ];
  private responseInterceptors: {
    fn: (config: { data: any; request: XiorInterceptorRequestConfig; response: Response }) =>
      | Promise<{
          data: any;
          request: XiorInterceptorRequestConfig;
          response: Response;
        }>
      | {
          data: any;
          request: XiorInterceptorRequestConfig;
          response: Response;
        };
    onRejected?: (error: any) => any;
  }[] = [];

  get interceptors() {
    return {
      request: {
        use: (
          fn: (
            config: XiorInterceptorRequestConfig
          ) => Promise<XiorInterceptorRequestConfig> | XiorInterceptorRequestConfig,
          /** @deprecated no need */
          onRejected?: (error: any) => any
        ) => {
          this.requestInterceptors.push(fn);
        },
      },
      response: {
        use: (
          fn: (config: { data: any; request: XiorInterceptorRequestConfig; response: Response }) =>
            | Promise<{
                data: any;
                request: XiorInterceptorRequestConfig;
                response: Response;
              }>
            | {
                data: any;
                request: XiorInterceptorRequestConfig;
                response: Response;
              },
          onRejected?: (error: any) => any
        ) => {
          this.responseInterceptors.push({ fn, onRejected });
        },
      },
    };
  }
  async request<T>(options?: XiorRequestConfig | string) {
    let requestObj: XiorRequestConfig = merge(
      this.config || {},
      typeof options === 'string' ? { url: options } : options || {},
      { headers: {}, params: {} }
    );

    for (const item of this.requestInterceptors) {
      requestObj = await item(requestObj as XiorInterceptorRequestConfig);
    }

    const { url: _url, method, headers, timeout, signal: reqSignal, data, ...rest } = requestObj;

    /** timeout */
    let signal: AbortSignal;
    const signals: AbortSignal[] = [];
    let timer: ReturnType<typeof setTimeout> | undefined = undefined;
    if (timeout && supportAbortController) {
      const controller = new AbortController();
      timer = setTimeout(() => {
        controller.abort(new XiorTimeoutError(`timeout of ${timeout}ms exceeded`));
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

    let finalURL = requestObj._url || _url || '';
    if (requestObj.baseURL && !isAbsoluteURL(finalURL)) {
      const baseURL = requestObj.baseURL.endsWith('/')
        ? requestObj.baseURL
        : requestObj.baseURL + '/';
      finalURL = baseURL + (finalURL.startsWith('/') ? finalURL.slice(1) : finalURL);
    }
    const response = await fetch(finalURL, {
      body: ['HEAD', 'GET'].includes(requestObj.method || 'GET') ? undefined : data,
      ...rest,
      signal,
      method,
      headers,
    });

    if (timer) clearTimeout(timer);
    (signal as ClearableSignal)?.clear?.();

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
        requestObj,
        {
          response,
          data,
          config: requestObj as XiorInterceptorRequestConfig,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        }
      );
      for (const item of this.responseInterceptors) {
        if (item.onRejected) {
          await item.onRejected(error);
        }
      }
      throw error;
    }

    if (requestObj.method === 'HEAD') {
      return {
        data: undefined as T,
        request: requestObj,
        config: requestObj,
        response,
        headers: response.headers,
        status: response.status,
        statusText: response.statusText,
      };
    }

    if (
      !requestObj.responseType ||
      requestObj.responseType === 'json' ||
      requestObj.responseType === 'text'
    ) {
      let data: {
        data: T;
      };
      try {
        data = {
          data: (await response.text()) as T,
        };
        try {
          if (data.data && requestObj.responseType !== 'text') {
            data.data = JSON.parse(data.data as string);
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          //
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        data = {
          data: undefined as T,
        };
      }
      let responseObj = {
        data: data.data,
        request: requestObj as XiorInterceptorRequestConfig,
        response,
      };

      for (const item of this.responseInterceptors) {
        responseObj = await item.fn(responseObj);
      }
      return {
        data: responseObj.data,
        request: requestObj,
        config: requestObj,
        response,
        headers: response.headers,
        status: response.status,
        statusText: response.statusText,
      };
    }

    return {
      data: undefined as T,
      request: requestObj,
      config: requestObj,
      response,
      headers: response.headers,
      status: response.status,
      statusText: response.statusText,
    };
  }

  private createGetHandler<T>(method: string) {
    return (url: string, options?: XiorRequestConfig) => {
      return this.request<T>(options ? { ...options, method, url } : { method, url });
    };
  }
  private createPostHandler<T>(method: string) {
    return (url: string, data?: any, options?: XiorRequestConfig) => {
      return this.request<T>(options ? { ...options, method, url, data } : { method, url, data });
    };
  }

  get<T = any>(url: string, options?: XiorRequestConfig) {
    return this.createGetHandler<T>('GET')(url, options);
  }
  head<T = any>(url: string, options?: XiorRequestConfig) {
    return this.createGetHandler<T>('HEAD')(url, options);
  }

  post<T = any>(url: string, data?: any, options?: XiorRequestConfig) {
    return this.createPostHandler<T>('POST')(url, data, options);
  }

  put<T = any>(url: string, data?: any, options?: XiorRequestConfig) {
    return this.createPostHandler<T>('PUT')(url, data, options);
  }

  patch<T = any>(url: string, data?: any, options?: XiorRequestConfig) {
    return this.createPostHandler<T>('PATCH')(url, data, options);
  }

  delete<T = any>(url: string, data?: any, options?: XiorRequestConfig) {
    return this.createPostHandler<T>('DELETE')(url, data, options);
  }

  options<T = any>(url: string, data?: any, options?: XiorRequestConfig) {
    return this.createPostHandler<T>('OPTIONS')(url, data, options);
  }
}
