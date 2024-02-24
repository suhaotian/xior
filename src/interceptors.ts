import type { XiorInterceptorRequestConfig } from './types';
import { encode as liteEncode, merge } from './utils';

const encodeUrlType = 'application/x-www-form-urlencoded';
const jsonType = 'application/json';
// const formType = 'multipart/form-data';

export async function defaultRequestInterceptor(
  req: XiorInterceptorRequestConfig
): Promise<XiorInterceptorRequestConfig> {
  const encode = req.encode || liteEncode;
  const encodeURI = req.encodeURI !== false;

  const method = req.method ? req.method.toUpperCase() : 'GET';
  let _url = req.url || '';
  const url = _url;
  let data = req.data;
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
      }
    }
    if (!contentType) {
      contentType = method === 'GET' || method === 'HEAD' ? encodeUrlType : jsonType;
      headers['Content-Type'] = contentType;
    }

    if (contentType === encodeUrlType && (typeof data === 'object' || req.params)) {
      encodedParams = true;
      const encodeUrlData = encode(merge(data || {}, req.params || {}), encodeURI);
      if (encodeUrlData) {
        _url = _url.includes('?') ? (_url += `&${encodeUrlData}`) : `${_url}?${encodeUrlData}`;
      }
      data = null;
    } else if (contentType === jsonType) {
      data = JSON.stringify(data);
    }
  }

  if (!encodedParams && req.params && Object.keys(req.params).length > 0) {
    _url = _url.includes('?')
      ? (_url += `&${encode(req.params, encodeURI)}`)
      : `${_url}?${encode(req.params, encodeURI)}`;
  }

  return {
    ...req,
    data,
    url,
    _url,
    method,
    headers,
  };
}
