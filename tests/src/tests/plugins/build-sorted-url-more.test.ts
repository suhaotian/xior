// test/buildSortedURL.edge.test.ts
import test from 'node:test';
import assert from 'node:assert';
import { buildSortedURL } from 'xior';

// Serializer for testing
function simpleSerializer(params: Record<string, any>): string {
  return Object.entries(params)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
}

test('buildSortedURL: should handle empty string URL', () => {
  const result = buildSortedURL('', { a: 1 }, simpleSerializer);
  assert.strictEqual(result, '?a=1');
});

test('buildSortedURL: should handle URL ending with ?', () => {
  const result = buildSortedURL('https://example.com/api?', { b: 2, a: 1 }, simpleSerializer);
  assert.strictEqual(result, 'https://example.com/api?a=1&b=2');
});

test('buildSortedURL: should handle URL ending with &', () => {
  const result = buildSortedURL('https://example.com/api?c=3&', { b: 2, a: 1 }, simpleSerializer);
  assert.strictEqual(result, 'https://example.com/api?a=1&b=2&c=3');
});

test('buildSortedURL: should handle special characters', () => {
  const data = { 'a&b': '1=2', c: 'x y' };
  const result = buildSortedURL('https://example.com/api', data, simpleSerializer);
  // Sorting lexicographically by key
  assert.strictEqual(result, 'https://example.com/api?a&b=1=2&c=x y');
});

test('buildSortedURL: should handle repeated keys', () => {
  const data = { b: 2, a: 3 }; // JS object will overwrite, only last a=3 matters
  const result = buildSortedURL('https://example.com/api', data, simpleSerializer);
  assert.strictEqual(result, 'https://example.com/api?a=3&b=2');
});

test('buildSortedURL: should handle numeric keys', () => {
  const data = { 10: 'ten', 2: 'two' };
  const result = buildSortedURL('https://example.com/api', data, simpleSerializer);
  assert.strictEqual(result, 'https://example.com/api?10=ten&2=two');
});

test('buildSortedURL: should handle boolean and null values', () => {
  const data = { a: true, b: false, c: null };
  const result = buildSortedURL('https://example.com/api', data, simpleSerializer);
  assert.strictEqual(result, 'https://example.com/api?a=true&b=false&c=null');
});

test('buildSortedURL: should handle empty object data', () => {
  const result = buildSortedURL('https://example.com/api', {}, simpleSerializer);
  assert.strictEqual(result, 'https://example.com/api');
});

test('buildSortedURL: should sort mixed existing and new query params', () => {
  const url = 'https://example.com/api?z=26&a=1';
  const data = { m: 13 };
  const result = buildSortedURL(url, data, simpleSerializer);
  assert.strictEqual(result, 'https://example.com/api?a=1&m=13&z=26');
});
