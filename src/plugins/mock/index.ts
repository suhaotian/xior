import {
  ClearableSignal,
  XiorError,
  XiorTimeoutError,
  anySignal,
  buildSortedURL,
  delay,
  encodeParams,
  joinPath,
  merge,
  // @ts-ignore
} from 'xior/utils';

import { MockHeaders, StatusOrCallback, RequestOptions, RequestData, VERBS } from './types';
import type {
  XiorInterceptorRequestConfig,
  XiorPlugin,
  XiorRequestConfig,
  XiorResponse,
} from '../../types';
import { XiorInstance } from '../../xior';

export interface MockOptions {
  delayResponse?: number;
  onNoMatch?: 'passthrough' | 'throwException';
}

const ReplyOnceLength = 6;
const PassThroughLength = 2;
const ReplyDelayLength = 7;
const supportAbortController = typeof AbortController !== 'undefined';

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
  private instance: XiorInstance | undefined;
  private plugin: XiorPlugin | undefined;
  constructor(xiorInstance: XiorInstance, options?: MockOptions) {
    this.options = options;
    this.instance = xiorInstance;
    this.plugin = this._mockPlugin.bind(this);
    xiorInstance.plugins.use(this.plugin);
  }

  handlers: { [method: string]: undefined | any[] } = {};
  history: { [method: string]: undefined | XiorRequestConfig<any>[] } = {};

  private _mockPlugin(adapter: Parameters<XiorPlugin>[0]) {
    return async (config: Parameters<ReturnType<XiorPlugin>>[0]) => {
      const method = config.method?.toLowerCase() || 'get';
      if (!this.history[method]) {
        this.history[method] = [];
      }
      if (!this.handlers[method]) {
        this.handlers[method] = [];
      }
      this.history[method]?.push(config);

      const handler = this.findHandler(config);
      if (handler) {
        const delayTime = handler[ReplyDelayLength - 1] || this.options?.delayResponse;

        if (handler.length === ReplyOnceLength) {
          Object.keys(this.handlers).forEach((method) => {
            let index = this.handlers[method]?.indexOf(handler);
            index = index === undefined ? -1 : index;
            if (index > -1) {
              this.handlers[method]?.splice(index, 1);
            }
          });
        }

        const signals: AbortSignal[] = [];
        let cleanTimerAndSignal: Function | undefined;
        if (handler.length !== PassThroughLength) {
          /** timeout */
          let signal: AbortSignal;
          let timer: ReturnType<typeof setTimeout> | undefined = undefined;
          if (config.timeout && supportAbortController) {
            const controller = new AbortController();
            timer = setTimeout(() => {
              controller.abort(
                new XiorTimeoutError(`timeout of ${config.timeout}ms exceeded`, config)
              );
            }, config.timeout);
            signals.push(controller.signal);
          }
          if (config.signal) {
            signals.push(config.signal);
          }
          signal = signals[0];
          if (signals.length > 1) {
            signal = anySignal(signals, () => {
              timer && clearTimeout(timer);
            });
          }

          cleanTimerAndSignal = () => {
            if (timer) clearTimeout(timer);
            (signal as ClearableSignal)?.clear?.();
          };
        }

        if (delayTime && delayTime > 0) {
          await delay(delayTime);
        }

        const abortedSignal = signals.find((item) => item.aborted);
        if (abortedSignal) {
          cleanTimerAndSignal?.();
          return Promise.reject(abortedSignal.reason);
        }

        if (handler.length === PassThroughLength) {
          return adapter(config);
        } else if (typeof handler[2] !== 'function') {
          const result = handler.slice(2);
          const res = checkOk(
            {
              data: result[1],
              status: result[0],
              statusText: 'ok',
              headers: result[2],
              request: config,
              config,
            } as XiorResponse,
            config
          );
          cleanTimerAndSignal?.();
          return res;
        }
        const result = handler[2](config);
        if (typeof result?.then !== 'function') {
          const res = checkOk(
            {
              data: result[1],
              status: result[0],
              statusText: 'ok',
              headers: turnObjToHeaders(result[2]),
              request: config,
              config,
            } as XiorResponse,
            config
          );
          cleanTimerAndSignal?.();
          return res;
        } else {
          const res = await result;
          cleanTimerAndSignal?.();
          if (res.config && res.status) {
            return res;
          } else {
            return checkOk(
              {
                data: res[1],
                status: res[0],
                statusText: 'ok',
                headers: turnObjToHeaders(res[2]),
                request: config,
                config,
              } as XiorResponse,
              config
            );
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
            config,
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
  restore() {
    this.reset();
    this.instance?.plugins.eject(this.plugin as XiorPlugin);
  }

  onGet<T extends any>(
    matcher?: string | RegExp,
    options?: RequestOptions
  ): ReturnType<ReturnType<typeof this.createHandler>> {
    const handler = this.createHandler('get').bind(this);
    return handler(matcher, options);
  }
  onDelete<T extends any>(
    matcher?: string | RegExp,
    options?: RequestOptions
  ): ReturnType<ReturnType<typeof this.createHandler>> {
    const handler = this.createHandler('delete').bind(this);
    return handler(matcher, options);
  }
  onHead<T extends any>(
    matcher?: string | RegExp,
    options?: RequestOptions
  ): ReturnType<ReturnType<typeof this.createHandler>> {
    const handler = this.createHandler('head').bind(this);
    return handler(matcher, options);
  }
  onAny<T extends any>(
    matcher?: string | RegExp,
    options?: RequestOptions
  ): ReturnType<ReturnType<typeof this.createHandler>> {
    const handler = this.createHandler('any').bind(this);
    return handler(matcher, options);
  }
  onPost<T extends any>(
    matcher?: string | RegExp,
    data?: RequestData<T>,
    options?: RequestOptions
  ): ReturnType<ReturnType<typeof this.createHandler>> {
    const handler = this.createHandler('post').bind(this);
    return handler(matcher, merge({}, options || {}, { data: data || {} }));
  }
  onPut<T extends any>(
    matcher?: string | RegExp,
    data?: RequestData<T>,
    options?: RequestOptions
  ): ReturnType<ReturnType<typeof this.createHandler>> {
    const handler = this.createHandler('put').bind(this);
    return handler(matcher, merge({}, options || {}, { data: data || {} }));
  }
  onPatch<T extends any>(
    matcher?: string | RegExp,
    data?: RequestData<T>,
    options?: RequestOptions
  ): ReturnType<ReturnType<typeof this.createHandler>> {
    const handler = this.createHandler('patch').bind(this);
    return handler(matcher, merge({}, options || {}, { data: data || {} }));
  }
  onOptions<T extends any>(
    matcher?: string | RegExp,
    options?: RequestOptions
  ): ReturnType<ReturnType<typeof this.createHandler>> {
    const handler = this.createHandler('options').bind(this);
    return handler(matcher, options);
  }

  /*
  (matcher?: string | RegExp, options?: XiorRequestConfig) => ({
    reply: (
      code: StatusOrCallback,
      responseData?: any,
      responseHeaders?: MockHeaders
    ) => MockPlugin;
    replyOnce: (
      code: StatusOrCallback,
      responseData?: any,
      responseHeaders?: MockHeaders
    ) => MockPlugin;
    withDelayInMs: (
      delay: number
    ) => (code: StatusOrCallback, responseData?: any, responseHeaders?: MockHeaders) => MockPlugin;
    passThrough: () => MockPlugin;
    abortRequest(): MockPlugin;
    abortRequestOnce(): MockPlugin;
    networkError(): MockPlugin;
    networkErrorOnce(): MockPlugin;
    timeout(): MockPlugin;
    timeoutOnce(): MockPlugin;
  })
  */
  createHandler(method: string): (
    matcher?: string | RegExp,
    options?: XiorRequestConfig
  ) => {
    reply: (
      code: StatusOrCallback,
      responseData?: any,
      responseHeaders?: MockHeaders
    ) => MockPlugin;
    replyOnce: (
      code: StatusOrCallback,
      responseData?: any,
      responseHeaders?: MockHeaders
    ) => MockPlugin;
    withDelayInMs: (
      delay: number
    ) => (code: StatusOrCallback, responseData?: any, responseHeaders?: MockHeaders) => MockPlugin;
    passThrough: () => MockPlugin;
    abortRequest(): MockPlugin;
    abortRequestOnce(): MockPlugin;
    networkError(): MockPlugin;
    networkErrorOnce(): MockPlugin;
    timeout(): MockPlugin;
    timeoutOnce(): MockPlugin;
  } {
    return (matcher?: string | RegExp, options?: XiorRequestConfig) => {
      options = options
        ? merge(
            {},
            {
              headers: this.instance?.config?.headers,
              params: this.instance?.config?.params,
              data: this.instance?.config?.data,
            },
            options || {}
          )
        : {};
      matcher = matcher === undefined ? /.*/ : matcher;
      const reply = (code: StatusOrCallback, responseData?: any, responseHeaders?: MockHeaders) => {
        const handler = [matcher, options, code, responseData, responseHeaders];
        this.addHandler(method, handler);
        return this;
      };

      const replyOnce = (
        code: StatusOrCallback,
        responseData?: any,
        responseHeaders?: MockHeaders
      ) => {
        // replyOnce: handle.length === 6
        const handler = [matcher, options, code, responseData, responseHeaders, true];
        this.addHandler(method, handler);
        return this;
      };

      const replyWithDelay = (
        delay: number,
        code: StatusOrCallback,
        responseData: any,
        responseHeaders?: MockHeaders
      ) => {
        // replyDelay: handle.length === 7
        const handler = [matcher, options, code, responseData, responseHeaders, false, delay];
        this.addHandler(method, handler);
        return this;
      };

      function withDelayInMs(delay: number) {
        return function (
          code: StatusOrCallback,
          responseData?: any,
          responseHeaders?: MockHeaders
        ) {
          return replyWithDelay(delay, code, responseData, responseHeaders);
        };
      }
      /*
{
    reply: (code: StatusOrCallback, responseData?: any, responseHeaders?: MockHeaders) => this;
    replyOnce: (code: StatusOrCallback, responseData?: any, responseHeaders?: MockHeaders) => this;
    withDelayInMs: (delay: number) => (code: StatusOrCallback, responseData?: any, responseHeaders?: MockHeaders) => this;
    passThrough: () => this;
    abortRequest(): this;
    abortRequestOnce(): this;
    networkError(): this;
    networkErrorOnce(): this;
    timeout(): this;
    timeoutOnce(): this;
}
*/
      const result = {
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
            return Promise.reject(new XiorError(`Request aborted`, config));
          });
        },
        abortRequestOnce() {
          return replyOnce((config) => {
            return Promise.reject(new XiorError(`Request aborted`, config, {} as XiorResponse));
          });
        },
        networkError() {
          return reply((config) => {
            return Promise.reject(new XiorError(`Network Error`, config, {} as XiorResponse));
          });
        },
        networkErrorOnce() {
          return replyOnce((config) => {
            return Promise.reject(new XiorError(`Network Error`, config, {} as XiorResponse));
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

      return result;
    };
  }

  addHandler(method: string, _handler: any[]) {
    const handler = [..._handler];
    if (handler[3]) {
      try {
        handler[3] = JSON.parse(JSON.stringify(handler[3]));
      } catch (e) {
        //
      }
    }
    if (handler[4]) {
      const headers =
        typeof Headers === 'undefined'
          ? (() => {
              const obj: Record<string, string | null> = {};
              return {
                append(key: string, value: any) {
                  obj[key] = value + '';
                },
                get(key: string) {
                  return obj[key] || null;
                },
              };
            })()
          : new Headers();
      Object.keys(handler[4]).forEach((key) => {
        headers.append(key, handler[4][key]);
      });
      handler[4] = headers;
    }
    if (method === 'any') {
      VERBS.forEach((verb: string) => {
        if (!this.handlers[verb]) this.handlers[verb] = [];
        this.handlers[verb]?.push(handler);
      });
    } else {
      if (!this.handlers[method]) this.handlers[method] = [];

      let indexOfExistingHandler = this.handlers[method]?.findIndex((item: any[]) => {
        const isReplyOnce = item.length === ReplyOnceLength;
        if (isReplyOnce) return false;
        const key1 = buildSortedURL(String(item[0]), item[1], encodeParams);
        const key2 = buildSortedURL(String(handler[0]), handler[1], encodeParams);
        return key1 === key2;
      });
      indexOfExistingHandler = indexOfExistingHandler === undefined ? -1 : indexOfExistingHandler;
      if (indexOfExistingHandler > -1 && handler.length < ReplyOnceLength) {
        this.handlers[method]?.splice(indexOfExistingHandler, 1, handler);
      } else {
        this.handlers[method]?.push(handler);
      }
    }
  }

  findHandler(config: XiorRequestConfig) {
    const {
      method: _method,
      url,
      headers,
      params,
      data = {},
      baseURL,
    } = config as XiorInterceptorRequestConfig;
    const method = _method?.toLowerCase();
    return this.handlers[method]?.find((handler) => {
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
        const isAbsoluteUrl = baseURL && handler[0].startsWith(baseURL);
        // a,b,c for sort
        const key1 = buildSortedURL(
          isAbsoluteUrl ? joinPath(baseURL, url) : joinPath('/', url),
          { b: params, c: data, a: headers },
          encodeParams
        );
        const key2 = buildSortedURL(
          isAbsoluteUrl ? handler[0] : joinPath('/', handler[0]),
          {
            b: handler[1].params || {},
            c: handler[1].data || {},
            a: handlerHeaders,
          },
          encodeParams
        );
        return (
          key1 === key2 ||
          key1.startsWith(key2) ||
          getAsymmetricMatchResult([
            [params, handler[1].params],
            [data, handler[1].data],
            [headers, handlerHeaders],
          ])
        );
      } else if (handler[0] instanceof RegExp) {
        return (
          (handler[0].test(url) || handler[0].test(joinPath(baseURL || '', url))) &&
          (buildSortedURL(method, { b: params, c: data, a: headers }, encodeParams) ===
            buildSortedURL(
              method,
              {
                b: handler[1].params || {},
                c: handler[1].data || {},
                a: handlerHeaders,
              },
              encodeParams
            ) ||
            getAsymmetricMatchResult([
              [params, handler[1].params],
              [data, handler[1].data],
              [headers, handlerHeaders],
            ]))
        );
      }
    });
  }
}

function getAsymmetricMatchResult(arr: any[]) {
  const asymmetricMatchList = arr.filter((item) => {
    const [, expected] = item;
    return typeof expected?.asymmetricMatch === 'function';
  });
  const result = asymmetricMatchList.filter((item) => {
    const [actual, expected] = item;
    return expected.asymmetricMatch(actual);
  });
  return result.length > 0 && result.length === asymmetricMatchList.length;
}

function turnObjToHeaders(objHeaders: Record<string, string>) {
  if (!objHeaders) {
    objHeaders = {};
  }
  const obj: Record<string, string | null> = {};
  const headers =
    typeof Headers === 'undefined'
      ? (() => {
          return {
            append(key: string, value: any) {
              obj[key] = value + '';
            },
            get(key: string) {
              return obj[key] || null;
            },
          };
        })()
      : new Headers();
  Object.keys(objHeaders).forEach((key) => {
    headers.append(key, objHeaders[key]);
  });
  return headers;
}

function checkOk(res: XiorResponse, config?: XiorRequestConfig) {
  if (res.status >= 300) {
    throw new XiorError(`Request failed with status code ${res.status}`, config, res);
  }
  return res;
}
