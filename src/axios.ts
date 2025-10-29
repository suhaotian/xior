export type {
  XiorRequestConfig as AxiosRequestConfig,
  XiorInterceptorRequestConfig as InternalAxiosRequestConfig,
  XiorResponse as AxiosResponse,
  XiorInterceptorOptions as AxiosInterceptorOptions,
  XiorPlugin as AxiosPlugin,
} from './types';

export {
  XiorInstance as AxiosInstance,
  XiorError as AxiosError,
  isXiorError as isAxiosError,
  XiorTimeoutError as AxiosTimeoutError,
  Xior as Axios,
  merge as mergeConfig,
} from './';
export * from './utils';

/** @deprecated please use `Header`, useless here */
export interface RawAxiosRequestHeaders {}

import axios from './';

export function isCancel(err: any) {
  return err?.name === 'AbortError';
}

export default Object.assign(axios, { isCancel });
