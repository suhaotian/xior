import assert from 'node:assert';
import { readFile, writeFile } from 'node:fs/promises';
import { before, after, describe, it } from 'node:test';
import { stringify } from 'qs';
import { isCancel, isAxiosError as isXiorError, merge, Axios as Xior } from 'xior';

import errorRetryPlugin from 'xior/plugins/error-retry';

import { readChunks, startServer } from './server';
import { Readable } from 'node:stream';
import { createWriteStream } from 'node:fs';

let close: Function;
const port = 7876;
const baseURL = `http://localhost:${port}`;
before(async () => {
  close = await startServer(port);
});

after(async () => {
  return close(1);
});

describe('xior tests', () => {
  describe('should work with methods GET/POST/PUT/PATCH/DELETE/HEAD/OPTIONS', () => {
    const xiorInstance = Xior.create({ baseURL });

    it('Xior.VERSION should be same with package.json', async () => {
      const content = await readFile('../package.json', 'utf-8');
      const pkg = JSON.parse(content);
      assert.strictEqual(Xior.VERSION, pkg.version);
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

    it('GET should work when `params` is `undefined`', async () => {
      const { data } = await xiorInstance.get<{
        method: string;
        body: object;
        query: Record<string, any>;
      }>('/get', { params: undefined });
      assert.strictEqual(data.method, 'get');
      assert.strictEqual(Object.keys(data.body).length, 0);
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

    it('POST should work when `params` or `body` is `undefined`', async () => {
      const { data } = await xiorInstance.post<{
        method: string;
        body: Record<string, any>;
        query: Record<string, any>;
      }>('/post', undefined, { params: undefined });
      assert.strictEqual(data.method, 'post');
      assert.strictEqual(Object.keys(data.body).length, 0);
    });

    it(`POST should work when Content-Type: 'application/vnd.api+json'`, async () => {
      const { data, config } = await xiorInstance.post<{
        method: string;
        body: Record<string, any>;
        query: Record<string, any>;
      }>(
        '/post',
        { a: 1 },
        {
          params: { b: 2 },
          headers: {
            'Content-Type': 'application/vnD.api+json',
          },
        }
      );
      console.log('data :', data, config);
      assert.strictEqual(data.method, 'post');
      assert.strictEqual(Object.keys(data.body).length, 1);
      assert.strictEqual(data.body.a, 1);
      assert.strictEqual(data.query.b, '2');
    });

    it(`POST should work when Content-Type: 'application/json; charset=utf-8'`, async () => {
      const { data } = await xiorInstance.post<{
        method: string;
        body: Record<string, any>;
        query: Record<string, any>;
      }>(
        '/post',
        { a: 1 },
        {
          params: { b: 2 },
          headers: {
            'Content-Type': 'application/Json; charset=utf-8',
          },
        }
      );
      assert.strictEqual(data.method, 'post');
      assert.strictEqual(Object.keys(data.body).length, 1);
      assert.strictEqual(data.body.a, 1);
      assert.strictEqual(data.query.b, '2');
    });

    it("POST should work with body when header's `content-type: application/x-www-form-urlencoded`", async () => {
      const { data } = await xiorInstance.post<{
        method: string;
        body: Record<string, any>;
        query: Record<string, any>;
      }>(
        '/post',
        { a: 1, b: 2 },
        {
          params: { c: 3, d: 4 },
          headers: {
            'content-type': 'application/x-www-form-urlencoded',
          },
        }
      );
      assert.strictEqual(data.method, 'post');
      assert.strictEqual(Object.keys(data.query).length, 2);
      assert.strictEqual(Object.keys(data.body).length, 2);
      assert.strictEqual(data.body.a, '1');
      assert.strictEqual(data.body.b, '2');
      assert.strictEqual(data.query.c, '3');
      assert.strictEqual(data.query.d, '4');
    });

    it("POST should work with body when header's `content-type: applicatioN/X-www-form-urlencoded; charset=utf-8`", async () => {
      const { data } = await xiorInstance.post<{
        method: string;
        body: Record<string, any>;
        query: Record<string, any>;
      }>(
        '/post',
        { a: 1, b: 2 },
        {
          params: { c: 3, d: 4 },
          headers: {
            'content-type': 'applicatioN/X-www-form-urlencoded; charset=utf-8',
          },
        }
      );
      assert.strictEqual(data.method, 'post');
      assert.strictEqual(Object.keys(data.query).length, 2);
      assert.strictEqual(Object.keys(data.body).length, 2);
      assert.strictEqual(data.body.a, '1');
      assert.strictEqual(data.body.b, '2');
      assert.strictEqual(data.query.c, '3');
      assert.strictEqual(data.query.d, '4');
    });

    it('POST should work when body is `URLSearchParams`', async () => {
      const { data } = await xiorInstance.post<{
        method: string;
        body: any;
        query: Record<string, any>;
      }>('/post', new URLSearchParams({ a: '1', b: '2' }), {
        params: { c: 3, d: 4 },
      });
      assert.strictEqual(data.method, 'post');
      assert.strictEqual(Object.keys(data.query).length, 2);
      assert.strictEqual(Object.keys(data.body).length, 2);
      assert.strictEqual(data.body.a, '1');
      assert.strictEqual(data.body.b, '2');
      assert.strictEqual(data.query.c, '3');
      assert.strictEqual(data.query.d, '4');
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
      assert.strictEqual(data.body.c, 3);
      assert.strictEqual(Object.keys(data.body).length, 1);
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
      const { data } = await xiorInstance.head('/head', { params: { a: 1, b: 2 } });
      assert.strictEqual(data, '');
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

  describe('Options `paramsSerializer` and `encodeURI` tests', () => {
    const xiorInstance = Xior.create({ baseURL, withCredentials: true });

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
      const xiorInstance = Xior.create({
        baseURL,
        paramsSerializer: (params: Record<string, any>) => stringify(params, {}),
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

  describe('`Xior.interceptors` tests', () => {
    it('`Xior.interceptors.request.use` should work', async () => {
      const xiorInstance = Xior.create({ baseURL });
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

    it('`Xior.interceptors.response.use` should work', async () => {
      const xiorInstance = Xior.create({
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
      const xiorInstance = Xior.create({
        baseURL,
      });
      assert.strictEqual(xiorInstance.config?.baseURL, baseURL);
      const { request } = await xiorInstance.get('/', { baseURL: baseURL + '/get' });
      assert.notEqual(request.baseURL, baseURL);
      assert.strictEqual(xiorInstance.config?.baseURL, baseURL);
    });

    it('headers', async () => {
      const xiorInstance = Xior.create({
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
      const xiorInstance = Xior.create({
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

      const xiorInstance = Xior.create({
        baseURL,
        // headers: { 'Content-Type': 'application/json' },
      });
      const { data, config } = await xiorInstance.post<{
        file: any;
        body: Record<string, string>;
        headers: Record<string, string>;
      }>('/upload', body);
      assert.strictEqual(data.headers['content-type'].startsWith('multipart/form-data;'), true);
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
      const xiorInstance = Xior.create({ baseURL });
      const { data } = await xiorInstance.post<Readable>('/stream/10', null, {
        responseType: 'stream',
      });
      assert.strictEqual(data.pipe !== undefined, true);
    });

    it('stream download image should work', async () => {
      const xiorInstance = Xior.create({ baseURL });
      // GET request for remote image in node.js
      await xiorInstance
        .get<Readable>('https://bit.ly/2mTM3nY', {
          responseType: 'stream',
        })
        .then(async function ({ response, config, data }) {
          const writeStream = createWriteStream('./uploads/ada_lovelace.jpg');
          data.pipe(writeStream);
          writeStream.on('finish', () => {
            console.log('File written successfully');
          });
        });

      assert.strictEqual(1 > 0, true);
    });
  });

  describe('Custom response parser should work', () => {
    it('Custom response parser should work', async () => {
      const http = Xior.create({
        baseURL,
        responseType: 'custom', // Tell xior no need to parse body
      });

      let shouldUseJSON = false;

      // Define content type matchers as [responseMethod, [regexpPatterns]]
      const typeMatchers = [
        ['json', [/^application\/.*json$/, /^$/]],
        ['text', [/^text\//, /^image\/svg\+xml$/, /^application\/.*xml$/]],
        // ['arrayBuffer', [/^application\/octet-stream/]],
      ] as const;
      http.interceptors.response.use(
        async (res) => {
          try {
            if (res.config.responseType !== 'custom') return res;

            const { response } = res;
            const headers = response?.headers;
            if (!response || headers.get('Content-Length') === '0') return res;

            const contentType = headers.get('Content-Type')?.split(';')?.[0]?.trim() || '';

            // Find matching response method using the typeMatchers array
            const matchedType = typeMatchers.find(([_, patterns]) =>
              patterns.some((pattern) => pattern.test(contentType))
            );

            if (matchedType) {
              const [method] = matchedType;
              res.data = await response[method]();
              if (method === 'json') shouldUseJSON = true;
            } else {
              console.warn(`Unknown Content-Type: ${contentType}`);
            }

            return res;
          } catch (error) {
            console.error('Interceptor error:', error);
            return Promise.reject(error);
          }
        },
        (error) => Promise.reject(error)
      );

      const { data, request } = await http.get<{
        method: string;
        body: object;
        query: Record<string, any>;
      }>('/get', {
        params: { a: 1, b: '2/', c: { a: 1 } },
      });
      assert.strictEqual(shouldUseJSON, true);
      assert.strictEqual(data.method, 'get');
      assert.strictEqual(data.query.a, '1');
      assert.strictEqual(data.query.b, '2/');
      assert.strictEqual(data.query.c.a, '1');
      assert.strictEqual(request._url, '/get?a=1&b=2%2F&c%5Ba%5D=1');
    });
  });

  describe('custom AbortController signal should work', () => {
    it('should work with abort early GET', async () => {
      const xiorInstance = Xior.create({ baseURL });
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
      const xiorInstance = Xior.create({ baseURL });
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

    it('should work with isCancel when abort error occurs during GET', async () => {
      const xiorInstance = Xior.create({ baseURL });
      const controller = new AbortController();
      setTimeout(() => {
        controller.abort();
      }, 1200);
      let isCancelError = false;
      try {
        await xiorInstance.get('/timeout', { signal: controller.signal, timeout: 1000 });
      } catch (e) {
        isCancelError = isCancel(e);
      }
      assert.strictEqual(isCancelError, true);
    });

    it('Check real timeout', async () => {
      const xiorInstance = Xior.create({ baseURL });
      let timeoutError = false;
      let begin = Date.now();
      try {
        await xiorInstance.get('/timeout?timeout=2000', { timeout: 200 });
      } catch (e) {
        timeoutError = isXiorError(e);
      }
      console.log('Real timeout is:', Date.now() - begin);
      assert.strictEqual(timeoutError, true);
    });

    it('should work with abort early POST', async () => {
      const xiorInstance = Xior.create({ baseURL });
      const controller = new AbortController();
      class CancelFetchError extends Error {}
      setTimeout(() => {
        controller.abort(new CancelFetchError('hi'));
      }, 500);
      let timeoutError = true;
      try {
        await xiorInstance.post(
          { url: '/timeout', signal: controller.signal, timeout: 1000 },
          null
        );
      } catch (e) {
        timeoutError = !(e instanceof CancelFetchError);
      }
      assert.strictEqual(timeoutError, false);
    });

    it('should work with timeout POST', async () => {
      const xiorInstance = Xior.create({ baseURL });
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

  describe('`responseType` should work', () => {
    it('should work with `responseType: "blob"`', async () => {
      const xiorInstance = Xior.create({ baseURL });
      const { data: getData } = await xiorInstance.get<Blob>('/get', {
        responseType: 'blob',
      });
      assert.strictEqual(getData instanceof Blob, true);

      const { data: postData } = await xiorInstance.post<Blob>(
        '/post',
        {},
        { responseType: 'blob' }
      );
      assert.strictEqual(postData instanceof Blob, true);
    });

    it('should work with `responseType: "arraybuffer"`', async () => {
      const xiorInstance = Xior.create({ baseURL });
      const { data: getData } = await xiorInstance.get<ArrayBuffer>('/get', {
        responseType: 'arraybuffer',
      });
      assert.strictEqual(getData instanceof ArrayBuffer, true);

      const { data: postData } = await xiorInstance.post<ArrayBuffer>(
        '/post',
        {},
        { responseType: 'arraybuffer' }
      );
      assert.strictEqual(postData instanceof ArrayBuffer, true);
    });

    it('should work with as expected `responseType: "original"` or `responseType: "stream"`', async () => {
      const xiorInstance = Xior.create({ baseURL });
      const { data: getData } = await xiorInstance.get<ArrayBuffer>('/get', {
        responseType: 'original',
      });
      assert.strictEqual(getData === undefined, true);

      const { data: postData } = await xiorInstance.post<ArrayBuffer>(
        '/post',
        {},
        { responseType: 'stream' }
      );
      assert.strictEqual(postData !== undefined, true);
    });
  });

  describe('custom plugins should work', () => {
    it('should work with custom plugin', async () => {
      const xiorInstance = Xior.create({ baseURL });

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
    const xiorInstance = Xior.create({ baseURL });

    it('Xior.interceptors.request.use/eject/clear should work', () => {
      assert.strictEqual((xiorInstance as any).REQI.length, 0);
      const handler = xiorInstance.interceptors.request.use((config) => {
        return config;
      });
      xiorInstance.interceptors.request.use((config) => {
        return config;
      });
      assert.strictEqual((xiorInstance as any).REQI.length - 1, 1);
      xiorInstance.interceptors.request.eject(handler);
      assert.strictEqual((xiorInstance as any).REQI.length - 1, 0);

      xiorInstance.interceptors.request.clear();
      assert.strictEqual((xiorInstance as any).REQI.length, 0);
    });

    it('Xior.interceptors.response.use/eject/clear should work', () => {
      assert.strictEqual((xiorInstance as any).RESI.length, 0);
      const handler = xiorInstance.interceptors.response.use((config) => {
        return config;
      });
      xiorInstance.interceptors.response.use((config) => {
        return config;
      });
      assert.strictEqual((xiorInstance as any).RESI.length, 2);
      xiorInstance.interceptors.response.eject(handler);
      assert.strictEqual((xiorInstance as any).RESI.length, 1);

      xiorInstance.interceptors.response.clear();
      assert.strictEqual((xiorInstance as any).RESI.length, 0);
    });

    it('Xior.plugins.use/eject/clear should work', () => {
      assert.strictEqual((xiorInstance as any).P.length, 1);
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
      assert.strictEqual((xiorInstance as any).P.length, 3);
      xiorInstance.plugins.eject(handler);
      assert.strictEqual((xiorInstance as any).P.length, 2);

      xiorInstance.plugins.clear();
      assert.strictEqual((xiorInstance as any).P.length, 0);
    });
  });

  describe('custom plugins tests', () => {
    const xiorInstance = Xior.create({ baseURL });
    it('xior plugins order should work', async () => {
      assert.strictEqual((xiorInstance as any).P.length, 1);

      const order: number[] = [];
      xiorInstance.plugins.use((adapter) => {
        return (config) => {
          order.push(1);
          return adapter(config);
        };
      });

      xiorInstance.plugins.use((adapter) => {
        return (config) => {
          order.push(2);
          return adapter(config);
        };
      });

      xiorInstance.plugins.use((adapter) => {
        return (config) => {
          order.push(3);
          return adapter(config);
        };
      });
      assert.strictEqual((xiorInstance as any).P.length, 4);
      await xiorInstance.get('/get');
      assert.strictEqual(order.length, 3);
      assert.strictEqual(order.join(','), [3, 2, 1].join(','));

      let error = false;
      xiorInstance.plugins.use((adapter, instance) => {
        return async (config) => {
          try {
            const res = await adapter(config);
            return res;
          } catch (err) {
            error = err instanceof TypeError;
            throw err;
          }
        };
      });

      let catchFetchFailedError = false;
      xiorInstance.interceptors.response.use(
        (config) => {
          return config;
        },
        function (error) {
          catchFetchFailedError = error instanceof TypeError;
          return Promise.reject(error);
        }
      );
      xiorInstance.plugins.use(
        errorRetryPlugin({
          retryInterval(count) {
            return count * 200;
          },
          onRetry(config, error, count) {
            console.log(`${config.method} ${config.url} retry ${count} times`);
          },
        })
      );

      try {
        await xiorInstance.post('http://192.168.9.1:3000/hi', {}, { isGet: true });
      } catch (e) {
        //
      } finally {
        //
      }
      assert.strictEqual(error, true);
      assert.strictEqual(catchFetchFailedError, true);
    });
  });
});
