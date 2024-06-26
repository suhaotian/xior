// @ts-ignore
import { encodeParams, merge } from 'xior/utils';

import type { XiorInterceptorRequestConfig } from './types';
import { trimUndefined } from './utils';

const appPrefix = 'application/';
const formUrl = `${appPrefix}x-www-form-urlencoded`;
const jsonType = `${appPrefix}json`;
// const formType = 'multipart/form-data';
const ContentTypeKey = 'Content-Type';
const LowerCaseContentTypeKey = ContentTypeKey.toLowerCase();

export function likeGET(method = 'GET') {
  return ['HEAD', 'GET', 'OPTIONS'].includes(method);
}

export default async function defaultRequestInterceptor(req: XiorInterceptorRequestConfig) {
  const paramsSerializer = req.paramsSerializer || encodeParams;
  const encodeURI = req.encodeURI !== false;
  const method = req.method ? req.method.toUpperCase() : 'GET';
  let _url = req.url || '';
  const url = _url;
  const data = req.data;
  let _data = data;
  const headers = req?.headers || {};
  let newParams = req.params || {};
  const isGet = likeGET(method);
  if (data && !(data instanceof FormData)) {
    let contentType = '';
    if (req?.headers) {
      const contentTypeKey = Object.keys(req.headers).find((key) => {
        return key.toLowerCase() === LowerCaseContentTypeKey;
      });
      if (contentTypeKey) {
        contentType = req.headers[contentTypeKey];
        req.headers[ContentTypeKey] = contentType;
        if (contentTypeKey !== ContentTypeKey) {
          delete req.headers[contentTypeKey];
        }
      }
    }
    if (!contentType) {
      contentType = isGet ? formUrl : jsonType;
      headers[ContentTypeKey] = contentType;
    }
    if (typeof data === 'object') {
      if (isGet && req.params) {
        newParams = merge({}, data || {}, newParams);
      }
      if (contentType === jsonType) {
        _data = JSON.stringify(trimUndefined(data));
      } else if (!isGet && contentType === formUrl) {
        _data = paramsSerializer(data);
      }
    }
  }

  if (Object.keys(newParams).length > 0) {
    const result = paramsSerializer(newParams, encodeURI);
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
