import type { XiorRequestConfig, XiorResponse } from './types';

export * from './any-signals';
export * from './merge';
export * from './plugins/utils';

export function encodeParams<T = any>(
  params: T,
  encodeURI = true,
  parentKey: string | null = null
): string {
  if (typeof params === 'undefined' || params === null) return '';
  const encodedParams = [];
  const encodeURIFunc = encodeURI ? encodeURIComponent : (v: string) => v;

  for (const key in params) {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      const value = (params as any)[key];
      const encodedKey = parentKey ? `${parentKey}[${encodeURIFunc(key)}]` : encodeURIFunc(key);

      if (typeof value === 'object') {
        // If the value is an object or array, recursively encode its contents
        const result = encodeParams(value, encodeURI, encodedKey);
        if (result !== '') encodedParams.push(result);
      } else if (Array.isArray(value)) {
        // If the value is an array, encode each element individually
        value.forEach((element, index) => {
          const arrayKey = `${encodedKey}[${index}]`;
          encodedParams.push(`${encodeURIFunc(arrayKey)}=${encodeURIFunc(element)}`);
        });
      } else {
        // Otherwise, encode the key-value pair
        encodedParams.push(`${encodeURIFunc(encodedKey)}=${encodeURIFunc(value)}`);
      }
    }
  }

  return encodedParams.join('&');
}

function it(obj: Record<string, any>, key: string, list: string[], encodeURI: boolean) {
  const val = obj[key];
  if (val === null) return;
  if (val instanceof Function) return;
  const en = encodeURIComponent;
  const pair = encodeURI ? en(key) + '=' + en(val) : key + '=' + val;
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
