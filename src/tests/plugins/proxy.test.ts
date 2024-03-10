import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';

import xiorProxyPlugin from '../../plugins/proxy';
import { XiorRequestConfig } from '../../types';
import { xior } from '../../xior';
import { startServer } from '../server';

let close: Function;
const port = 7980;
const baseURL = `http://localhost:${port}`;
before(async () => {
  close = await startServer(port);
});

after(async () => {
  return close(1);
});

describe('xior proxy plguins tests', () => {
  const instance = xior.create({
    baseURL,
    proxy: { host: 'https://hacker-news.firebaseio.com' },
  } as XiorRequestConfig);
  instance.plugins.use(xiorProxyPlugin());

  it('should work with proxy plugin', async () => {
    const { data } = await instance.get('/v0/item/121003.json');
    assert.strictEqual(data.id, 121003);
    assert.strictEqual(data.time, 1203647620);
    assert.strictEqual(data.title, 'Ask HN: The Arc Effect');
  });

  it('should work with `proxy: undefined`', async () => {
    const { data } = await instance.get('/get', { baseURL, proxy: undefined } as XiorRequestConfig);
    assert.strictEqual(data.method, 'get');
  });

  it('should work with basic auth', async () => {
    const { data } = await instance.get('/basic-auth', {
      baseURL: 'https://hacker-news.firebaseio.com',
      proxy: {
        host: baseURL,
        auth: {
          username: 'test',
          password: '123456',
        },
      },
    } as XiorRequestConfig);
    assert.strictEqual(data.method, 'get');
    assert.strictEqual(data.msg, 'ok');
  });

  it('should work with basic auth: complex characters username/password', async () => {
    const { data } = await instance.get('/basic-auth', {
      baseURL: 'https://hacker-news.firebaseio.com',
      proxy: {
        host: baseURL,
        auth: {
          username: '.(*-?',
          password: '.(*-?/',
        },
      },
    } as XiorRequestConfig);
    assert.strictEqual(data.method, 'get');
    assert.strictEqual(data.msg, 'ok');
  });
});
