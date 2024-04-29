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
      paramsSerializer: encodeParams,
    });
    const params = { a: 'b', c: [1, 2, 3, { d: [7, 8, 9, { e: 234 }] }] };
    const { data } = await instance.get('/get', { params });
    assert.strictEqual(stringify(data.query), stringify(params));
    assert.strictEqual(stringify(data.query), encodeParams(params));
  });

  it('encode object should remove undefined value', () => {
    const data = { a: '1', c: undefined };
    assert.strictEqual(encodeParams(data), `a=1`);
  });

  it('encode nested object should remove undefined value', () => {
    const data = { a: '1', d: { c: undefined } };
    assert.strictEqual(encodeParams(data), `a=1`);
  });

  it('encode nested object should work exactly with server(remove undefined value)', async () => {
    const instance = xior.create({
      baseURL,
      paramsSerializer: encodeParams,
    });
    const params = { a: 'b', c: undefined, d: { e: undefined } };
    const { data } = await instance.get('/get', { params });
    assert.strictEqual(data.query.hasOwnProperty('a'), true);
    assert.strictEqual(data.query['a'], 'b');
    assert.strictEqual(data.query.hasOwnProperty('c'), false);
    assert.strictEqual(data.query.hasOwnProperty('d'), false);
  });

  it('nested data object should work exactly with server(remove undefined value)', async () => {
    const instance = xior.create({
      baseURL,
      paramsSerializer: encodeParams,
    });
    const objData = { a: 'b', c: undefined, d: { e: undefined } };
    const { data } = await instance.post('/post', objData);
    assert.strictEqual(data.body.hasOwnProperty('a'), true);
    assert.strictEqual(data.body['a'], 'b');
    assert.strictEqual(data.body.hasOwnProperty('c'), false);
    assert.strictEqual(data.body['d'].hasOwnProperty('e'), false);
  });
});
