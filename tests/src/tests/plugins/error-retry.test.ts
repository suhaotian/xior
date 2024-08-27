import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';
import xior, { XiorError, XiorRequestConfig, isXiorError } from 'xior';
import xiorErrorRetryPlugin from 'xior/plugins/error-retry';

import { startServer } from '../server';

let close: Function;
const port = 7870;
const baseURL = `http://localhost:${port}`;
before(async () => {
  close = await startServer(port);
});

after(async () => {
  return close(1);
});

describe('xior error retry plugin tests', () => {
  const instance = xior.create({ baseURL });
  instance.plugins.use(
    xiorErrorRetryPlugin({
      retryInterval: 1000,
      retryTimes: 3,
    })
  );

  it('should retry when `GET` error until success', async () => {
    await instance.get('/reset-error');
    const { data } = await instance.get('/retry-error', { params: { count: 3 } });
    assert.strictEqual(data.count, 3);
    assert.strictEqual(data.errorCount, 3);
  });

  it('should throw error when finish retryTimes', async () => {
    await instance.get('/reset-error');
    let error: XiorError | undefined = undefined;
    try {
      await instance.get('/retry-error', {
        params: { count: 3 },
        retryTimes: 2,
        retryInterval(count: number) {
          return count * 200;
        },
        onRetry(config: any, error: any, count: any) {
          console.log(`RETRY LOG: ${config.method} ${config.url} ${count} retry`);
        },
      } as any);
    } catch (e) {
      if (isXiorError(e)) {
        error = e as XiorError;
      }
    }
    assert.strictEqual(typeof error !== 'undefined', true);
    assert.strictEqual(error?.response?.data.errorCount, 2);
    assert.strictEqual(error?.response?.data.count, 3);
  });

  it('No retry with `POST` method in default', async () => {
    await instance.post('/reset-error');
    let error: XiorError | undefined = undefined;
    try {
      await instance.post('/retry-error', { count: 1 });
    } catch (e) {
      if (isXiorError(e)) {
        error = e as XiorError;
      }
    }
    assert.strictEqual(typeof error !== 'undefined', true);
    assert.strictEqual(error?.response?.data.errorCount, 0);
    assert.strictEqual(error?.response?.data.count, 1);
  });

  it('should retry when `POST` error with `enableRetry: true` until success', async () => {
    await instance.get('/reset-error');
    const { data } = await instance.post('/retry-error', { count: 3 }, {
      enableRetry: true,
      headers: {},
    } as any);
    assert.strictEqual(data.count, 3);
    assert.strictEqual(data.errorCount, 3);
  });

  it('should retry when `POST` error with `isGet: true` until success', async () => {
    await instance.get('/reset-error');
    const { data } = await instance.post(
      '/retry-error',
      { count: 3 },
      {
        isGet: true,
      }
    );
    assert.strictEqual(data.count, 3);
    assert.strictEqual(data.errorCount, 3);
  });

  it('should throw error when run out `retryTimes: 2` when `POST` error with `enableRetry: true`', async () => {
    const instance = xior.create({ baseURL });
    instance.plugins.use(
      xiorErrorRetryPlugin({
        retryInterval: 1000,
      })
    );
    await instance.get('/reset-error');
    let error: XiorError | undefined = undefined;
    try {
      await instance.post('/retry-error', { count: 3 }, {
        // retryTimes: 2,
        enableRetry: true,
      } as any);
    } catch (e) {
      if (isXiorError(e)) {
        error = e as XiorError;
      }
    }
    assert.strictEqual(typeof error !== 'undefined', true);
    assert.strictEqual(error?.response?.data.errorCount, 2);
    assert.strictEqual(error?.response?.data.count, 3);
  });

  it("should use the latest request interceptors's request config when error retry", async () => {
    await xior.get('/reset-error', { baseURL });

    const instance = xior.create({ baseURL });

    let S = '';
    let responseInterceptorCount = 0;
    let errorCount = 0;

    instance.interceptors.request.use((config) => {
      if (S) {
        config.headers['S'] = S;
      }
      return config;
    });

    instance.interceptors.response.use(
      (res) => {
        responseInterceptorCount++;
        return res;
      },
      (e) => {
        errorCount++;
        if (!S) {
          S = 'S123456';
        }
        throw e;
      }
    );

    instance.plugins.use(
      xiorErrorRetryPlugin({
        retryInterval: (count) => count * 500,
        onRetry(config, error, count) {
          (config as any).isRetry = true;
          (config as any).retryCount = count;
          console.log(`${config.method} ${config.url} retry ${count} times`);
        },
      })
    );
    let error: XiorError | undefined = undefined;
    let msg = '';
    let config: XiorRequestConfig = {};
    try {
      const { data, config: _config } = await instance.post('/retry-error', { count: 3 }, {
        retryTimes: 3,
        enableRetry: true,
      } as any);
      config = _config;
      msg = data.msg;
    } catch (e) {
      if (isXiorError(e)) {
        error = e as XiorError;
      }
    }
    assert.strictEqual((config as any).isRetry, true);
    assert.strictEqual(errorCount, 1);
    assert.strictEqual(
      responseInterceptorCount,
      1,
      'responseInterceptorCount should run only once'
    );
    assert.strictEqual(msg, 'ok');
    assert.strictEqual(typeof error === 'undefined', true);
  });

  it('shouldn\t error retry with `enableRetry: config `', async () => {
    const instance = xior.create({ baseURL });
    instance.plugins.use(
      xiorErrorRetryPlugin({
        retryInterval: 1000,
        onRetry(config, error, count) {
          (config as any).isRetry = true;
          (config as any).retryCount = count;
        },
      })
    );
    await instance.get('/reset-error');
    let error: XiorError | undefined = undefined;
    try {
      await instance.post('/retry-error-401', { count: 3 }, {
        // retryTimes: 2,
        enableRetry: (config: XiorRequestConfig, error: XiorError) => {
          if (error.response?.status === 401) return false;
          return true;
        },
      } as any);
    } catch (e) {
      if (isXiorError(e)) {
        error = e as XiorError;
      }
    }
    assert.strictEqual(typeof error !== 'undefined', true);
    assert.strictEqual(error?.response?.data.errorCount, 0);
    assert.strictEqual(error?.response?.data.count, 3);
    assert.strictEqual((error?.response?.config as any)?.isRetry, undefined);
  });

  it('Custom response interceptors throw error should retry default', async () => {
    const instance = xior.create({ baseURL });
    instance.interceptors.response.use((res) => {
      return Promise.reject(new XiorError('Something wrong', res.config, res));
    });
    instance.plugins.use(
      xiorErrorRetryPlugin({
        retryInterval: 200,
        onRetry(config, error, count) {
          console.log('onRetry error', error);
          (config as any).isRetry = true;
          (config as any).retryCount = count;
        },
      })
    );
    let error: XiorError | undefined = undefined;
    try {
      await instance.get('/reset-error');
    } catch (e) {
      error = e as XiorError;
    }
    assert.strictEqual(typeof error !== 'undefined', true);
    assert.strictEqual((error?.response?.config as any)?.isRetry, true);
    assert.strictEqual((error?.response?.config as any)?.retryCount, 2);
  });
});
