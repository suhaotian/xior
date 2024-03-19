import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';

import xior from '../..';
import xiorErrorRetryPlugin from '../../plugins/error-retry';
import { XiorError } from '../../utils';
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
      if (e instanceof XiorError) {
        error = e;
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
      if (e instanceof XiorError) {
        error = e;
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
    await instance.get('/reset-error');
    let error: XiorError | undefined = undefined;
    try {
      await instance.post('/retry-error', { count: 3 }, {
        retryTimes: 2,
        enableRetry: true,
      } as any);
    } catch (e) {
      if (e instanceof XiorError) {
        error = e;
      }
    }
    assert.strictEqual(typeof error !== 'undefined', true);
    assert.strictEqual(error?.response?.data.errorCount, 2);
    assert.strictEqual(error?.response?.data.count, 3);
  });
});
