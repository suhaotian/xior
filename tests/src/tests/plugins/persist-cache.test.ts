import fs from 'fs/promises';
import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { lru, LRU } from 'tiny-lru';
import { Xior as xior, delay, Xior, XiorResponse } from 'xior';
import xiorCachePlugin from 'xior/plugins/cache';
import errorCachePlugin from 'xior/plugins/error-cache';

import { startServer } from '../server';

let close: Function;
const port = 7778;
const baseURL = `http://localhost:${port}`;
before(async () => {
  close = await startServer(port);
});

after(async () => {
  return close(1);
});

export function persistCachePlugin(
  xiorInstance: Xior,
  cache: LRU<any>,
  defaultCacheForErrorCachePlugin: LRU<{
    loading?: boolean;
    res?: XiorResponse;
    cacheTime?: number;
  }>,
  filePath: string,
  debounceTime = 500
) {
  xiorInstance.interceptors.response.use((response) => {
    if (!response.fromCache && response.cacheKey) {
      debouncedSyncToFs();
    }
    return response;
  });

  async function initFromFs() {
    try {
      const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
      data.forEach(([key, value]: [string, any]) => {
        if (value) {
          cache.set(key, Promise.resolve(value));
          defaultCacheForErrorCachePlugin.set(key, {
            loading: false,
            res: Promise.resolve(value) as unknown as XiorResponse,
            cacheTime: value.cacheTime,
          });
        }
      });
    } catch (e) {
      console.error('initFromFs error:', e);
    }
  }

  async function syncToFs() {
    const keys = cache.keys();
    const data = await Promise.all(keys.map(async (key) => [key, await cache.get(key)]));
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  }
  const debouncedSyncToFs = debounce(syncToFs, debounceTime);

  function debounce(func: () => Promise<void>, wait: number) {
    let timeout: NodeJS.Timeout | null = null;
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => {
        func();
      }, wait);
    };
  }

  return { initFromFs, debouncedSyncToFs };
}

const instance = xior.create({ baseURL });
const defaultCache = lru(100, 1000 * 60 * 5);
const defaultCacheForErrorCachePlugin = lru(100, 1000 * 60 * 5);

instance.plugins.use(
  xiorCachePlugin({
    enableCache: (config) => config?.method === 'GET' || config?.isGet === true,
    defaultCache: defaultCache,
  })
);
instance.plugins.use(
  errorCachePlugin({
    enableCache: (config) => config?.method === 'GET' || config?.isGet === true,
    defaultCache: defaultCacheForErrorCachePlugin,
  })
);
const { initFromFs } = persistCachePlugin(
  instance,
  defaultCache,
  defaultCacheForErrorCachePlugin,
  './cache.json',
  500
);

describe('xior cache plugin tests', async () => {
  it('Generate cache data should work', async () => {
    for (const key of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const { data } = await instance.get<{ value: string }>('/get', {
        params: { idx: key },
        headers: {
          'x-custom-value': key,
        },
      });
      assert.strictEqual(data.value, key + '');
    }
    assert.strictEqual(defaultCache.size, 8);
    await delay(600);
  });

  it('Async cache should work', async () => {
    defaultCache.clear();
    assert.strictEqual(defaultCache.size, 0);

    await initFromFs();

    assert.strictEqual(defaultCache.size, 8);
    for (const key of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const { data, fromCache } = await instance.get<{ value: string }>('/get', {
        params: { idx: key },
        headers: {
          'x-custom-value': key,
        },
      });
      assert.strictEqual(data.value, key + '');
      assert.strictEqual(fromCache, true);
    }
  });
});
