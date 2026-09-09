import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { Xior } from 'xior';
import xiorAuthPlugin from 'xior/plugins/http-auth';

import { startServer } from '../server';

let close: Function;
const port = 7890;
const baseURL = `http://localhost:${port}`;

before(async () => {
  close = await startServer(port);
});

after(async () => {
  return close(1);
});

describe('xior auth plugin tests', () => {
  it('should authenticate with instance auth', async () => {
    const instance = Xior.create({
      baseURL,
      auth: {
        username: 'admin',
        password: '123456',
      },
    });

    instance.plugins.use(xiorAuthPlugin);

    const { data, status } = await instance.get('/basic-auth');

    assert.strictEqual(status, 200);
    assert.deepStrictEqual(data, {
      message: 'Authorized',
    });
  });

  it('should authenticate with special characters', async () => {
    const instance = Xior.create({
      baseURL,
      auth: {
        username: 'user@example.com',
        password: 'p@ss:word',
      },
    });

    instance.plugins.use(xiorAuthPlugin);

    const { data, status } = await instance.get('/basic-auth');

    assert.strictEqual(status, 200);
    assert.deepStrictEqual(data, {
      message: 'Authorized',
    });
  });

  it('should override an existing authorization header', async () => {
    const instance = Xior.create({
      baseURL,
      auth: {
        username: 'admin',
        password: '123456',
      },
    });

    instance.plugins.use(xiorAuthPlugin);

    const { data, status } = await instance.get('/basic-auth', {
      headers: {
        Authorization: 'Bearer invalid-token',
      },
    });

    assert.strictEqual(status, 200);
    assert.deepStrictEqual(data, {
      message: 'Authorized',
    });
  });

  it('should authenticate with per-request auth', async () => {
    const instance = Xior.create({
      baseURL,
    });

    instance.plugins.use(xiorAuthPlugin);

    const { data, status } = await instance.get('/basic-auth', {
      auth: {
        username: 'admin',
        password: '123456',
      },
    });

    assert.strictEqual(status, 200);
    assert.deepStrictEqual(data, {
      message: 'Authorized',
    });
  });

  it('should reject requests without auth', async () => {
    const instance = Xior.create({
      baseURL,
    });

    instance.plugins.use(xiorAuthPlugin);

    await assert.rejects(instance.get('/basic-auth'), (error: any) => {
      assert.strictEqual(error.response.status, 401);
      assert.strictEqual(error.response.data, 'Unauthorized');

      return true;
    });
  });

  it('should reject invalid credentials', async () => {
    const instance = Xior.create({
      baseURL,
      auth: {
        username: 'admin',
        password: 'wrong-password',
      },
    });

    instance.plugins.use(xiorAuthPlugin);

    await assert.rejects(instance.get('/basic-auth'), (error: any) => {
      assert.strictEqual(error.response.status, 401);
      assert.strictEqual(error.response.data, 'Unauthorized');

      return true;
    });
  });
});
