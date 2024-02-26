import assert from 'node:assert';
import { describe, it } from 'node:test';
// @ts-ignore
import stringify from 'qs/lib/stringify';

import buildSortedUrl from '../../plugins/cache/build-sorted-url';

describe('build-sorted-url tests', () => {
  it('should work without data', () => {
    const result = buildSortedUrl('/a', {}, (a) => stringify(a));
    assert.strictEqual(result, '/a');
  });

  it('should work with data', () => {
    const result = buildSortedUrl('/a', { b: 2 }, (a) => stringify(a));
    assert.strictEqual(result, '/a?b=2');
  });

  it('should work with params and data', () => {
    const result = buildSortedUrl('/a?c=1', { b: 2 }, (a) => stringify(a));
    assert.strictEqual(result, '/a?b=2&c=1');
  });

  it('should work with params but witout data', () => {
    const result = buildSortedUrl('/a?c=1', {}, (a) => stringify(a));
    assert.strictEqual(result, '/a?c=1');
  });

  it('should work with params and nested data', () => {
    const result = buildSortedUrl('/a?c=1', { c: 2, b: { a: 1 } }, (a) =>
      stringify(a, { encode: false })
    );
    assert.strictEqual(result, '/a?b[a]=1&c=1&c=2');
  });
});
