import assert from 'node:assert';
import { after, before, describe, it, beforeEach, afterEach } from 'node:test';

import MockPlugin from '../../../plugins/mock';
import { XiorTimeoutError, delay } from '../../../utils';
import { xior } from '../../../xior';
import { startServer } from '../../server';

let close: Function;
const port = 7884;
const baseURL = `http://localhost:${port}`;
before(async () => {
  close = await startServer(port);
});

after(async () => {
  return close(1);
});

let instance: xior;
let mock: MockPlugin;

beforeEach(function () {
  instance = xior.create({ baseURL });
  mock = new MockPlugin(instance, { delayResponse: 100 });
});

afterEach(function () {
  mock.restore();
});

describe('xior mock plguin cancel tests', () => {
  it('handles canceled requests', async function () {
    const controller = new AbortController();
    mock.onGet('/foo').reply(200);
    let error: any;
    instance
      .get('/foo', { signal: controller.signal })
      .then(() => {
        assert.equal(true, false);
      })
      .catch((err) => {
        error = err;
      });
    controller.abort(new Error('Operation canceled'));
    await delay(200);
    assert.equal(error.message, 'Operation canceled');
  });

  it('handles timeout canceled requests', async function () {
    mock.restore();
    mock = new MockPlugin(instance, { delayResponse: 1000 });
    const controller = new AbortController();
    mock.onGet('/foo').reply(200);
    let error: any;
    await instance
      .get('/foo', { signal: controller.signal, timeout: 200 })
      .then(() => {
        assert.equal(true, false);
      })
      .catch((err) => {
        error = err;
      });
    assert.equal(error instanceof XiorTimeoutError, true);
  });

  it('works as normal if request is not canceled', async function () {
    const controller = new AbortController();
    mock.onGet('/foo').reply(200);
    let error: any;
    await instance
      .get('/foo', { signal: controller.signal })
      .then((response) => {
        assert.equal(response.status, 200);
      })
      .catch((err) => {
        error = err;
      });
    assert.equal(error, undefined);
  });
});
