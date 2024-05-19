import assert from 'node:assert';
import { describe, it, beforeEach, afterEach } from 'node:test';
import xior, { Xior as XiorInstance } from 'xior';
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

describe('xior mock plguin default instance tests', () => {
  it('mocks requests on the default instance', function () {
    mock.onGet('/foo').reply(200);

    return xior.get('/foo').then(function (response) {
      assert.equal(response.status, 200);
    });
  });
});
