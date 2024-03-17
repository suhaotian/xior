import assert from 'node:assert';
import { describe, it, beforeEach, afterEach } from 'node:test';

import xior, { xior as XiorInstance } from '../../../index';
import MockPlugin from '../../../plugins/mock';

let instance: XiorInstance;
let mock: MockPlugin;

beforeEach(function () {
  instance = xior;
  mock = new MockPlugin(instance);
});

afterEach(function () {
  mock.restore();
});

describe('xior mock plguin reply with Promise tests', () => {
  it('allows resolving with Promise', function () {
    mock.onGet('/promise').reply(function () {
      return new Promise(function (resolve, reject) {
        resolve([200, { bar: 'fooPromised' }]);
      });
    });

    return instance.get('/promise').then(function (response) {
      assert.equal(response.status, 200);
      assert.equal(response.data.bar, 'fooPromised');
    });
  });

  it('rejects after Promise resolves to error response', async function () {
    mock.onGet('/bad/promise').reply(function () {
      return new Promise(function (resolve) {
        resolve([400, { bad: 'request' }]);
      });
    });

    let error: any;
    await instance.get('/bad/promise').catch(function (err) {
      error = err;
    });
    assert.equal(error.response.status, 400);
    assert.equal(error.response.data.bad, 'request');
  });

  it('passes rejecting Promise verbatim', async function () {
    mock.onGet('/reject').reply(function () {
      return new Promise(function (resolve, reject) {
        reject({ custom: 'error' });
      });
    });
    let error: any;
    await instance.get('/reject').catch(function (err) {
      error = err;
    });
    assert.equal(error.custom, 'error');
  });
});
