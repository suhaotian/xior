import assert from 'node:assert';
import { describe, it } from 'node:test';

import { encode, isAbsoluteURL } from '../utils';

describe('utils tests', () => {
  describe('utils.encode tests', () => {
    it('should work with empty object', () => {
      assert.strictEqual(encode({}), '');
    });
    it('should work with valid config', () => {
      assert.strictEqual(encode({ a: 1, b: 2, c: 0 }), 'a=1&b=2&c=0');
    });
    it('should work with special characters with default encodeURIComponent', () => {
      assert.strictEqual(encode({ a: 1, b: '2/' }), 'a=1&b=2%2F');
    });
    it('should work with special characters without encodeURIComponent', () => {
      assert.strictEqual(encode({ a: 1, b: '2/' }, false), 'a=1&b=2/');
    });
    it("shouldn't work with nested object", () => {
      assert.strictEqual(encode({ a: 1, b: { c: 1 } }, false), 'a=1&b=[object Object]');
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
});
