import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { xior } from 'xior';
import MockPlugin from 'xior/plugins/mock';

import { startServer } from '../../server';

let close: Function;
const port = 7879;
const baseURL = `http://localhost:${port}`;
before(async () => {
  close = await startServer(port);
});

after(async () => {
  return close(1);
});

describe('xior mock plugin tests', () => {
  const instance = xior.create({ baseURL });
  const mock = new MockPlugin(instance, { delayResponse: 1000, onNoMatch: 'throwException' });

  it("should work with `onGet('/reset-error')`", async () => {
    assert.strictEqual(mock.history['get'], undefined);
    mock.onGet('/reset-error').reply(200, { msg: 'ok' }, { 'custom-header-field': 233 });
    const { status, data, headers } = await instance.get('/reset-error');
    assert.strictEqual((mock.history['get'] || []).length, 1);
    assert.strictEqual(status, 200);
    assert.strictEqual(data.msg, 'ok');
    assert.strictEqual(headers.get('custom-header-field'), '233');
  });

  it('should work with `onGet()`', async () => {
    mock.reset();
    assert.strictEqual(mock.history['get'], undefined);
    mock.onGet().reply(200, { msg: 'ok' }, { 'custom-header-field': 233 });
    const { status, data, headers } = await instance.get('/reset-error');
    const a = mock.history['get'] || [];
    assert.strictEqual(a?.length, 1);
    assert.strictEqual(status, 200);
    assert.strictEqual(data.msg, 'ok');
    assert.strictEqual(headers.get('custom-header-field'), '233');
  });

  it("should work with `onGet('/users')`", async () => {
    mock.reset();
    // Mock any GET request to /users
    // arguments for reply are (status, options, headers)
    mock.onGet('/users').reply(
      200,
      {
        users: [{ id: 1, name: 'John Smith' }],
      },
      { 'x-custom-header': 123 }
    );
    const { data, status, headers } = await instance.get('/users');
    assert.strictEqual(data.users.length, 1);
    assert.strictEqual(status, 200);
    assert.strictEqual(data.users[0].id, 1);
    assert.strictEqual(data.users[0].name, 'John Smith');
    assert.strictEqual(headers.get('x-custom-header'), '123');
  });

  it("should work with `onGet('/users', {params: { searchText: 'John' }})`", async () => {
    mock.onGet('/users', { params: { searchText: 'John' } }).reply(200, {
      users: [{ id: 1, name: 'John Smith' }],
    });
    assert.strictEqual(mock.handlers['get']?.length, 2);
    const { data, status } = await instance.get('/users', { params: { searchText: 'John' } });
    assert.strictEqual(mock.history['get']?.length, 2);
    assert.strictEqual(data.users.length, 1);
    assert.strictEqual(status, 200);
    assert.strictEqual(data.users[0].id, 1);
    assert.strictEqual(data.users[0].name, 'John Smith');
  });

  it('should work with `passThrough()`', async () => {
    mock.reset();
    mock.onGet('/users2', { params: { searchText: 'John' } }).passThrough();
    let hasError = false;
    try {
      await instance.get('/users2', { params: { searchText: 'John' } });
    } catch (e) {
      console.log((e as Error).message);
      hasError = true;
    }
    assert.strictEqual(hasError, true);
  });

  it('should work with `reset()`', () => {
    mock.reset();
    assert.strictEqual(Object.keys(mock.history).length, 0);
    assert.strictEqual(Object.keys(mock.handlers).length, 0);
  });
  it('should work with `restore()`', async () => {
    assert.strictEqual((instance as any).P.length, 1);
    mock.restore();
    assert.strictEqual((instance as any).P.length, 0);
    let hasError = false;
    try {
      await instance.get('/users', { params: { searchText: 'John' } });
    } catch (e) {
      console.log((e as Error).message);
      hasError = true;
    }
    assert.strictEqual(hasError, true);
  });
});
