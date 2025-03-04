import assert from 'node:assert';
import { readFile } from 'node:fs/promises';
import { before, after, describe, it } from 'node:test';
import { stringify } from 'qs';
import { fetch, FormData as FormData_, Agent, type RequestInit as RequestInit_ } from 'undici';
import xior, { merge } from 'xior';

import { startServer } from './server';

declare global {
  interface RequestInit extends RequestInit_ {}
}

let close: Function;
const port = 7874;
const baseURL = `http://localhost:${port}`;
before(async () => {
  close = await startServer(port);
});

after(async () => {
  return close(1);
});

describe("xior with undici's fetch tests", () => {
  describe('should work with methods GET/POST/PUT/PATCH/DELETE/HEAD/OPTIONS', () => {
    const xiorInstance = xior.create({ baseURL, fetch });

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
      assert.strictEqual(data.body.c, 3);
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
    const xiorInstance = xior.create({ baseURL, fetch });

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
        fetch,
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

  describe('`xior.interceptors` tests', () => {
    it('`xior.interceptors.request.use` should work', async () => {
      const xiorInstance = xior.create({ baseURL, fetch });
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
        fetch,
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
        fetch,
      });
      assert.strictEqual(xiorInstance.config?.baseURL, baseURL);
      const { request } = await xiorInstance.get('/', { baseURL: baseURL + '/get' });
      assert.notEqual(request.baseURL, baseURL);
      assert.strictEqual(xiorInstance.config?.baseURL, baseURL);
    });

    it('headers', async () => {
      const xiorInstance = xior.create({
        baseURL,
        fetch,
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
        fetch,
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
  });

  describe('form data', () => {
    it('post FormData data should work', async () => {
      const formData = new FormData_();
      formData.append('field1', 'val1');
      formData.append('field2', 'val2');

      const xiorInstance = xior.create({ baseURL, fetch });
      const { data } = await xiorInstance.post<{
        file: any;
        body: Record<string, string>;
        headers: Record<string, string>;
      }>('/form-data?from=undici-fetch', formData);
      assert.strictEqual(data.headers['content-type'].startsWith('multipart/form-data;'), true);
      assert.strictEqual(data.body.field1, 'val1');
      assert.strictEqual(data.body.field2, 'val2');
      assert.strictEqual(data.file, undefined);
    });

    it('upload `sample.txt` file should work', async () => {
      const fileName = './src/tests/upload/sample.txt';
      const formData = new FormData_();
      const blob = new Blob([await readFile(fileName)]);
      formData.append('field1', 'val1');
      formData.append('field2', 'val2');
      formData.append('file', blob, fileName);

      const xiorInstance = xior.create({ baseURL, fetch });
      const { data } = await xiorInstance.post<{ file: any; body: Record<string, string> }>(
        '/upload?from=undici-fetch',
        formData
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

  describe('proxy agents tests', () => {
    const agent = new Agent({
      connections: 10,
    });
    after(() => {
      agent.close();
    });
    it("should work with undici's Agent", async () => {
      const formData = new FormData_();
      formData.append('field1', 'val1');
      formData.append('field2', 'val2');

      const xiorInstance = xior.create({
        baseURL,
        fetch,
        dispatcher: agent,
      });

      const { data } = await xiorInstance.post<{
        file: any;
        body: Record<string, string>;
        headers: Record<string, string>;
      }>('/form-data?from=undici-fetch', formData);
      assert.strictEqual(data.headers['content-type'].startsWith('multipart/form-data;'), true);
      assert.strictEqual(data.body.field1, 'val1');
      assert.strictEqual(data.body.field2, 'val2');
      assert.strictEqual(data.file, undefined);
    });
  });
});
