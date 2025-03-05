import assert from 'node:assert';
import { describe, it } from 'node:test';
import {
  XiorError,
  XiorTimeoutError,
  encodeParams,
  isAbsoluteURL,
  isXiorError,
  joinPath,
  trimUndefined,
  merge,
} from 'xior';

describe('utils tests', () => {
  describe('utils.encodeParams tests', () => {
    it("shouldn't work with nested object", () => {
      assert.strictEqual(encodeParams({ a: 1, b: { c: 1 } }, false), 'a=1&b[c]=1');
    });
  });

  describe('utils.isAbsoluteURL tests', () => {
    it('should work with `//`', () => {
      assert.strictEqual(isAbsoluteURL('//'), true);
    });
    it('should work with `http://` or `https://`', () => {
      assert.strictEqual(isAbsoluteURL('http://'), true);
      assert.strictEqual(isAbsoluteURL('https://'), true);
    });
    it('should work with `ops://abc`', () => {
      assert.strictEqual(isAbsoluteURL('ops://abc'), true);
    });
    it('should work with `/abc`', () => {
      assert.strictEqual(isAbsoluteURL('/abc'), false);
    });
  });

  describe('utils.joinPath tests', () => {
    it('should work exactly', () => {
      assert.strictEqual(joinPath('/abc', ''), '/abc');
      assert.strictEqual(joinPath('/abc', '/def'), '/abc/def');
      assert.strictEqual(joinPath('/abc/', '/def/'), '/abc/def/');
    });
  });

  describe('utils.isXiorError tests', () => {
    it('should work exactly `XiorError`', () => {
      const error = new XiorError('some error msg');
      assert.strictEqual(isXiorError(error), true);
    });

    it('should work exactly with `XiorTimeoutError`', () => {
      const error = new XiorTimeoutError('some error msg');
      assert.strictEqual(isXiorError(error), true);
    });

    it('should work exactly with `Error`', () => {
      const error = new Error('some error msg');
      assert.strictEqual(isXiorError(error), false);
    });
  });

  describe('utils.trimUndefined tests', () => {
    it('should work with `null`', () => {
      const result = trimUndefined(null);
      assert.strictEqual(result, null);
    });
    it('should work with `undefined`', () => {
      const result = trimUndefined(undefined);
      assert.strictEqual(result, undefined);
    });
    it('should work with `{a: 1, b: undefined}`', () => {
      const result = trimUndefined({ a: 1, b: undefined });
      assert.strictEqual(result.hasOwnProperty('a'), true);
      assert.strictEqual(result.hasOwnProperty('b'), false);
      assert.strictEqual(result['a'], 1);
    });
    it('should work with nested `{a: 1, b: undefined, c: {d: {e: undefined}}}`', () => {
      const result = trimUndefined({ a: 1, b: undefined, c: { d: { e: undefined } } });
      assert.strictEqual(result.hasOwnProperty('b'), false);
      assert.strictEqual(result.hasOwnProperty('a'), true);
      assert.strictEqual(result['a'], 1);
      assert.strictEqual(result.hasOwnProperty('c'), true);
      assert.strictEqual(result['c'].hasOwnProperty('d'), true);
      assert.strictEqual(result['c']['d'].hasOwnProperty('e'), false);
    });
  });

  describe('utils.merge tests', () => {
    it('should work with simple object', () => {
      const a = { a: 1 };
      const b = { b: 2 };
      const c = { c: 3 };
      const d = merge(a, b, c);
      assert.strictEqual(d.a, 1);
      assert.strictEqual(d.b, 2);
      assert.strictEqual(d.c, 3);

      assert.strictEqual(Object.keys(d).length, 3, '`d` is new object');
      assert.strictEqual(Object.keys(d).join(','), 'a,b,c', '`d` is new object');

      assert.strictEqual(Object.keys(a).length, 1, '`a` still is the old object');
      assert.strictEqual(Object.keys(a)[0], 'a', '`a` still is the old object');
    });

    it('should work with nested object', () => {
      const a = { a: { a: 1 } };
      const b = { b: { b: 2 } };
      const c = { c: { c: 3, a: 2 }, a: { a: 2 } };
      const d = merge(a, b, c);
      assert.strictEqual(d.a.a, 2);
      assert.strictEqual(d.b.b, 2);
      assert.strictEqual(d.c.c, 3);

      assert.strictEqual(Object.keys(d).length, 3, '`d` is new object');
      assert.strictEqual(Object.keys(d).join(','), 'a,b,c', '`d` is new object');

      assert.strictEqual(Object.keys(a).length, 1, '`a` still is the old object');
      assert.strictEqual(Object.keys(a)[0], 'a', '`a` still is the old object');
    });
  });
});
