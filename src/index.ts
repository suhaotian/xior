import { isCancel } from './utils';
import { Xior, Xior as Axios } from './xior';

export * from './xior';
export * from './types';
export * from './utils';

// Type exports
export type {
  XiorRequestConfig as AxiosRequestConfig,
  XiorInterceptorRequestConfig as InternalAxiosRequestConfig,
  XiorResponse as AxiosResponse,
  XiorInterceptorOptions as AxiosInterceptorOptions,
  XiorPlugin as AxiosPlugin,
} from './types';
export type { XiorProgressEvent as AxiosProgressEvent } from './plugins/progress';

// Named exports
export {
  XiorInstance as AxiosInstance,
  XiorError as AxiosError,
  isXiorError as isAxiosError,
  XiorTimeoutError as AxiosTimeoutError,
  merge as mergeConfig,
} from './';

const axios = Object.assign(Xior.create(), {
  create: Xior.create,
  VERSION: Xior.VERSION,
  isCancel,
});
export { Axios };
export default axios;
