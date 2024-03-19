import assert from 'node:assert';
import { describe, it, beforeEach, afterEach } from 'node:test';
import xior, { xior as XiorInstance } from 'xior';
import MockPlugin from 'xior/plugins/mock';

let instance: XiorInstance;
let mock: MockPlugin;

beforeEach(function () {
  instance = xior;
  mock = new MockPlugin(instance, { onNoMatch: 'throwException' });
});

afterEach(function () {
  mock.restore();
});

describe('xior mock plguin onNoMatch=throwException option tests', () => {
  it('allows selective mocking', async function () {
    mock.onGet('/foo').reply(200, 'bar');
    mock.onGet('/error').reply(200, 'success');

    await Promise.all([
      instance.get('/foo').then(function (response) {
        assert.equal(response.status, 200);
        assert.equal(response.data, 'bar');
      }),
      instance.get('/error').then(function (response) {
        assert.equal(response.status, 200);
        assert.equal(response.data, 'success');
      }),
    ]);
  });

  it('handles errors correctly when could not find mock for requested url', async function () {
    const expectedUrl = 'http://127.0.0.1/unexistent_path';
    const expectedMethod = 'get';
    let error: any;
    await instance.get(expectedUrl).catch(function (err) {
      error = err;
    });

    assert.equal(error.message.indexOf('Could not find mock for') > -1, true);
    assert.equal(error.message.indexOf(expectedMethod.toUpperCase()) > -1, true);
    assert.equal(error.message.indexOf(expectedUrl) > -1, true);
  });
});
