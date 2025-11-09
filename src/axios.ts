import { Xior as Axios, isCancel, XiorRequestConfig } from '.';

// Type exports
export type {
  XiorRequestConfig as AxiosRequestConfig,
  XiorInterceptorRequestConfig as InternalAxiosRequestConfig,
  XiorResponse as AxiosResponse,
  XiorInterceptorOptions as AxiosInterceptorOptions,
  XiorPlugin as AxiosPlugin,
} from './types';

// Named exports
export {
  XiorInstance as AxiosInstance,
  XiorError as AxiosError,
  isXiorError as isAxiosError,
  XiorTimeoutError as AxiosTimeoutError,
  merge as mergeConfig,
} from './';

export * from './utils';

// Types
export type SmartHeaders = Headers & {
  [key: string]: string | any;
};

/** @deprecated please use `Header`, useless here */
export interface RawAxiosRequestHeaders {
  [key: string]: string | undefined;
}

// @ts-ignore
declare module 'xior' {
  interface XiorResponse {
    headers: SmartHeaders;
  }
}

// Override create method
const originalCreate = Axios.create;
const axios = Object.assign(Axios.create(), {
  create: Axios.create,
  VERSION: Axios.VERSION,
  isCancel,
});

axios.create = Axios.create = (options?: XiorRequestConfig) => {
  const instance = originalCreate(options);

  return instance;
};

export { Axios };
export default axios;

/** @deprecated useless, only for compatiable with axios */
export interface CancelStatic {
  new (message?: string): Cancel;
}

/** @deprecated useless, only for compatiable with axios */
export interface Cancel {
  message: string | undefined;
}

/** @deprecated useless, only for compatiable with axios */
export interface Canceler {
  (message?: string, config?: XiorRequestConfig, request?: any): void;
}

/** @deprecated useless, only for compatiable with axios */
export interface CancelTokenStatic {
  new (executor: (cancel: Canceler) => void): CancelToken;
  source(): CancelTokenSource;
}

/** @deprecated useless, only for compatiable with axios */
export interface CancelToken {
  promise: Promise<Cancel>;
  reason?: Cancel;
  throwIfRequested(): void;
}

/** @deprecated useless, only for compatiable with axios */
export interface CancelTokenSource {
  token: CancelToken;
  cancel: Canceler;
}

export type { XiorProgressEvent as AxiosProgressEvent } from './plugins/progress';
