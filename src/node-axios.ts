import { Xior as Axios, XiorRequestConfig, XiorInstance } from '.';
import streamPlugin from './plugins/stream';

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
} from '.';

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

// Utilities
export function isCancel(err: any): boolean {
  return err?.name === 'AbortError';
}

// Override create method
const originalCreate = Axios.create;
const axios = Object.assign(Axios.create(), {
  create: Axios.create,
  VERSION: Axios.VERSION,
  isCancel,
});
function setupPlugins(instance: XiorInstance) {
  instance.plugins.use(streamPlugin());
}
setupPlugins(axios);

axios.create = Axios.create = (options?: XiorRequestConfig) => {
  const instance = originalCreate(options);
  setupPlugins(instance);
  return instance;
};

export { Axios };
export default axios;
