import type { XiorRequestConfig, XiorResponse } from './types';

export * from './any-signals';
export * from './merge';

export function encode(obj: Record<string, any>, encodeURI = true) {
  const list: string[] = [];
  if (typeof obj === 'object' && obj !== null) {
    Object.keys(obj).map((key) => it(obj, key, list, encodeURI));
  }
  return list.join('&');
}

function it(obj: Record<string, any>, key: string, list: string[], encodeURI: boolean) {
  const val = obj[key];
  if (val === null) return;
  if (val instanceof Function) return;
  const pair = encodeURI
    ? encodeURIComponent(key) + '=' + encodeURIComponent(val)
    : key + '=' + val;
  list.push(pair);
}

/**
 * Determines whether the specified URL is absolute
 *
 * @param {string} url The URL to test
 *
 * @returns {boolean} True if the specified URL is absolute, otherwise false
 */
export function isAbsoluteURL(url: string) {
  // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
  // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
  // by any combination of letters, digits, plus, period, or hyphen.
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
}

export class XiorTimeoutError extends Error {}
export class XiorError extends Error {
  request?: XiorRequestConfig;
  response?: XiorResponse;

  constructor(message: string, request?: XiorRequestConfig, response?: XiorResponse) {
    super(message);
    this.request = request;
    this.response = response;
  }
}
