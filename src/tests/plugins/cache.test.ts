import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';
// @ts-ignore
import stringify from 'qs/lib/stringify';
import { lru } from 'tiny-lru';

import xiorCachePlugin from '../../plugins/cache';
import { delay } from '../../plugins/utils';
import { xior } from '../../xior';
import { startServer } from '../server';

let close: Function;
const port = 7869;
const baseURL = `http://localhost:${port}`;
before(async () => {
  close = await startServer(port);
});

after(async () => {
  return close(1);
});

describe('xior cache plguins tests', () => {
  const instance = xior.create({ baseURL, encode: (params) => stringify(params) });
  const cache = lru(10, 1000 * 4);
  instance.plugins.use(
    xiorCachePlugin({
      enableCache: (config) => config?.method === 'GET',
      defaultCache: cache,
    })
  );

  it('cache size should be 0 when cache create', () => {
    assert.strictEqual(cache.size, 0);
  });

  it('cache size should be 1 when request', async () => {
    const { data } = await instance.get<{ value: string }>('/get', {
      headers: {
        'x-custom-value': '1',
      },
    });
    assert.strictEqual(cache.size, 1);
    assert.strictEqual(data.value, '1');
  });

  it('cache size should be 1 get from cache when request same data', async () => {
    const result: string[] = [];
    const fromCache: boolean[] = [];
    await Promise.all(
      Array(5)
        .fill(5)
        .map(async () => {
          const res = await instance.get('/get', {
            headers: {
              'x-custom-value': '2',
            },
          });
          result.push(res.data.value);
          fromCache.push((res as any).fromCache);
          return res.data;
        })
    );
    assert.strictEqual(cache.size, 1);
    assert.strictEqual(result.join(','), '1,1,1,1,1');
    assert.strictEqual(fromCache.join(','), 'true,true,true,true,true');
  });

  it('delay 5 seconds, should return latest new data', async () => {
    await delay(5 * 1000);
    const { data } = await instance.get('/get', {
      headers: {
        'x-custom-value': '9',
      },
    });
    assert.strictEqual(cache.size, 1);
    assert.strictEqual(data.value, '9');
  });

  it('cache size should be 2 when request one more time with different data', async () => {
    const { data } = await instance.get('/get', {
      params: { a: 2 },
      headers: {
        'x-custom-value': '2',
      },
    });
    assert.strictEqual(cache.size, 2);
    assert.strictEqual(data.value, '2');
  });

  it('should refresh data when `forceUpdate: true`', async () => {
    const { data } = await instance.get('/get', {
      params: { a: 2 },
      headers: {
        'x-custom-value': '2',
      },
    });
    assert.strictEqual(data.value, '2');
    const { data: data2 } = await instance.get('/get', {
      params: { a: 2 },
      headers: {
        'x-custom-value': '3',
      },
      forceUpdate: true,
    } as any);
    assert.strictEqual(data2.value, '3');
  });

  it('cache size should still be 2 when `enableCache: false`', async () => {
    await instance.get('/get', { params: { a: 3 }, enableCache: false } as any);
    assert.strictEqual(cache.size, 2);
  });

  it('cache size should still be 2 when request is `POST`', async () => {
    await instance.post('/post', { params: { a: 3 } });
    assert.strictEqual(cache.size, 2);
  });

  it('cache size should still be 3 when request is `POST` and `enableCache: true`', async () => {
    await instance.post('/post', {}, { params: { a: 1 }, enableCache: true } as any);
    assert.strictEqual(cache.size, 3);
  });

  it('cache size should be max 10 after 10 requests', async () => {
    await Promise.all(
      Array(12)
        .fill(1)
        .map((item, idx) => {
          return instance.get('/get', { params: { a: 5 + idx } });
        })
    );
    assert.strictEqual(cache.size, 10);
  });

  it('cache will be removed when request error', async () => {
    await instance
      .get('/get', {
        params: { a: 6 },
        headers: {
          'x-custom-value': 'error',
        },
      })
      .catch((e) => {
        return e;
      });
    assert.strictEqual(cache.size, 9);
  });

  it('cache will be all removed when requests error', async () => {
    await Promise.all(
      Array(12)
        .fill(1)
        .map((item, idx) => {
          return instance
            .get('/get', {
              params: { a: 5 + idx },
              headers: {
                'x-custom-value': 'error',
              },
            })
            .catch((e) => {
              return e;
            });
        })
    );
    assert.strictEqual(cache.size, 0);
  });

  it('use a custom cache with request individual config', async () => {
    const customCache = lru(10);
    await Promise.all(
      Array(12)
        .fill(1)
        .map((item, idx) => {
          return instance.get('/get', { params: { a: 5 + idx }, defaultCache: customCache } as any);
        })
    );
    assert.strictEqual(cache.size, 0);
    assert.strictEqual(customCache.size, 10);
  });
});
