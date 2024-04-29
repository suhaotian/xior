import xior, { XiorError as AxiosError, XiorInstance, XiorResponse } from 'xior';
import errorRetry from 'xior/plugins/error-retry';

const http = xior.create();

http.plugins.use(
  errorRetry({
    enableRetry: (config, error) => {
      if (error.response && shouldRefreshToken(error.response)) {
        return true;
      }
    },
  })
);
setupTokenRefresh(
  http,
  // eslint-disable-next-line node/handle-callback-err
  async (error) => {
    const { data } = await http.post('/new/token');
    if (data.token) {
      // Set new token here
      // localStorage.setItem('TOKEN', token);
      // or
      // http.defaults.headers['Authorization'] = `Beare ${data.token}`;
    } else {
      return Promise.reject(new Error('Wrong token'));
    }
  },
  {
    shouldRefresh(response) {
      return Boolean(response?.status && [401, 403].includes(response.status));
    },
  }
);

export function shouldRefreshToken(response: XiorResponse) {
  return response?.status && [401].includes(response.status);
}
export default function setupTokenRefresh(
  instance: XiorInstance,
  getToken: (error: AxiosError) => Promise<any>,
  options?: {
    shouldRefresh: (response: XiorResponse) => boolean;
  }
) {
  const shouldRefresh = options?.shouldRefresh || shouldRefreshToken;

  let refreshingToken = false;
  const queue: (() => void)[] = [];
  instance.interceptors.response.use(
    async (response) => {
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
            await getToken(error);
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
