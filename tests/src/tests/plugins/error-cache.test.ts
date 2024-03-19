import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { xior } from 'xior';
import xiorErrorCachePlugin from 'xior/plugins/error-cache';
import xiorErrorRetryPlugin from 'xior/plugins/error-retry';

import { startServer } from '../server';

let close: Function;
const port = 7881;
const baseURL = `http://localhost:${port}`;
before(async () => {
  close = await startServer(port);
});

after(async () => {
  return close(1);
});

describe('xior error cache plugin tests', () => {
  const instance = xior.create({ baseURL });
  const errorCachePlugin = xiorErrorCachePlugin({});
  instance.plugins.use(errorCachePlugin);
  it('should use cache if request error', async () => {
    await instance.get('/get', { params: { a: 1, b: 2 } });
    const res = await instance.get('/get', {
      params: { a: 1, b: 2 },
      headers: {
        'x-custom-value': 'error',
      },
    });
    assert.strictEqual((res as any).fromCache, true);
    assert.strictEqual(res.data.query.a, '1');
    assert.strictEqual(res.data.query.b, '2');
  });

  it('should not use cache if request ok', async () => {
    await instance.get('/get', { params: { a: 1, b: 2 } });
    const res = await instance.get('/get', {
      params: { a: 2, b: 4 },
    });
    assert.strictEqual((res as any).fromCache, undefined);
    assert.strictEqual(res.data.query.a, '2');
    assert.strictEqual(res.data.query.b, '4');
  });

  it("shouldn't use cache if request error when `enableCache: false`", async () => {
    await instance.get('/get', { params: { a: 1, b: 2 } });

    let hasError = false;
    await instance
      .get('/get', {
        params: { a: 1, b: 2 },
        headers: {
          'x-custom-value': 'error',
        },
        enableCache: false,
      } as any)
      .catch(() => {
        hasError = true;
      });
    assert.strictEqual(hasError, true);
  });

  it('should work with error-retry plugin', async () => {
    const retryPlugin = xiorErrorRetryPlugin({
      retryInterval: 1000,
      retryTimes: 3,
    });
    instance.plugins.use(retryPlugin);

    await instance.get('/reset-error');
    const { data, fromCache }: any = await instance.get('/retry-error', { params: { count: 3 } });
    assert.strictEqual(fromCache, undefined);
    assert.strictEqual(data.count, 3);
    assert.strictEqual(data.errorCount, 3);

    await instance.get('/reset-error');
    const res = await instance.get('/retry-error', {
      params: { count: 3 },
      retryTimes: 1,
    } as any);

    assert.strictEqual((res as any).fromCache, true);
    assert.strictEqual(res.data.count, 3);
    assert.strictEqual(res.data.errorCount, 3);
  });
});
