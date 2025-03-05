import type { XiorInterceptorRequestConfig } from './types';
import { trimUndefined, encodeParams, merge, keys, o, f, O } from './utils';

const appPrefix = 'application/';
const formUrl = `${appPrefix}x-www-form-urlencoded`;
const jsonType = `${appPrefix}json`;

export function likeGET(method = 'GET') {
  return ['HEAD', 'GET', 'OPTIONS'].includes(method);
}

const supportURLSearchParams = typeof URLSearchParams !== 'undefined';

export default async function defaultRequestInterceptor(req: XiorInterceptorRequestConfig) {
  const ps = req.paramsSerializer || encodeParams;
  const encodeURI = req.encodeURI !== false;
  const method = req.method && req.method.toUpperCase();
  let _url = req.url || '';
  const url = _url;
  const isUrlSearchParams =
    supportURLSearchParams && req.data && req.data instanceof URLSearchParams;
  const data = isUrlSearchParams ? O.fromEntries(req.data.entries()) : req.data;
  let _data = data;
  const headers = req?.headers ? { ...req.headers } : {};
  let newParams = req.params || {};
  const isGet = likeGET(method);
  const isFormData = typeof data?.append === f; // f: 'function'
  if (data && !isFormData) {
    let contentType = '',
      contentTypeKey = 'content-type';
    if (req?.headers) {
      const key = keys(req.headers).find((key) => {
        return key.toLowerCase() === contentTypeKey;
      });
      if (key) {
        contentTypeKey = key;
        contentType = req.headers[key];
      }
    }
    if (!contentType || isUrlSearchParams) {
      contentType = isGet || isUrlSearchParams ? formUrl : jsonType;
      headers[contentTypeKey] = contentType;
    }

    // typeof data === 'object'
    if (typeof data === o) {
      if (isGet && req.params) {
        newParams = merge(data, newParams);
      }
      if (contentType === jsonType) {
        _data = JSON.stringify(trimUndefined(data));
      } else if (!isGet && contentType === formUrl) {
        _data = ps(data);
      }
    }
  }

  if (keys(newParams).length > 0) {
    const result = ps(newParams, encodeURI);
    _url += _url.includes('?') ? `&${result}` : `?${result}`;
  }

  return {
    ...req,
    _data,
    _url,
    data,
    url,
    method,
    headers,
    isGet,
  };
}
