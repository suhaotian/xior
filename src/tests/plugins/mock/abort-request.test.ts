import assert from 'node:assert';
import { after, before, describe, it, beforeEach, afterEach } from 'node:test';

import MockPlugin from '../../../plugins/mock';
import { XiorError } from '../../../utils';
import { xior } from '../../../xior';
import { startServer } from '../../server';

let close: Function;
const port = 7880;
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
  mock = new MockPlugin(instance);
});

afterEach(function () {
  mock.restore();
});

describe('xior mock plguin abort request tests', () => {
  it('mocks requestAborted response', async () => {
    mock.onGet('/foo').abortRequest();

    let error: Error | undefined;
    await instance.get('/foo').catch((e) => {
      error = e;
    });
    assert.equal(error instanceof XiorError, true);
    assert.equal(error?.message, `Request aborted`);
  });

  it('can abort a request only once', async () => {
    mock.onGet('/foo').abortRequestOnce().onGet('/foo').reply(200);
    let hasError = false;
    try {
      await instance.get('/foo');
    } catch (e) {
      hasError = true;
      const res = await instance.get('/foo');
      assert.equal(res.status, 200);
    }
    assert.equal(hasError, true);
  });
});
