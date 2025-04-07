/** Compatiable for axios */

/**
 Xior -> Axios
 Response.headers -> object headers
 Transform Request support
 Transform Response support
 */

import { XiorError, XiorTimeoutError, isXiorError } from './utils';

import {
  XiorRequestConfig,
  XiorResponse,
  XiorInterceptorOptions,
  XiorInterceptorResponseConfig,
  XiorInterceptorRequestConfig,
} from './types';

export { XiorError as AxiosError };
export { XiorTimeoutError as AxiosTimeoutError };
export const isAxiosError = isXiorError;
export type AxiosRequestConfig = XiorRequestConfig;
export type AxiosResponse = XiorResponse;
export type AxiosInterceptorOptions = XiorInterceptorOptions;
export type AxiosInterceptorResponseConfig = XiorInterceptorResponseConfig;
export type AxiosInterceptorRequestConfig = XiorInterceptorRequestConfig;

// getUri
// validateStatus
// transformRequest
// transformResponse
// fetchOptions
