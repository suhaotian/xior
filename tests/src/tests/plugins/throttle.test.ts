import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';
// @ts-ignore
import stringify from 'qs/lib/stringify';
import { xior, delay } from 'xior';
import xiorThrottlePlugin from 'xior/plugins/throttle';

import { startServer } from '../server';

let close: Function;
const port = 7871;
const baseURL = `http://localhost:${port}`;
before(async () => {
  close = await startServer(port);
});

after(async () => {
  return close(1);
});

describe('xior throttle plugin tests', () => {
  const instance = xior.create({ baseURL, paramsSerializer: (params) => stringify(params) });
  instance.plugins.use(
    xiorThrottlePlugin({
      threshold: 1000,
      onThrottle(config) {
        console.log(`Throttle requests ${config.method} ${config.url}`);
      },
    })
  );

  it('should request only once when send multiple but same requests at once', async () => {
    const result: number[] = [];
    await Promise.all(
      Array(10)
        .fill(1)
        .map((item, idx) => {
          return instance
            .get('/get', {
              params: { a: 1 },
              headers: {
                'x-custom-value': idx,
              },
            })
            .then((res) => {
              result.push(+res.data.value);
            });
        })
    );
    assert.strictEqual(result[0], 0);
    assert.strictEqual(result[1], 0);
    assert.strictEqual(result[9], 0);
  });

  it('should send second request after delay 1.1 seconds', async () => {
    const { data: data1 } = await instance.get('/get', {
      params: { a: 1 },
      headers: {
        'x-custom-value': 2,
      },
    });
    assert.strictEqual(data1.value, '0');
    await delay(1050);
    const { data } = await instance.get('/get', {
      params: { a: 1 },
      headers: {
        'x-custom-value': 2,
      },
    });
    assert.strictEqual(data.value, '2');
  });

  it('should send requests multiple times when send multiple but same requests with `enableThrottle: false` method', async () => {
    const result: number[] = [];
    await Promise.all(
      Array(10)
        .fill(1)
        .map((item, idx) => {
          return instance
            .get('/get', {
              params: { a: 1 },
              headers: {
                'x-custom-value': idx,
              },
              enableThrottle: false,
            } as any)
            .then((res) => {
              result.push(+res.data.value);
            });
        })
    );
    result.sort();
    assert.strictEqual(result[0], 0);
    assert.strictEqual(result[1], 1);
    assert.strictEqual(result[9], 9);
  });

  it('should request only once when send multiple but same requests with `POST` method when `enableThrottle: true`', async () => {
    const result: number[] = [];
    await Promise.all(
      Array(10)
        .fill(1)
        .map((item, idx) => {
          return instance
            .post('/post', { b: 2 }, {
              params: { a: 1 },
              headers: {
                'x-custom-value': idx,
              },
              enableThrottle: true,
            } as any)
            .then((res) => {
              result.push(+res.data.value);
            });
        })
    );
    assert.strictEqual(result[0], 0);
    assert.strictEqual(result[1], 0);
    assert.strictEqual(result[9], 0);
  });

  it('should request only once when send multiple but same requests with `POST` method when `isGet: true`', async () => {
    const result: number[] = [];
    await Promise.all(
      Array(10)
        .fill(1)
        .map((item, idx) => {
          return instance
            .post(
              '/post',
              { a: 1, b: 2 },
              {
                params: { a: 1 },
                headers: {
                  'x-custom-value': idx,
                },
                isGet: true,
              }
            )
            .then((res) => {
              result.push(+res.data.value);
            });
        })
    );
    assert.strictEqual(result[0], 0);
    assert.strictEqual(result[1], 0);
    assert.strictEqual(result[9], 0);
  });
});
