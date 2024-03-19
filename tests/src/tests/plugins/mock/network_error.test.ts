import assert from 'node:assert';
import { describe, it, beforeEach, afterEach } from 'node:test';
import xior, { XiorError, xior as XiorInstance, XiorResponse, isXiorError } from 'xior';
import MockPlugin from 'xior/plugins/mock';

let instance: XiorInstance;
let mock: MockPlugin;

beforeEach(function () {
  instance = xior;
  mock = new MockPlugin(instance, { delayResponse: 100 });
});

afterEach(function () {
  mock.restore();
});

describe('xior mock plguin network error tests', () => {
  it('mocks networkErrors', async function () {
    mock.onGet('/foo').networkError();

    let error: any;
    await instance.get('/foo').then(
      function () {
        assert.equal(true, false, 'should not be called');
      },
      function (err) {
        error = err;
      }
    );
    assert.equal(typeof error.config !== 'undefined', true);
    assert.equal(typeof error.response !== 'undefined', true);
    assert.equal(error.message, 'Network Error');
    assert.equal(isXiorError(error), true);
  });

  it('can mock a network error only once', function () {
    mock.onGet('/foo').networkErrorOnce().onGet('/foo').reply(200);

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
