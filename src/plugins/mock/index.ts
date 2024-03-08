import { MockHeaders, StatusOrCallback, VERBS } from './types';
import type { XiorInterceptorRequestConfig, XiorPlugin, XiorRequestConfig } from '../../types';
import {
  XiorError,
  XiorTimeoutError,
  buildSortedURL,
  delay,
  encodeParams,
  merge,
} from '../../utils';
import { xior } from '../../xior';

export interface MockOptions {
  delayResponse?: number;
  onNoMatch?: 'passthrough' | 'throwException';
}

const ReplyOnceLength = 6;
const PassThroughLength = 2;
const ReplyDelayLength = 7;

export class MockError extends Error {
  request?: XiorRequestConfig;
  config?: XiorInterceptorRequestConfig<any>;

  constructor(message: string, request?: XiorInterceptorRequestConfig<any>) {
    super(message);
    this.request = request;
    this.config = request;
  }
}

export default class MockPlugin {
  private options: MockOptions | undefined;
  private instance: xior | undefined;
  constructor(xiorInstance: xior, options?: MockOptions) {
    this.options = options;
    this.instance = xiorInstance;

    xiorInstance.plugins.use(this._mockPlugin.bind(this));
  }

  // TODO remove any
  history = {} as { [method: string]: any[] };
  // TODO remove any
  handlers = {} as { [method: string]: any[] };

  private _mockPlugin(adapter: Parameters<XiorPlugin>[0]) {
    return async (config: Parameters<ReturnType<XiorPlugin>>[0]) => {
      const method = config.method?.toLowerCase() || 'get';
      if (!this.history[method]) {
        this.history[method] = [];
      }
      if (!this.handlers[method]) {
        this.handlers[method] = [];
      }
      this.history[method].push(config);

      const handler = this.findHandler(config);
      if (handler) {
        const delayTime = handler[ReplyDelayLength - 1] || this.options?.delayResponse;
        if (delayTime && delayTime > 0) {
          await delay(delayTime);
        }

        if (handler.length === ReplyOnceLength) {
          Object.keys(this.handlers).forEach((method) => {
            const index = this.handlers[method].indexOf(handler);
            if (index > -1) {
              this.handlers[method].splice(index, 1);
            }
          });
        }
        if (handler.length === PassThroughLength) {
          return adapter(config);
        } else if (typeof handler[2] !== 'function') {
          const result = handler.slice(2);
          return {
            data: result[1],
            status: result[0],
            statusText: 'ok',
            headers: result[2],
            request: config,
            config,
          } as any;
        }
        const result = handler[2](config);
        if (typeof result?.then !== 'function') {
          return {
            data: result[1],
            status: result[0],
            statusText: 'ok',
            headers: result[2],
            request: config,
            config,
          } as any;
        } else {
          const res = await result;
          if (res.config && res.status) {
            return res;
          } else {
            return {
              data: res[1],
              status: res[0],
              statusText: 'ok',
              headers: res[2],
              request: config,
              config,
            } as any;
          }
        }
      } else {
        if (this.options?.onNoMatch === 'passthrough') {
          return adapter(config);
        } else if (this.options?.onNoMatch === 'throwException') {
          const message =
            'Could not find mock for: \n' + JSON.stringify(config, ['method', 'url'], 2);
          throw new MockError(message, config as XiorInterceptorRequestConfig);
        } else {
          const message = `Request failed with status code 404`;
          throw new XiorError(message, config, {
            status: 404,
            statusText: message,
          } as any);
        }
      }
    };
  }

  resetHandlers() {
    this.handlers = {};
  }
  resetHistory() {
    this.history = {};
  }
  reset() {
    this.resetHandlers();
    this.resetHistory();
  }

  onGet<T extends any>(
    matcher?: string | RegExp,
    options?: XiorRequestConfig<T>
  ): ReturnType<ReturnType<typeof this.createHandler>> {
    const handler = this.createHandler('get');
    return handler(matcher, options);
  }
  onDelete<T extends any>(
    matcher?: string | RegExp,
    options?: XiorRequestConfig<T>
  ): ReturnType<ReturnType<typeof this.createHandler>> {
    const handler = this.createHandler('delete');
    return handler(matcher, options);
  }
  onHead<T extends any>(
    matcher?: string | RegExp,
    options?: XiorRequestConfig<T>
  ): ReturnType<ReturnType<typeof this.createHandler>> {
    const handler = this.createHandler('head');
    return handler(matcher, options);
  }
  onPost<T extends any>(
    matcher?: string | RegExp,
    data?: T,
    options?: XiorRequestConfig<T>
  ): ReturnType<ReturnType<typeof this.createHandler>> {
    const handler = this.createHandler('post');
    return handler(matcher, data && options ? merge({}, options || {}, { data }) : options);
  }
  onPut<T extends any>(
    matcher?: string | RegExp,
    data?: T,
    options?: XiorRequestConfig<T>
  ): ReturnType<ReturnType<typeof this.createHandler>> {
    const handler = this.createHandler('put');
    return handler(matcher, data && options ? merge({}, options || {}, { data }) : options);
  }
  onPatch<T extends any>(
    matcher?: string | RegExp,
    data?: T,
    options?: XiorRequestConfig<T>
  ): ReturnType<ReturnType<typeof this.createHandler>> {
    const handler = this.createHandler('patch');
    return handler(matcher, data && options ? merge({}, options || {}, { data }) : options);
  }
  onOptions<T extends any>(
    matcher?: string | RegExp,
    data?: T,
    options?: XiorRequestConfig<T>
  ): ReturnType<ReturnType<typeof this.createHandler>> {
    const handler = this.createHandler('options');
    return handler(matcher, data && options ? merge({}, options || {}, { data }) : options);
  }

