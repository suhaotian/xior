import assert from 'node:assert';
import { describe, it, beforeEach, afterEach, after, before } from 'node:test';
import xior, { Xior as XiorInstance } from 'xior';
import MockPlugin from 'xior/plugins/mock';

import { startServer } from '../../server';

let close: Function;
const port = 7886;
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
  instance = xior.create({ baseURL: baseURL + '/' });
  mock = new MockPlugin(instance);
});

afterEach(function () {
  mock.restore();
});

describe('xior mock plguin trailing slash with baseUrl issue tests', () => {
  it('xior should handle trailing slash in baseUrl', async function () {
    // passes
    mock.onAny().passThrough();
    await Promise.all([
      instance.get('/get').then((response) => {
        assert.equal(response.status, 200);
        assert.equal(response.data.method, 'get');
      }),
      instance.post('post').then(function (response) {
        assert.equal(response.status, 200);
        assert.equal(response.data.method, 'post');
      }),
    ]);
  });

  it('mock adapter should handle trailing slash in baseUrl', async function () {
    // both fail: 404
    mock.onGet('/foo').reply(200, 'bar');
    await Promise.all([
      instance.get('/foo').then(function (response) {
        assert.equal(response.status, 200);
        assert.equal(response.data, 'bar');
      }),
      instance.get('foo').then(function (response) {
        assert.equal(response.status, 200);
        assert.equal(response.data, 'bar');
      }),
    ]);
  });
});
