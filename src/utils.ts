import { isArray, keys, nullValue, o, op, undefinedValue } from './shorts';
import type { XiorRequestConfig, XiorResponse } from './types';
export * from './any-signals';
export * from './merge';
export * from './plugins/utils';

export function encodeParams<T = any>(
  params: T,
  encodeURI = true,
  parentKey: string | null = nullValue,
  options?: {
    allowDots?: boolean;
    serializeDate?: (value: Date) => string;
    arrayFormat?: 'indices' | 'repeat' | 'brackets' | 'comma';
  }
): string {
  if (params === undefinedValue || params === nullValue) return '';
  const encodedParams = [];
  const encodeURIFn = encodeURI ? encodeURIComponent : (v: string) => v;
  const paramsIsArray = isArray(params);
  const { arrayFormat, allowDots, serializeDate } = options || {};

  // Handle comma format for arrays
  if (paramsIsArray && arrayFormat === 'comma') {
    const values = (params as any[]).map((item) => {
      if (!isNaN(item) && item instanceof Date) {
        return serializeDate ? serializeDate(item) : item.toISOString();
      }
      return typeof item === o ? JSON.stringify(item) : String(item);
    });
    const commaValues = encodeURIFn(values.join(','));
    return parentKey ? `${encodeURIFn(parentKey)}=${commaValues}` : commaValues;
  }

  const getKey = (key: string) => {
    if (allowDots && !paramsIsArray) return `.${key}`;
    if (paramsIsArray) {
      if (arrayFormat === 'brackets') {
        return `[]`;
      } else if (arrayFormat === 'repeat') {
        return ``;
      }
    }
    return `[${key}]`;
  };

  for (const key in params) {
    if (op.hasOwnProperty.call(params, key)) {
      let value = (params as any)[key];
      if (value !== undefinedValue) {
        const encodedKey = parentKey ? `${parentKey}${getKey(key)}` : encodeURIFn(key as string);

        if (!isNaN(value) && value instanceof Date) {
          value = serializeDate ? serializeDate(value) : value.toISOString();
        }
        if (typeof value === o) {
          // If the value is an object or array, recursively encode its contents
          const result = encodeParams(value, encodeURI, encodedKey, options);
          if (result !== '') encodedParams.push(result);
        } else {
          // Otherwise, encode the key-value pair
          encodedParams.push(`${encodeURIFn(encodedKey)}=${encodeURIFn(value)}`);
        }
      }
    }
  }

  return encodedParams.join('&');
}

export function trimUndefined(obj: any): any {
  if (isArray(obj)) {
    return obj.map(trimUndefined);
  } else if (obj && typeof obj === o) {
    keys(obj).forEach((key) => {
      const value = obj[key];
      if (value === undefinedValue) {
        delete obj[key];
      } else {
        trimUndefined(value);
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
export function joinPath(path1?: string, path2?: string) {
  if (!path1) return path2 || '';
  if (!path2) return path1;
  const p1 = path1.endsWith('/') ? path1.slice(0, -1) : path1;
  const p2 = path2.startsWith('/') ? path2.slice(1) : path2;
  return `${p1}/${p2}`;
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
  toString() {
    return `${this.message}`;
  }
}

export class XiorTimeoutError<T = any> extends XiorError<T> {
  constructor(message: string, request?: XiorRequestConfig, response?: XiorResponse<T>) {
    super(message, request, response);
    this.name = XTE;
  }
}

export function isXiorError<T = any>(error: any): error is XiorError<T> | XiorTimeoutError<T> {
  return [XE, XTE].includes(error?.name);
}

export function isCancel(error: any) {
  return [XTE, 'AbortError'].includes(error?.name);
}
