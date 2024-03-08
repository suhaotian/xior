export interface XiorRequestConfig<T = any> extends Omit<RequestInit, 'body'> {
  url?: string;
  headers?: Record<string, any>;
  baseURL?: string;
  params?: Record<string, any>;
  /** If no set, default depends on browsers timeout */
  timeout?: number;
  /** @deprecated use paramsSerializer */
  encode?: (params: Record<string, any>) => string;
  paramsSerializer?: (params: Record<string, any>) => string;
  /** Use encodeURIComponent, default: true */
  encodeURI?: boolean;
  /**
   * Currently only support 'json' | 'text', default: 'json';
   * Others will just return the original response
   */
  responseType?: 'json' | 'text' | 'stream' | 'document' | 'arraybuffer' | 'blob' | 'original';
  data?: any;
  /** encoded url with params */
  _url?: string;
  /** useless now, compitable axios */
  withCredentials?: boolean;
  /**
   * some API is get data, but the method is not 'GET',
   * add `isGet: true`, can let the plugins know this is also a `GET` API
   */
  isGet?: boolean;
}

export type XiorInterceptorRequestConfig<T = any> = XiorRequestConfig & {
  headers: Record<string, any>;
  params: Record<string, any>;
  url: string;
  _url: string;
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
  adapter: (request: XiorRequestConfig) => Promise<XiorResponse>
) => (request: XiorRequestConfig) => Promise<XiorResponse<any>>;
