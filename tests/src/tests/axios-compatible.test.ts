import axios from 'axios';
import assert from 'node:assert';
import { before, after, describe, it } from 'node:test';
import xior, { XiorInstance, XiorError, XiorTimeoutError, encodeParams, isXiorError } from 'xior';

import { startServer } from './server';

let close: Function;
const port = 7865;
const baseURL = `http://localhost:${port}`;
before(async () => {
  close = await startServer(port);
});

after(async () => {
  return close(1);
});

describe('axios compatible tests', () => {
  it('should work with axios.get/axios.post', async () => {
    const res = await axios.get('/get', { baseURL });
    const xiorRes = await xior.get('/get', { baseURL });
    assert.strictEqual(res.data.method, xiorRes.data.method);

    const res1 = await axios.post('/post', null, { baseURL });
    const xiorRes1 = await xior.post('/post', null, { baseURL });
    assert.strictEqual(res1.data.method, xiorRes1.data.method);

    const { data } = await xior.post(
      '/post',
      {
        firstName: 'Fred',
        lastName: 'Flintstone',
      },
      { baseURL }
    );
    assert.strictEqual(data.body.firstName, 'Fred');
    assert.strictEqual(data.body.lastName, 'Flintstone');

    const { data: axiosData } = await axios.post(
      '/post',
      {
        firstName: 'Fred',
        lastName: 'Flintstone',
      },
      { baseURL }
    );
    assert.strictEqual(axiosData.body.firstName, 'Fred');
    assert.strictEqual(axiosData.body.lastName, 'Flintstone');
  });

  it('should work with axios.create', async () => {
    const axiosInstance = axios.create({
      withCredentials: true,
      paramsSerializer(data) {
        return JSON.stringify(data);
      },
    });
    const xiorInstance: XiorInstance = xior.create({
      withCredentials: true,
      paramsSerializer(data) {
        return JSON.stringify(data);
      },
    });
    const { data } = await axiosInstance.get<string>('https://github.com');
    const { data: axiorData } = await xiorInstance.get<string>('https://github.com');
    assert.strictEqual(data.slice(0, 10), axiorData.slice(0, 10));
    assert.strictEqual(data.slice(-10), axiorData.slice(-10));
  });

  it('should work with axios request object', async () => {
    const axiosInstance = axios.create({});
    const xiorInstance = xior.create({});
    const { data } = await axiosInstance<string>({
      method: 'get',
      url: 'https://github.com',
    });
    const { data: axiorData } = await xiorInstance.request<string>({
      method: 'get',
      url: 'https://github.com',
    });
    assert.strictEqual(data.slice(0, 10), axiorData.slice(0, 10));
    assert.strictEqual(data.slice(-10), axiorData.slice(-10));
  });

  it('should work with baseURL', async () => {
    const axiosInstance = axios.create({ baseURL: 'https://github.com' });
    const xiorInstance = xior.create({ baseURL: 'https://github.com/' });
    const { data } = await axiosInstance.get<string>('/');
    const { data: axiorData } = await xiorInstance.get<string>('/');
    assert.strictEqual(data.slice(0, 10), axiorData?.slice(0, 10));
    assert.strictEqual(data.slice(-10), axiorData?.slice(-10));
  });

  it('should work with `instance.defaults.* = *`', async () => {
    const axiosInstance = axios.create({ baseURL });
    const xiorInstance = xior.create({ baseURL });
    axiosInstance.defaults.headers['x-custom-value'] = '1';
    xiorInstance.defaults.headers['x-custom-value'] = '1';
    if (!axiosInstance.defaults.params) {
      axiosInstance.defaults.params = {};
    }
    axiosInstance.defaults.params['x-2'] = '2';
    xiorInstance.defaults.params['x-2'] = '2';

    const { data } = await axiosInstance.get('/get');
    const { data: axiorData } = await xiorInstance.get('/get');
    assert.strictEqual(data.value, '1');
    assert.strictEqual(axiorData.value, '1');

    assert.strictEqual(data.query['x-2'], '2');
    assert.strictEqual(axiorData.query['x-2'], '2');
  });

  it('should work with params', async () => {
    const axiosInstance = axios.create({ baseURL: 'https://api.github.com' });
    const xiorInstance = xior.create({ baseURL: 'https://api.github.com/' });
    const { data } = await axiosInstance.get<any[]>('/orgs/tsdk-monorepo/repos', {
      data: { page: 1 },
      params: { page: 100 },
    });
    const { data: axiorData } = await xiorInstance.get<any[]>('/orgs/tsdk-monorepo/repos', {
      data: { page: 1 },
      params: { page: 100 },
    });
    assert.strictEqual(data.length, 0);
    assert.strictEqual(axiorData.length, 0);
  });
  it('should work with get/options/delete', async () => {
    const axiosInstance = axios.create({
      baseURL,
      timeout: 1000,
    });
    const xiorInstance = xior.create({
      baseURL,
      timeout: 1000,
    });
    for (const method of 'get/delete/options'.split('/')) {
      const { data: axiosData } = await axiosInstance[method as 'options']('/' + method, {
        params: { b: 2 },
      });
      const { data: xiorData } = await xiorInstance[method as 'options']('/' + method, {
        params: { b: 2 },
      });
      assert.strictEqual(
        xiorData.query?.b,
        axiosData.query?.b,
        `query ${method}: ${xiorData.query?.b} === ${axiosData.query?.b}`
      );
    }
  });
  it('should work with post/put/patch', async () => {
    const axiosInstance = axios.create({
      baseURL,
      timeout: 1000,
    });
    const xiorInstance = xior.create({
      baseURL,
      timeout: 1000,
    });
    for (const method of 'post/put/patch'.split('/')) {
      const { data: axiosData } = await axiosInstance[method as 'post'](
        '/' + method,
        { a: 1 },
        {
          params: { b: 2 },
        }
      );
      const { data: xiorData } = await xiorInstance[method as 'post'](
        '/' + method,
        { a: 1 },
        {
          params: { b: 2 },
        }
      );

      assert.strictEqual(
        xiorData.body?.a,
        axiosData.body?.a,
        `body ${method}: ${xiorData.body?.a} === ${axiosData.body?.a}`
      );
      assert.strictEqual(
        xiorData.query?.b,
        axiosData.query?.b,
        `query ${method}: ${xiorData.query?.b} === ${axiosData.query?.b}`
      );
    }
  });
  it('should work with timeout', async () => {
    const axiosInstance = axios.create({
      baseURL,
      timeout: 1000,
    });
    const xiorInstance = xior.create({
      baseURL,
      timeout: 1000,
    });
    let timeoutError = false;
    try {
      await axiosInstance.get('/timeout');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      timeoutError = true;
    }
    assert.strictEqual(timeoutError, true);

    let timeoutErrorXior = false;
    try {
      await xiorInstance.get('/timeout');
    } catch (e) {
      timeoutErrorXior = isXiorError(e);
    }
    assert.strictEqual(timeoutErrorXior, true);
  });
  it('should work with params GET', async () => {
    const axiosInstance = axios.create({
      baseURL,
    });
    const xiorInstance = xior.create({
      baseURL,
    });
    const { data, headers, status, statusText } = await axiosInstance.get('/params', {
      params: {
        headerName: 'custom-header-1',
        headerValue: '123456',
      },
    });
    assert.strictEqual(data, 'ok');
    assert.strictEqual(status, 200);
    assert.strictEqual(headers['custom-header-1'], '123456');

    const {
      data: axiorData,
      headers: axiorHeaders,
      status: axiorStatus,
      statusText: axiorStatusText,
    } = await xiorInstance.get('/params', {
      params: {
        headerName: 'custom-header-1',
        headerValue: '123456',
      },
      paramsSerializer: encodeParams,
    });
    assert.strictEqual(axiorData, 'ok');
    assert.strictEqual(axiorStatus, 200);
    assert.strictEqual(axiorStatusText, statusText);
    assert.strictEqual(axiorHeaders.get('custom-header-1'), '123456');
  });

  it('should work with params POST', async () => {
    const axiosInstance = axios.create({
      baseURL,
    });
    const xiorInstance = xior.create({
      baseURL,
    });
    const { data, headers, status, statusText } = await axiosInstance.post('/params', {
      headerName: 'custom-header-1',
      headerValue: '123456',
    });
    assert.strictEqual(data, 'ok');
    assert.strictEqual(status, 200);
    assert.strictEqual(headers['custom-header-1'], '123456');

    const {
      data: axiorData,
      headers: axiorHeaders,
      status: axiorStatus,
      statusText: axiorStatusText,
    } = await xiorInstance.post('/params', {
      headerName: 'custom-header-1',
      headerValue: '123456',
    });
    assert.strictEqual(axiorData, 'ok');
    assert.strictEqual(axiorStatus, 200);
    assert.strictEqual(axiorStatusText, statusText);
    assert.strictEqual(axiorHeaders.get('custom-header-1'), '123456');
  });

  it('should work with delete', async () => {
    const axiosInstance = axios.create({
      baseURL,
    });
    const xiorInstance = xior.create({
      baseURL,
    });
    await axiosInstance.delete('/delete', { params: {} });
    await xiorInstance.delete('/delete', { params: {} });

    assert.strictEqual(1, 1);
  });

  it('should work with axios.interceptors.request.use', async () => {
    const axiosInstance = axios.create({
      baseURL,
    });
    const xiorInstance = xior.create({
      baseURL,
    });
    axiosInstance.interceptors.request.use(
      (config) => {
        return config;
      },
      () => {
        //
      }
    );
    xiorInstance.interceptors.request.use(
      (config) => {
        return config;
      },
      () => {
        //
      }
    );
    await axiosInstance.get('/get');
    await xiorInstance.get('/get');

    assert.strictEqual(1, 1);
  });
  it('should work with axios.interceptors.response.use', async () => {
    const axiosInstance = axios.create({
      baseURL,
    });
    const xiorInstance = xior.create({
      baseURL,
    });
    axiosInstance.interceptors.response.use(
      (config) => {
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
    xiorInstance.interceptors.response.use(
      (config) => config,
      (error) => {
        return Promise.reject(error);
      }
    );
    const { data, config } = await axiosInstance.get('/get', { params: { a: 1, b: 2 } });
    const { data: xiorData, config: xiorConfig } = await xiorInstance.get('/get', {
      params: { a: 1, b: 2 },
    });
    assert.equal(config.url, xiorConfig.url);
    assert.equal(Object.keys(data).sort().join(','), Object.keys(xiorData).sort().join(','));
  });

  it('should work same with request object', async () => {
    const axiosInstance = axios.create({
      baseURL,
    });
    const xiorInstance = xior.create({
      baseURL,
    });
    const { data } = await axiosInstance('/get');
    const { data: xiorData } = await xiorInstance.request('/get');
    assert.strictEqual(JSON.stringify(data), JSON.stringify(xiorData));
  });

  it('should work same with request error', async () => {
    const axiosInstance = axios.create({
      baseURL,
    });
    const xiorInstance = xior.create({
      baseURL,
    });
    for (const status of [404, 401, 403, 500]) {
      let axiosError = '1';
      try {
        await axiosInstance.get('/' + status);
      } catch (e) {
        axiosError = (e as any).message;
      }
      let axiorError = '2';
      try {
        await xiorInstance.get('/' + status);
      } catch (e) {
        axiorError = (e as any).message;
      }
      assert.strictEqual(axiosError, axiorError);
    }
  });

  it('should work same when have error with `axios.interceptors.response.use`', async () => {
    const axiosInstance = axios.create({
      baseURL,
    });
    const xiorInstance = xior.create({
      baseURL,
    });
    let hasError = false;
    axiosInstance.interceptors.response.use(
      (config) => {
        return config;
      },
      () => {
        hasError = true;
      }
    );
    await axiosInstance.get('/400').catch(() => {
      //
    });
    assert.strictEqual(hasError, true);

    let xiorHasError = false;
    let xiorError: XiorError = new Error();
    xiorInstance.interceptors.response.use(
      (config) => config,
      async (e) => {
        xiorError = e;
        xiorHasError = true;
      }
    );
    await xiorInstance.get('/400').catch(() => {
      //
    });
    assert.strictEqual(xiorHasError, true);
    assert.strictEqual(xiorError.request?.url, '/400');
    assert.strictEqual(xiorError.response?.config.url, '/400');
  });
});
