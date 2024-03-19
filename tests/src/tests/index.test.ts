import assert from 'node:assert';
import { readFile, writeFile } from 'node:fs/promises';
import { before, after, describe, it } from 'node:test';
// @ts-ignore
import stringify from 'qs/lib/stringify';
import { XiorTimeoutError, isXiorError, merge, xior } from 'xior';

import { readChunks, startServer } from './server';

let close: Function;
const port = 7866;
const baseURL = `http://localhost:${port}`;
before(async () => {
  close = await startServer(port);
});

after(async () => {
  return close(1);
});

describe('xior tests', () => {
  describe('should work with methods GET/POST/PUT/PATCH/DELETE/HEAD/OPTIONS', () => {
    const xiorInstance = xior.create({ baseURL });

    it('xior.VERSION should be same with package.json', async () => {
      const content = await readFile('../package.json', 'utf-8');
      const pkg = JSON.parse(content);
      assert.strictEqual(xior.VERSION, pkg.version);
    });

    it('GET should work', async () => {
      const { data } = await xiorInstance.get<{
        method: string;
        body: object;
        query: Record<string, any>;
      }>('/get', { params: { a: 1, b: 2 } });
      assert.strictEqual(data.method, 'get');
      assert.strictEqual(Object.keys(data.body).length, 0);
      assert.strictEqual(data.query.a, '1');
      assert.strictEqual(data.query.b, '2');
    });

    it('POST should work', async () => {
      const { data } = await xiorInstance.post<{
        method: string;
        body: Record<string, any>;
        query: Record<string, any>;
      }>('/post', { a: 1, b: 2 }, { params: { a: 1, b: 2 } });
      assert.strictEqual(data.method, 'post');
      assert.strictEqual(Object.keys(data.body).length, 2);
      assert.strictEqual(data.body.a, 1);
      assert.strictEqual(data.body.b, 2);
      assert.strictEqual(data.query.a, '1');
      assert.strictEqual(data.query.b, '2');
    });

    it('DELETE should work', async () => {
      const { data } = await xiorInstance.delete<{
        method: string;
        body: Record<string, any>;
        query: Record<string, any>;
      }>('/delete', { params: { a: 1, b: 2 }, data: { c: 3 } });
      assert.strictEqual(data.method, 'delete');
      assert.strictEqual(data.query.a, '1');
      assert.strictEqual(data.query.b, '2');
      assert.strictEqual(data.query.c, '3');
      assert.strictEqual(Object.keys(data.body).length, 0);
    });

    it('PUT should work', async () => {
      const { data } = await xiorInstance.put<{
        method: string;
        body: Record<string, any>;
        query: Record<string, any>;
      }>('/put', { a: 1, b: 2 }, { params: { a: 1, b: 2 } });
      assert.strictEqual(data.method, 'put');
      assert.strictEqual(Object.keys(data.body).length, 2);
      assert.strictEqual(data.body.a, 1);
      assert.strictEqual(data.body.b, 2);
      assert.strictEqual(data.query.a, '1');
      assert.strictEqual(data.query.b, '2');
    });

    it('PATCH should work', async () => {
      const { data } = await xiorInstance.patch<{
        method: string;
        body: Record<string, any>;
        query: Record<string, any>;
      }>('/patch', { a: 1, b: 2 }, { params: { a: 1, b: 2 } });
      assert.strictEqual(data.method, 'patch');
      assert.strictEqual(Object.keys(data.body).length, 2);
      assert.strictEqual(data.body.a, 1);
      assert.strictEqual(data.body.b, 2);
      assert.strictEqual(data.query.a, '1');
      assert.strictEqual(data.query.b, '2');
    });

    it('HEAD should work', async () => {
      const { data, response } = await xiorInstance.head('/head', { params: { a: 1, b: 2 } });
      assert.strictEqual(data, undefined);
      assert.strictEqual(await response.text(), '');
    });

    it('OPTIONS should work', async () => {
      const { data } = await xiorInstance.options<{
        method: string;
        body: Record<string, any>;
        query: Record<string, any>;
      }>('/options', {
        params: { a: 1, b: 2 },
      });
      assert.strictEqual(data.method, 'options');
      assert.strictEqual(Object.keys(data.query).length, 2);
      assert.strictEqual(data.query.a, '1');
      assert.strictEqual(data.query.b, '2');
    });
  });

  describe('Options `encode` and `encodeURI` tests', () => {
    const xiorInstance = xior.create({ baseURL, withCredentials: true });

    it('default encode should work', async () => {
      const { data, request } = await xiorInstance.get<{
        method: string;
        body: object;
        query: Record<string, any>;
      }>('/get', { params: { a: 1, b: '2/', c: {} } });
      assert.strictEqual(data.query.a, '1');
      assert.strictEqual(data.query.b, '2/');
      assert.strictEqual(request._url, '/get?a=1&b=2%2F');
    });

    it('default encode with `encodeURI: false` should work', async () => {
      const { data, request } = await xiorInstance.get<{
        method: string;
        body: object;
        query: Record<string, any>;
      }>('/get', { params: { a: 1, b: '2/', c: {} }, encodeURI: false });
      assert.strictEqual(data.method, 'get');
      assert.strictEqual(data.query.a, '1');
      assert.strictEqual(data.query.b, '2/');
      assert.strictEqual(request._url, '/get?a=1&b=2/');
    });

    it('Use `qs.stringify` as custom encode function should work', async () => {
      const xiorInstance = xior.create({
        baseURL,
        encode: (params: Record<string, any>) => stringify(params, {}),
      });

      const { data, request } = await xiorInstance.get<{
        method: string;
        body: object;
        query: Record<string, any>;
      }>('/get', {
        params: { a: 1, b: '2/', c: { a: 1 } },
      });
      assert.strictEqual(data.method, 'get');
      assert.strictEqual(data.query.a, '1');
      assert.strictEqual(data.query.b, '2/');
      assert.strictEqual(data.query.c.a, '1');
      assert.strictEqual(request._url, '/get?a=1&b=2%2F&c%5Ba%5D=1');
    });
  });

  describe('`xior.interceptors` tests', () => {
    it('`xior.interceptors.request.use` should work', async () => {
      const xiorInstance = xior.create({ baseURL });
      xiorInstance.interceptors.request.use((config) => {
        return merge(config, {
          headers: {
            'x-custom-header': 'x123456',
          },
        });
      });
      const { data } = await xiorInstance.get<Record<string, any>>('/headers');
      assert.strictEqual(data.headers['x-custom-header'], 'x123456');
    });

    it('`xior.interceptors.response.use` should work', async () => {
      const xiorInstance = xior.create({
        baseURL,
        headers: { 'x-custom-header': 'x1234567890' },
      });
      xiorInstance.interceptors.response.use((config) => {
        return {
          ...config,
          data: config.data.headers,
        };
      });
      const { data } = await xiorInstance.get<Record<string, any>>('/headers');
      assert.strictEqual(data['x-custom-header'], 'x1234567890');
    });
  });

  describe('should work with basic configs or override configs', () => {
    it('baseURL', async () => {
      const xiorInstance = xior.create({
        baseURL,
      });
      assert.strictEqual(xiorInstance.config?.baseURL, baseURL);
      const { request } = await xiorInstance.get('/', { baseURL: baseURL + '/get' });
      assert.notEqual(request.baseURL, baseURL);
      assert.strictEqual(xiorInstance.config?.baseURL, baseURL);
    });

    it('headers', async () => {
      const xiorInstance = xior.create({
        baseURL,
        headers: { 'x-custom-header': 'x1234567890' },
      });
      const { data } = await xiorInstance.get<{ headers: Record<string, string> }>('/headers');
      assert.strictEqual(data.headers['x-custom-header'], 'x1234567890');

      const { data: result } = await xiorInstance.get<{ headers: Record<string, string> }>(
        '/headers',
        { headers: {} }
      );
      assert.strictEqual(result.headers['x-custom-header'], 'x1234567890');

      const { data: result2 } = await xiorInstance.get<{ headers: Record<string, string> }>(
        '/headers',
        {
          headers: { 'x-custom-header': '123456' },
        }
      );
      assert.strictEqual(result2.headers['x-custom-header'], '123456');
    });

    it('params', async () => {
      const xiorInstance = xior.create({
        baseURL,
        params: { a: 1, b: 2 },
      });
      assert.strictEqual(xiorInstance.config?.baseURL, baseURL);
      const { data } = await xiorInstance.get<{ query: Record<string, string> }>('/get', {
        params: { a: -1, c: 3 },
      });
      assert.strictEqual(data.query.c, '3');
      assert.strictEqual(data.query.a, '-1');
      assert.strictEqual(data.query.b, '2');
    });

    // data
  });

  describe('form data', () => {
    it('upload `sample.txt` file should work', async () => {
      const fileName = './src/tests/upload/sample.txt';
      const body = new FormData();
      const blob = new Blob([await readFile(fileName)]);
      body.set('field1', 'val1');
      body.set('field2', 'val2');
      body.set('file', blob, fileName);

      const xiorInstance = xior.create({ baseURL });
      const { data } = await xiorInstance.post<{ file: any; body: Record<string, string> }>(
        '/upload',
        body
      );
      assert.strictEqual(data.body.field1, 'val1');
      assert.strictEqual(data.body.field2, 'val2');
      assert.strictEqual(data.file.originalname, 'sample.txt');
      assert.strictEqual(
        await readFile(data.file.path, 'utf-8'),
        await readFile(fileName, 'utf-8')
      );
    });
  });

  describe('stream test', () => {
    it('stream with `responseType: stream` should work', async () => {
      const xiorInstance = xior.create({ baseURL });
      const { response } = await xiorInstance.post<{ file: any; body: Record<string, string> }>(
        '/stream/10',
        null,
        { responseType: 'stream' }
      );
      const reader = response.body!.getReader();
      let chunk;
      for await (chunk of readChunks(reader)) {
        console.log(`received chunk of size ${chunk.length}`);
      }
      assert.strictEqual(chunk.length > 0, true);
    });

    it('stream download image should work', async () => {
      const xiorInstance = xior.create({ baseURL });

      // GET request for remote image in node.js
      await xiorInstance
        .get('https://bit.ly/2mTM3nY', {
          responseType: 'stream',
        })
        .then(async function ({ response, config }) {
          const buffer = Buffer.from(await response.arrayBuffer());
          return writeFile('./uploads/ada_lovelace.jpg', buffer);
        });

      assert.strictEqual(1 > 0, true);
    });
  });

  describe('custom AbortController signal should work', () => {
    it('should work with abort early GET', async () => {
      const xiorInstance = xior.create({ baseURL });
      const controller = new AbortController();
      class CancelFetchError extends Error {}
      setTimeout(() => {
        controller.abort(new CancelFetchError('hi'));
      }, 500);
      let timeoutError = true;
      try {
        await xiorInstance.get('/timeout', { signal: controller.signal, timeout: 1000 });
      } catch (e) {
        timeoutError = !(e instanceof CancelFetchError);
      }
      assert.strictEqual(timeoutError, false);
    });

    it('should work with timeout GET', async () => {
      const xiorInstance = xior.create({ baseURL });
      const controller = new AbortController();
      setTimeout(() => {
        controller.abort(new Error('hi'));
      }, 1200);
      let timeoutError = false;
      try {
        await xiorInstance.get('/timeout', { signal: controller.signal, timeout: 1000 });
      } catch (e) {
        timeoutError = isXiorError(e);
      }
      assert.strictEqual(timeoutError, true);
    });

    it('should work with abort early POST', async () => {
      const xiorInstance = xior.create({ baseURL });
      const controller = new AbortController();
      class CancelFetchError extends Error {}
      setTimeout(() => {
        controller.abort(new CancelFetchError('hi'));
      }, 500);
      let timeoutError = true;
      try {
        await xiorInstance.post('/timeout', null, { signal: controller.signal, timeout: 1000 });
      } catch (e) {
        timeoutError = !(e instanceof CancelFetchError);
      }
      assert.strictEqual(timeoutError, false);
    });

    it('should work with timeout POST', async () => {
      const xiorInstance = xior.create({ baseURL });
      const controller = new AbortController();
      setTimeout(() => {
        controller.abort(new Error('hi'));
      }, 1200);
      let timeoutError = false;
      try {
        await xiorInstance.post('/timeout', null, { signal: controller.signal, timeout: 1000 });
      } catch (e) {
        timeoutError = isXiorError(e);
      }
      assert.strictEqual(timeoutError, true);
    });
  });

  describe('custom plugins should work', () => {
    it('should work with custom plugin', async () => {
      const xiorInstance = xior.create({ baseURL });

      xiorInstance.plugins.use(function plugin1(adapter) {
        return async (config) => {
          const res = await adapter(config);
          return res;
        };
      });

      xiorInstance.plugins.use(function plugin2(adapter) {
        return async (config) => {
          const res = await adapter(config);
          return res;
        };
      });

      xiorInstance.plugins.use(function logPlugin(adapter) {
        return async (config) => {
          const start = Date.now();
          const res = await adapter(config);
          console.log('%s %s take %sms', config.method, config.url, Date.now() - start);
          return res;
        };
      });
      const { data: getData } = await xiorInstance.get<{ method: string }>('/get');
      assert.strictEqual(getData.method, 'get');

      const { data: postData } = await xiorInstance.post<{ method: string }>('/post');
      assert.strictEqual(postData.method, 'post');
    });
  });

  describe('interceptors and plugins eject and clear tests', () => {
    const xiorInstance = xior.create({ baseURL });

    it('xior.interceptors.request.use/eject/clear should work', () => {
      // xior requestInterceptors always have at least 1 default interceptor
      assert.strictEqual((xiorInstance as any).requestInterceptors.length, 1);
      const handler = xiorInstance.interceptors.request.use((config) => {
        return config;
      });
      xiorInstance.interceptors.request.use((config) => {
        return config;
      });
      assert.strictEqual((xiorInstance as any).requestInterceptors.length - 1, 2);
      xiorInstance.interceptors.request.eject(handler);
      assert.strictEqual((xiorInstance as any).requestInterceptors.length - 1, 1);

      xiorInstance.interceptors.request.clear();
      assert.strictEqual((xiorInstance as any).requestInterceptors.length, 1);
    });

    it('xior.interceptors.response.use/eject/clear should work', () => {
      assert.strictEqual((xiorInstance as any).responseInterceptors.length, 0);
      const handler = xiorInstance.interceptors.response.use((config) => {
        return config;
      });
      xiorInstance.interceptors.response.use((config) => {
        return config;
      });
      assert.strictEqual((xiorInstance as any).responseInterceptors.length, 2);
      xiorInstance.interceptors.response.eject(handler);
      assert.strictEqual((xiorInstance as any).responseInterceptors.length, 1);

      xiorInstance.interceptors.response.clear();
      assert.strictEqual((xiorInstance as any).responseInterceptors.length, 0);
    });

    it('xior.plugins.use/eject/clear should work', () => {
      assert.strictEqual((xiorInstance as any)._plugins.length, 0);
      const handler = xiorInstance.plugins.use((plugin) => {
        return (config) => {
          return plugin(config);
        };
      });
      xiorInstance.plugins.use((plugin) => {
        return (config) => {
          return plugin(config);
        };
      });
      assert.strictEqual((xiorInstance as any)._plugins.length, 2);
      xiorInstance.plugins.eject(handler);
      assert.strictEqual((xiorInstance as any)._plugins.length, 1);

      xiorInstance.plugins.clear();
      assert.strictEqual((xiorInstance as any)._plugins.length, 0);
    });
  });
});
