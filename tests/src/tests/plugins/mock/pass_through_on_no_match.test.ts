import assert from 'node:assert';
import { describe, it, beforeEach, afterEach, after, before } from 'node:test';
import xior, { xior as XiorInstance } from 'xior';
import MockPlugin from 'xior/plugins/mock';

import { startServer } from '../../server';

let close: Function;
const port = 7885;
const baseURL = `http://localhost:${port}`;
before(async () => {
  close = await startServer(port);
});

after(async () => {
  return close(1);
});

let instance: XiorInstance;
let mock: MockPlugin;

beforeEach(function () {
  xior.defaults.baseURL = baseURL;
  instance = xior;
  mock = new MockPlugin(instance, { onNoMatch: 'passthrough' });
});

afterEach(function () {
  mock.restore();
});

describe('xior mock plguin default instance tests', () => {
  it('works correctly if set no handlers', async function () {
    await Promise.all([
      instance.get('/get').then(function (response) {
        assert.equal(response.status, 200);
        assert.equal(response.data.method, 'get');
      }),
    ]);
  });

  it('allows selective mocking', async function () {
    mock.onGet('/foo').reply(200, 'bar');
    mock.onGet('/error').reply(200, 'success');
    mock.onGet('/bar').passThrough();

    await Promise.all([
      instance.get('/foo').then(function (response) {
        assert.equal(response.status, 200);
        assert.equal(response.data, 'bar');
        return response;
      }),
      instance.get('/error').then(function (response) {
        assert.equal(response.status, 200);
        assert.equal(response.data, 'success');
      }),
      instance.get('/get').then(function (response) {
        assert.equal(response.status, 200);
        assert.equal(response.data.method, 'get');
      }),
      instance.post('/post').then(function (response) {
        assert.equal(response.status, 200);
        assert.equal(response.data.method, 'post');
      }),
    ]);
  });

  it('handles errors correctly', async function () {
    let error: any;
    await instance
      .get('/500')
      .then(function () {
        // The server should've returned an error
        assert.equal(true, false);
      })
      .catch(function (err) {
        error = err;
      });
    assert.equal(error.response.status, 500);
  });

  it("setting passThrough handler don't break anything", async function () {
    mock.onGet('/foo').reply(200, 'bar').onAny().passThrough();

    await Promise.all([
      instance.get('/foo').then(function (response) {
        assert.equal(response.status, 200);
        assert.equal(response.data, 'bar');
      }),
      instance.get('/get').then(function (response) {
        assert.equal(response.status, 200);
        assert.equal(response.data.method, 'get');
      }),
      instance.post('/post').then(function (response) {
        assert.equal(response.status, 200);
        assert.equal(response.data.method, 'post');
      }),
    ]);
  });

  it('applies interceptors should be once', function () {
    mock.onGet('/get').passThrough();
    let requestCount = 0;
    let responseCount = 0;
    instance.interceptors.request.use(function (config) {
      requestCount++;
      return config;
    });

    instance.interceptors.response.use(function (config) {
      responseCount++;
      return config;
    });

    return instance.get('/get').then(function () {
      assert.equal(requestCount, 1);
      assert.equal(responseCount, 1);
    });
  });
});
