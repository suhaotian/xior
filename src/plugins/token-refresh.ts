import type { XiorResponse, XiorInterceptorResponseConfig } from '../types';
import type { XiorError as AxiosError } from '../utils';
import type { XiorInstance } from '../xior';

export function defaultShouldRefresh(response: XiorResponse) {
  return response?.status && [401].includes(response.status);
}
export default function setupTokenRefresh(
  instance: XiorInstance,
  options: {
    refreshToken: (error: AxiosError) => Promise<any> | any;
    shouldRefresh?: (response: XiorResponse) => boolean;
  }
) {
  const shouldRefresh = options?.shouldRefresh || defaultShouldRefresh;
  let refreshingToken = false;
  const queue: (() => void)[] = [];
  instance.interceptors.response.use(
    async (response: XiorInterceptorResponseConfig) => {
      return response;
    },
    async (error: AxiosError) => {
      if (error?.response && shouldRefresh(error.response)) {
        if (refreshingToken) {
          await new Promise<void>((resolve) => {
            queue.push(resolve);
          });
        } else {
          refreshingToken = true;
          try {
            await options.refreshToken(error);
          } finally {
            refreshingToken = false;
            queue.forEach((r) => r());
          }
        }
      }
      return Promise.reject(error);
    }
  );
}
