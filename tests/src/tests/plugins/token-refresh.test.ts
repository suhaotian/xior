import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';
// @ts-ignore
import xior, { XiorResponse } from 'xior';
// @ts-ignore
import errorRetry from 'xior/plugins/error-retry';
// @ts-ignore
import setupTokenRefresh from 'xior/plugins/token-refresh';

import { startServer } from '../server';

let close: Function;
const port = 7873;
const baseURL = `http://localhost:${port}`;
before(async () => {
  close = await startServer(port);
});

after(async () => {
  return close(1);
});

describe('xior token refresh plugin tests', () => {
  const http = xior.create({ baseURL });
  let token = '123',
    refreshTimes = 0;
  http.interceptors.request.use((config) => {
    if (token) {
      config.headers['authorization'] = token;
    }
    return config;
  });
  function shouldRefresh(response: XiorResponse) {
    return Boolean(token && response?.status && [401, 403].includes(response.status));
  }
  http.plugins.use(
    errorRetry({
      enableRetry: (config, error) => {
        if (error?.response && shouldRefresh(error.response)) {
          return true;
        }
      },
    })
  );
  setupTokenRefresh(http, {
    shouldRefresh,
    async refreshToken(error) {
      refreshTimes += 1;
      const { data } = await http.post('/token/new');
      if (data.token) {
        token = data.token;
      } else {
        return Promise.reject(error);
      }
    },
  });

  it('should refresh token when status is 401 or 403', async () => {
    const [{ data }] = await Promise.all([
      http.post('/token/check'),
      http.post('/token/check2'),
      http.post('/token/check3'),
      http.post('/token/check4'),
    ]);
    assert.equal(data.msg, 'ok');
    assert.equal(token.startsWith('TOKEN_'), true);
    assert.equal(refreshTimes, 1);
  });
});
