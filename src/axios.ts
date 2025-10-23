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
} from './';
export * from './utils';

import xiorInstance from './';
export default xiorInstance;
