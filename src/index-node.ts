import { AxiosInstance, AxiosRequestConfig } from '.';
import { isCancel } from './utils';
import { Xior as Axios } from './xior';
import streamPlugin from './plugins/stream';

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
} from '.';

// Override create method
const originalCreate = Axios.create;
const axios = Object.assign(Axios.create(), {
  create: Axios.create,
  VERSION: Axios.VERSION,
  isCancel,
});
function setupPlugins(instance: AxiosInstance) {
  instance.plugins.use(streamPlugin());
}
setupPlugins(axios);

axios.create = Axios.create = (options?: AxiosRequestConfig) => {
  const instance = originalCreate(options);
  setupPlugins(instance);
  return instance;
};

export { Axios };
export default axios;
