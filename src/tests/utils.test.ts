import assert from 'node:assert';
import { describe, it } from 'node:test';

import { encodeParams, isAbsoluteURL, joinPath } from '../utils';

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
});
