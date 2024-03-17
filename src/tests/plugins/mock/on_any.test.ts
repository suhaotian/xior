import assert from 'node:assert';
import { describe, it, beforeEach, afterEach } from 'node:test';

import xior, { XiorError, xior as XiorInstance, XiorResponse } from '../../../index';
import MockPlugin from '../../../plugins/mock';

let instance: XiorInstance;
let mock: MockPlugin;

beforeEach(function () {
  instance = xior;
  mock = new MockPlugin(instance, { delayResponse: 100 });
});

afterEach(function () {
  mock.restore();
});

describe('xior mock plguin onAny tests', () => {
  it('registers a handler for every HTTP method', function () {
    mock.onAny('/foo').reply(200);

    assert.equal(mock.handlers['get']?.length, 1);
    assert.equal(mock.handlers['post']?.length, 1);
    assert.equal(mock.handlers['head']?.length, 1);
    assert.equal(mock.handlers['delete']?.length, 1);
    assert.equal(mock.handlers['patch']?.length, 1);
    assert.equal(mock.handlers['put']?.length, 1);
    assert.equal(mock.handlers['options']?.length, 1);
  });

  it('mocks any request with a matching url', function () {
    mock.onAny('/foo').reply(200);

    return instance
      .head('/foo')
      .then(function () {
        return instance.patch('/foo');
      })
      .then(function (response) {
        assert.equal(response.status, 200);
      });
  });

  it('mocks any request with a matching url and data', function () {
    const body = [{ object: { with: { deep: 'property' } }, array: ['1', 'abc'] }, 'a'];
    mock.onAny('/anyWithBody', { data: body }).reply(200);

    return instance
      .put('/anyWithBody', body)
      .then(function () {
        return instance.post('/anyWithBody', body);
      })
      .then(function (response) {
        assert.equal(response.status, 200);
      });
  });

  it('removes all handlers after replying with replyOnce', function () {
    mock.onAny('/foo').replyOnce(200);

    return instance.get('/foo').then(function () {
      assert.equal(mock.handlers['get']?.length, 0);
      assert.equal(mock.handlers['post']?.length, 0);
    });
  });
});
