import { isArray, nullValue, o, op, undefinedValue } from './shorts';
import type { XiorRequestConfig, XiorResponse } from './types';
export * from './any-signals';
export * from './merge';
export * from './plugins/utils';

const hasOwnProperty = op.hasOwnProperty;

export function encodeParams<T = any>(
  params: T,
  encodeURI = true,
  parentKey: string | null = nullValue,
  options?: {
    allowDots?: boolean;
    serializeDate?: (value: Date) => string;
    arrayFormat?: 'indices' | 'repeat' | 'brackets';
  }
): string {
  if (params === undefinedValue || params === nullValue) return '';

  const encodedParams: string[] = [];
  const encode = encodeURI ? encodeURIComponent : (v: string) => v;
  const paramsIsArray = isArray(params);
  const { arrayFormat = 'indices', allowDots = false, serializeDate } = options || {};

  const getKey = (key: string): string => {
    if (paramsIsArray) {
      if (arrayFormat === 'brackets') return '[]';
      if (arrayFormat === 'repeat') return '';
      return `[${key}]`; // indices
    }
    return allowDots ? `.${key}` : `[${key}]`;
  };

  for (const key in params) {
    if (!hasOwnProperty.call(params, key)) continue;

    let value = (params as any)[key];
    if (value === undefinedValue) continue;

    // Build key - don't double encode
    const fullKey = parentKey ? `${parentKey}${getKey(key)}` : (key as string);

    // Handle dates
    if (!isNaN(value) && value instanceof Date) {
      value = serializeDate ? serializeDate(value) : value.toISOString();
    }

    // Recursively handle objects/arrays
    if (typeof value === o && value !== nullValue) {
      const result = encodeParams(value, encodeURI, fullKey, options);
      if (result) encodedParams.push(result);
    } else {
      // Encode key-value pair - only encode once
      encodedParams.push(`${encode(fullKey)}=${encode(String(value))}`);
    }
  }

  return encodedParams.join('&');
}

export function trimUndefined<T>(obj: T): T {
  if (isArray(obj)) {
    return obj.map(trimUndefined) as T;
  }

  if (obj && typeof obj === o) {
    for (const key in obj) {
      if (hasOwnProperty.call(obj, key)) {
        const value = (obj as any)[key];
        if (value === undefinedValue) {
          delete (obj as any)[key];
        } else if (typeof value === o && value !== nullValue) {
          trimUndefined(value);
        }
      }
    }
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
export function joinPath(path1?: string, path2?: string) {
  if (!path1) return path2 || '';
  if (!path2) return path1;
  return (path1.endsWith('/') ? path1 : path1 + '/') + (path2[0] === '/' ? path2.slice(1) : path2);
}

const XE = 'XiorError';
const XTE = 'XiorTimeoutError';
export class XiorError<T = any> extends Error {
  request?: XiorRequestConfig;
  config?: XiorRequestConfig;
  response?: XiorResponse<T>;

  constructor(message: string, request?: XiorRequestConfig, response?: XiorResponse<T>) {
    super(message);
    this.name = XE;
    this.request = request;
    this.config = request;
    this.response = response;
  }
}

export class XiorTimeoutError<T = any> extends XiorError<T> {
  constructor(message: string, request?: XiorRequestConfig, response?: XiorResponse<T>) {
    super(message, request, response);
    this.name = XTE;
  }
}

export function isXiorError<T = any>(error: any): error is XiorError<T> | XiorTimeoutError<T> {
  return error?.name === XE || error?.name === XTE;
}
