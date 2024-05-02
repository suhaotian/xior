import type { XiorRequestConfig, XiorResponse } from './types';

export * from './any-signals';
export * from './merge';
export * from './plugins/utils';

const undefinedValue = undefined;
export function encodeParams<T = any>(
  params: T,
  encodeURI = true,
  parentKey: string | null = null
): string {
  if (params === undefinedValue || params === null) return '';
  const encodedParams = [];
  const encodeURIFunc = encodeURI ? encodeURIComponent : (v: string) => v;

  for (const key in params) {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      const value = (params as any)[key];
      if (value !== undefinedValue) {
        const encodedKey = parentKey ? `${parentKey}[${encodeURIFunc(key)}]` : encodeURIFunc(key);

        if (isObj(value)) {
          // If the value is an object or array, recursively encode its contents
          const result = encodeParams(value, encodeURI, encodedKey);
          if (result !== '') encodedParams.push(result);
        } else if (isArray(value)) {
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
  }

  return encodedParams.join('&');
}

export function trimUndefined(obj: any): any {
  if (isArray(obj)) {
    return obj.map(trimUndefined);
  } else if (obj && isObj(obj)) {
    keys(obj).forEach((key) => {
      const value = obj[key];
      if (value === undefinedValue) {
        delete obj[key];
      } else {
        return trimUndefined(value);
      }
    });
  }
  return obj;
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

/**
 * joinPath('/', '/') -> '/'
 * joinPath('/a/', '/b') -> '/a/b'
 * joinPath('/a', '/b') -> '/a/b'
 */
export function joinPath(path1: string, path2: string) {
  if (!path2) return path1;
  return (path1.endsWith('/') ? path1 : path1 + '/') + (path2[0] === '/' ? path2.slice(1) : path2);
}

export class XiorError<T = any> extends Error {
  request?: XiorRequestConfig;
  config?: XiorRequestConfig;
  response?: XiorResponse;

  constructor(message: string, request?: XiorRequestConfig, response?: XiorResponse<T>) {
    super(message);
    this.name = 'XiorError';
    this.request = request;
    this.config = request;
    this.response = response;
  }
}
export class XiorTimeoutError extends XiorError {
  constructor(message: string, request?: XiorRequestConfig, response?: XiorResponse) {
    super(message);
    this.name = 'XiorTimeoutError';
    this.request = request;
    this.config = request;
    this.response = response;
  }
}

export function isXiorError(error: any) {
  return error.name === 'XiorError' || error.name === 'XiorTimeoutError';
}

export const keys: typeof Object.keys = (obj) => Object.keys(obj);
export const isObj = (obj: any) => typeof obj === 'object';
export const isArray = ((arr: any) => Array.isArray(arr)) as typeof Array.isArray;
