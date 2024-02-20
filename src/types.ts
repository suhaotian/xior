export interface XiorRequestConfig extends Omit<RequestInit, 'body'> {
  url?: string;
  headers?: Record<string, any>;
  baseURL?: string;
  params?: Record<string, any>;
  /** If no set, default depends on browsers timeout */
  timeout?: number;
  encode?: (params: Record<string, any>) => string;
  /** Use encodeURIComponent, default: true */
  encodeURI?: boolean;
  /**
   * Currently only support 'json' | 'text', default: 'json';
   * Others will just return the original response
   */
  responseType?: 'json' | 'text' | 'stream' | 'document' | 'arraybuffer' | 'blob' | 'original';
  data?: any;
  _url?: string;
}

export interface XiorResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  response: Response;
  config: XiorRequestConfig;
  request?: any;
}
