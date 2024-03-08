import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';

import MockPlugin from '../../plugins/mock';
import { xior } from '../../xior';
import { startServer } from '../server';

let close: Function;
const port = 7879;
const baseURL = `http://localhost:${port}`;
before(async () => {
  close = await startServer(port);
});

after(async () => {
  return close(1);
});

describe('xior error retry plguins tests', () => {
  const instance = xior.create({ baseURL });
  const mock = new MockPlugin(instance, { delayResponse: 1000, onNoMatch: 'throwException' });

  it("should work with `onGet('/reset-error')`", async () => {
    assert.strictEqual(mock.history['get'], undefined);
    mock.onGet('/reset-error').reply(200, { msg: 'ok' }, { 'custom-header-field': 233 });
    const { status, data, headers } = await instance.get('/reset-error');
    assert.strictEqual((mock.history['get'] as any[]).length, 1);
    assert.strictEqual(status, 200);
    assert.strictEqual(data.msg, 'ok');
    assert.strictEqual(headers.get('custom-header-field'), '233');
  });

  it('should work with `onGet()`', async () => {
    mock.reset();
    assert.strictEqual(mock.history['get'], undefined);
    mock.onGet().reply(200, { msg: 'ok' }, { 'custom-header-field': 233 });
    const { status, data, headers } = await instance.get('/reset-error');
    assert.strictEqual((mock.history['get'] as any[]).length, 1);
    assert.strictEqual(status, 200);
    assert.strictEqual(data.msg, 'ok');
    assert.strictEqual(headers.get('custom-header-field'), '233');
  });
});
