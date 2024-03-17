import assert from 'node:assert';
import { describe, it, beforeEach, afterEach } from 'node:test';

import MockPlugin from '../../../plugins/mock';
import { XiorTimeoutError, delay } from '../../../utils';
import { xior } from '../../../xior';

let instance: xior;
let mock: MockPlugin;

beforeEach(function () {
  instance = xior.create({});
  mock = new MockPlugin(instance, { delayResponse: 100 });
});

afterEach(function () {
  mock.restore();
});

describe('xior mock plguin history tests', () => {
  it('initializes empty history for each http method', function () {
    assert.equal(mock.history['get'], undefined);
    assert.equal(mock.history['post'], undefined);
    assert.equal(mock.history['put'], undefined);
  });

  it('records the xior config each time the handler is invoked', function () {
    mock.onAny('/foo').reply(200);

    return instance.get('/foo').then(function (response) {
      assert.equal(mock.history.get?.length, 1);
      assert.equal(mock.history.get?.[0].method, 'GET');
      assert.equal(mock.history.get?.[0].url, '/foo');
    });
  });

  it('reset history should reset all history', function () {
    mock.onAny('/foo').reply(200);

    return instance.get('/foo').then(function (response) {
      mock.resetHistory();
      assert.equal(mock.history['get'], undefined);
    });
  });
});
