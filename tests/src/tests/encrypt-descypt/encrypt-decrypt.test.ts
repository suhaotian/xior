import assert from 'node:assert';
import { describe, it, after, before } from 'node:test';

import { instance } from './xior-instance';
import { startServer } from '../server';

let close: Function;
const port = 7888;
const baseURL = `http://localhost:${port}`;

instance.defaults.baseURL = baseURL;

before(async () => {
  close = await startServer(port);
});

after(async () => {
  return close(1);
});

describe('xior encrypt-decrypt tests', () => {
  it('xior should work exactly', async function () {
    const { data } = await instance.post('/encrypt', { a: 1, b: 2, c: '3' });
    console.log(data);
    assert.equal(data.a, 1);
    assert.equal(data.b, 2);
    assert.equal(data.c, '3');
  });
});
