import assert from 'node:assert';
import { describe, it, beforeEach, afterEach } from 'node:test';
import xior, { XiorError, xior as XiorInstance, XiorResponse, isXiorError } from 'xior';
import MockPlugin from 'xior/plugins/mock';

let instance: XiorInstance;
let mock: MockPlugin;

beforeEach(function () {
  instance = xior;
  mock = new MockPlugin(instance);
});

afterEach(function () {
  mock.restore();
});

describe('xior mock plguin timeout tests', () => {
  it('mocks timeout response', async function () {
    mock.onGet('/foo').timeout();

    let error: any;
    await instance.get('/foo').catch(function (err) {
      error = err;
    });
    assert.equal(typeof error.config !== 'undefined', true);
    assert.equal(error.message, 'timeout of 0ms exceeded');
    assert.equal(isXiorError(error), true);
  });

  it('can timeout only once', function () {
    mock.onGet('/foo').timeoutOnce().onGet('/foo').reply(200);

    return instance
      .get('/foo')
      .then(
        function () {},
        function () {
          return instance.get('/foo');
        }
      )
      .then(function (response) {
        assert.equal((response as XiorResponse).status, 200);
      });
  });
});
