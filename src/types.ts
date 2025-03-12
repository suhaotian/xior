import { XiorInstance, type Fetch } from './xior';

export interface XiorRequestConfig<T = any> extends Omit<RequestInit, 'body'> {
  /** fetch?: @type Fetch  */
  fetch?: (input: any, init?: any) => Promise<any>;
  url?: string;
  headers?: Record<string, any>;
  baseURL?: string;
  params?: Record<string, any>;
  /** If no set, default depends on browsers timeout */
  timeout?: number;
  paramsSerializer?: (params: Record<string, any>) => string;
  /** Use encodeURIComponent, default: true */
  encodeURI?: boolean;
  /**
   * Currently only support 'json' | 'text', default: 'json';
   * Others will just return the original response
   */
  responseType?:
    | 'json'
    | 'text'
    | 'stream'
    | 'document'
    | 'arraybuffer'
    | 'blob'
    | 'original'
    | 'custom';
  data?: any;
  /**
   * @deprecated Internal use only
   * encoded url with params
   */
  _url?: string;
  /** @deprecated if `true`, will set `credentials=true`, or you can just use fetch's config `credentials: 'include' | 'omit' | 'same-origin'` */
  withCredentials?: boolean;
  /**
   * some API is get data, but the method is not 'GET',
   * add `isGet: true`, can let the plugins know this is also a `GET` API
   */
  isGet?: boolean;

  /**
   * @deprecated Internal use only
   * response interceptors already run?
   */
  _did?: boolean;
}

export type XiorInterceptorRequestConfig<T = any> = XiorRequestConfig & {
  headers: Record<string, any>;
  params: Record<string, any>;
  url: string;
  method: string;
};
export interface XiorResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  response: Response;
  config: XiorInterceptorRequestConfig;
  request?: any;
}

export type XiorPlugin = (
  adapter: (request: XiorRequestConfig) => Promise<XiorResponse>,
  instance?: XiorInstance
) => (request: XiorRequestConfig) => Promise<XiorResponse<any>>;

export interface XiorInterceptorOptions {
  /** @deprecated useless here */
  synchronous?: boolean;
  /** @deprecated useless here */
  runWhen?: (config: XiorInterceptorRequestConfig) => boolean;
}

export interface XiorResponseInterceptorConfig<T = any> {
  data: T;
  config: XiorInterceptorRequestConfig<T>;
  request: XiorInterceptorRequestConfig<T>;
  response: Response;
  status: number;
  statusText: string;
  headers: Headers;
}