  private createHandler(method: string) {
    const _this = this;
    return (matcher?: string | RegExp, options?: XiorRequestConfig) => {
      options = options
        ? merge(
            {},
            {
              headers: _this.instance?.config?.headers,
              params: _this.instance?.config?.params,
              data: _this.instance?.config?.data,
            },
            options || {}
          )
        : {};
      matcher = matcher === undefined ? /.*/ : matcher;
      function reply(code: StatusOrCallback, responseData?: any, responseHeaders?: MockHeaders) {
        const handler = [matcher, options, code, responseData, responseHeaders];
        _this.addHandler(method, handler);
        return _this;
      }

      function replyOnce(code: StatusOrCallback, responseData?: any, responseHeaders?: any) {
        // replyOnce: handle.length === 6
        const handler = [matcher, options, code, responseData, responseHeaders, true];
        _this.addHandler(method, handler);
        return _this;
      }

      function replyWithDelay(delay: number, code: any, responseData: any, responseHeaders?: any) {
        // replyDelay: handle.length === 7
        const handler = [matcher, options, code, responseData, responseHeaders, false, delay];
        _this.addHandler(method, handler);
        return _this;
      }

      function withDelayInMs(delay: number) {
        return function (code: any, responseData?: any, responseHeaders?: any) {
          replyWithDelay(delay, code, responseData, responseHeaders);
        };
      }

      return {
        reply,
        replyOnce,
        withDelayInMs,
        passThrough: () => {
          const handler = [matcher, options];
          this.addHandler(method, handler);
          return this;
        },
        abortRequest() {
          return reply((config) => {
            return Promise.reject(new XiorError(`Request abort error`, config));
          });
        },
        abortRequestOnce() {
          return replyOnce((config) => {
            return Promise.reject(new XiorError(`Request abort error`, config));
          });
        },
        networkError() {
          return reply((config) => {
            return Promise.reject(new XiorError(`Network error`, config));
          });
        },
        networkErrorOnce() {
          return replyOnce((config) => {
            return Promise.reject(new XiorError(`Network error`, config));
          });
        },
        timeout() {
          return reply((config) => {
            return Promise.reject(new XiorTimeoutError(`timeout of ${0}ms exceeded`, config));
          });
        },
        timeoutOnce() {
          return replyOnce((config) => {
            return Promise.reject(new XiorTimeoutError(`timeout of ${0}ms exceeded`, config));
          });
        },
      };
    };
  }

  addHandler(method: string, _handler: any[]) {
    const handler = [..._handler];
    if (handler[4]) {
      const headers = new Headers();
      Object.keys(handler[4]).forEach((key) => {
        headers.append(key, handler[4][key]);
      });
      handler[4] = headers;
    }
    if (method === 'any') {
      VERBS.forEach((verb: string) => {
        if (!this.handlers[verb]) this.handlers[verb] = [];
        this.handlers[verb].push(handler);
      });
    } else {
      if (!this.handlers[method]) this.handlers[method] = [];

      const indexOfExistingHandler = this.handlers[method]?.findIndex((item: any[]) => {
        const isReplyOnce = item.length === ReplyOnceLength;
        if (isReplyOnce) return false;
        const key1 = buildSortedURL(String(item[0]), item[1], encodeParams);
        const key2 = buildSortedURL(String(handler[0]), handler[1], encodeParams);
        return key1 === key2;
      });
      if (indexOfExistingHandler > -1 && handler.length < ReplyOnceLength) {
        this.handlers[method]?.splice(indexOfExistingHandler, 1, handler);
      } else {
        this.handlers[method].push(handler);
      }
    }
  }

  findHandler(config: XiorRequestConfig) {
    const {
      method: _method,
      url,
      _url,
      headers,
      params,
      data = {},
    } = config as XiorInterceptorRequestConfig;
    const method = _method?.toLowerCase();
    return this.handlers[method].find((handler) => {
      const handlerHeaders = { ...(handler[1].headers || {}) };

      if (config.headers?.['Content-Type']) {
        const contentType = Object.keys(handlerHeaders).find(
          (key) => key.toLowerCase() === 'content-type'
        );
        if (!contentType) {
          handlerHeaders['Content-Type'] = config.headers['Content-Type'];
        }
      }
      if (typeof handler[0] === 'string') {
        const key1 = buildSortedURL(url, { params, data, headers }, encodeParams);
        const key2 = buildSortedURL(
          handler[0],
          {
            params: handler[1].params || {},
            data: handler[1].data || {},
            headers: handlerHeaders,
          },
          encodeParams
        );
        return key1 === key2;
      } else if (handler[0] instanceof RegExp) {
        return (
          (handler[0].test(url) || handler[0].test(_url)) &&
          buildSortedURL(method, { params, data, headers }, encodeParams) ===
            buildSortedURL(
              method,
              {
                params: handler[1].params || {},
                data: handler[1].data || {},
                headers: handlerHeaders,
              },
              encodeParams
            )
        );
      }
    });
  }
}
