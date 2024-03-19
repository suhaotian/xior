import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { stringify } from 'qs';
import { xior, encodeParams } from 'xior';

import { startServer } from './server';

let close: Function;
const port = 7900;
const baseURL = `http://localhost:${port}`;
before(async () => {
  close = await startServer(port);
});

after(async () => {
  return close(1);
});

describe('encodeParams()', function () {
  it('encode a querystring object', function () {
    assert.strictEqual(encodeParams({ a: 'b' }), 'a=b');
    assert.strictEqual(encodeParams({ a: 1 }), 'a=1');
    assert.strictEqual(encodeParams({ a: 1, b: 2 }), 'a=1&b=2');
    assert.strictEqual(encodeParams({ a: 'A_Z' }), 'a=A_Z');
    assert.strictEqual(encodeParams({ a: '€' }), 'a=%E2%82%AC');
    assert.strictEqual(encodeParams({ a: '' }), 'a=%EE%80%80');
    assert.strictEqual(encodeParams({ a: 'א' }), 'a=%D7%90');
    assert.strictEqual(encodeParams({ a: '𐐷' }), 'a=%F0%90%90%B7');
  });

  it('encode falsy values', function () {
    assert.strictEqual(encodeParams(undefined), '');
    assert.strictEqual(encodeParams(null), '');
    assert.strictEqual(encodeParams(false), '');
    assert.strictEqual(encodeParams(0), '');
    assert.strictEqual(encodeParams({ a: 0 }, false), 'a=0');
    assert.strictEqual(encodeParams({ a: false, c: [] }, false), 'a=false');
  });

  it('encode nested object', () => {
    const data = { a: 'b', c: [1, 2, 3, { d: [7, 8, 9, { e: 234 }] }] };
    assert.strictEqual(encodeParams(data), stringify(data));
    assert.strictEqual(encodeParams(data, false), stringify(data, { encode: false }));
  });

  it('encode nested object should work with server', async () => {
    const instance = xior.create({
      baseURL,
      encode: encodeParams,
    });
    const params = { a: 'b', c: [1, 2, 3, { d: [7, 8, 9, { e: 234 }] }] };
    const { data } = await instance.get('/get', { params });
    assert.strictEqual(stringify(data.query), stringify(params));
    assert.strictEqual(stringify(data.query), encodeParams(params));
  });
});
