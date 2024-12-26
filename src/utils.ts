import type { XiorRequestConfig, XiorResponse } from './types';

export * from './any-signals';
export * from './merge';
export * from './plugins/utils';

const undefinedValue = undefined;
export function encodeParams<T = any>(
  params: T,
  encodeURI = true,
  parentKey: string | null = null,
  options?: {
    allowDots?: boolean;
    serializeDate?: (value: Date) => string;
    arrayFormat?: 'indices' | 'repeat' | 'brackets';
  }
): string {
  if (params === undefinedValue || params === null) return '';
  const encodedParams = [];
  const encodeURIFn = encodeURI ? encodeURIComponent : (v: string) => v;
  const paramsIsArray = Array.isArray(params);
  const { arrayFormat, allowDots, serializeDate } = options || {};
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
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      let value = (params as any)[key];
      if (value !== undefinedValue) {
        const encodedKey = parentKey ? `${parentKey}${getKey(key)}` : (key as string);

        if (!isNaN(value) && value instanceof Date) {
          value = serializeDate ? serializeDate(value) : value.toISOString();
        }
        if (typeof value === 'object') {
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
  if (Array.isArray(obj)) {
    return obj.map(trimUndefined);
  } else if (obj && typeof obj === 'object') {
    Object.keys(obj).forEach((key) => {
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
