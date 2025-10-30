import { Xior as Axios, XiorRequestConfig } from './';
import axios from './';
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

declare global {
  interface Headers {
    [key: string]: string | any;
  }
}

// Utilities
export function isCancel(err: any): boolean {
  return err?.name === 'AbortError';
}

function createSmartHeaders(init?: HeadersInit): SmartHeaders {
  const headers = new Headers(init);

  return new Proxy(headers, {
    get(target, prop: string | symbol) {
      if (typeof prop === 'string') {
        const value = target.get(prop);
        if (value !== null) return value;
      }
      // @ts-ignore
      return target[prop] || undefined;
    },
    set(target, prop: string | symbol, value: any) {
      if (typeof prop === 'string') {
        target.set(prop, String(value));
        return true;
      }
      // @ts-ignore
      target[prop] = value;
      return true;
    },
  }) as SmartHeaders;
}

// Override create method
const originalCreate = Axios.create;

axios.create = Axios.create = (options?: XiorRequestConfig) => {
  const instance = originalCreate(options);

  instance.plugins.use(streamPlugin()); // TODO: only for node.js

  instance.plugins.use((adapter) => {
    return async (config) => {
      const res = await adapter(config);
      res.headers = createSmartHeaders(res.headers);
      return res;
    };
  });

  return instance;
};

export { Axios };
export default Object.assign(axios, { isCancel });
