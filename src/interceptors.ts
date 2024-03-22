import type { XiorInterceptorRequestConfig } from './types';
import { encodeParams, merge } from './utils';

export const formUrl = 'application/x-www-form-urlencoded';
const jsonType = 'application/json';
// const formType = 'multipart/form-data';

export function likeGET(method = 'GET') {
  return ['HEAD', 'GET', 'DELETE', 'OPTIONS'].includes(method);
}

export default async function defaultRequestInterceptor(
  req: XiorInterceptorRequestConfig
): Promise<XiorInterceptorRequestConfig> {
  const encode = req.encode || req.paramsSerializer || encodeParams;
  const encodeURI = req.encodeURI !== false;

  const method = req.method ? req.method.toUpperCase() : 'GET';
  let _url = req.url || '';
  const url = _url;
  const data = req.data;
  let _data = data;
  let encodedParams = false;
  const headers = req?.headers || {};

  if (data && !(data instanceof FormData)) {
    let contentType = '';
    if (req?.headers) {
      const contentTypeKey = Object.keys(req.headers).find((key) => {
        return key.toLowerCase() === 'content-type';
      });
      if (contentTypeKey) {
        contentType = req.headers[contentTypeKey];
        req.headers['Content-Type'] = contentType;
        delete req.headers[contentTypeKey];
      }
    }
    if (!contentType) {
      contentType = likeGET(method) ? formUrl : jsonType;
      headers['Content-Type'] = contentType;
    }

    if (contentType === formUrl && (typeof data === 'object' || req.params)) {
      encodedParams = true;
      const encodeUrlData = encode(merge(data || {}, req.params || {}), encodeURI);
      if (encodeUrlData) {
        _url += _url.includes('?') ? `&${encodeUrlData}` : `?${encodeUrlData}`;
      }
    } else if (contentType === jsonType) {
      _data = JSON.stringify(data);
    }
  }

  if (!encodedParams && req.params && Object.keys(req.params).length > 0) {
    _url += _url.includes('?')
      ? `&${encode(req.params, encodeURI)}`
      : `?${encode(req.params, encodeURI)}`;
  }

  return {
    ...req,
    data,
    _data,
    url,
    _url,
    method,
    headers,
    encode,
    paramsSerializer: encode,
  };
}
