import { keys, o, f, O, json, GET, HEAD, OPTIONS, undefinedValue, qs, h, m } from './shorts';
import type { XiorInterceptorRequestConfig } from './types';
import { trimUndefined, encodeParams, merge } from './utils';

const appPrefix = 'application/';
const formUrl = `${appPrefix}x-www-form-urlencoded`;

const R = RegExp;
const formUrlRegex = new R(`^${formUrl}`, 'i'); // \^application\/x-www-form-urlencoded\i
const jsonType = `${appPrefix}${json}`;
const jsonRegex = new R(`^${appPrefix}.*${json}.*`, 'i'); // \^application\/.*json.*\i

function likeGET(method = GET) {
  return [HEAD, GET, OPTIONS].includes(method);
}

const supportURLSearchParams = typeof URLSearchParams !== `${undefinedValue}`;

export default async function defaultRequestInterceptor(req: XiorInterceptorRequestConfig) {
  const stringifyParams = req[qs] || encodeParams;
  const encodeURI = req.encodeURI !== false;
  const method = req[m] && req[m].toUpperCase();
  let _url = req.url;
  const url = _url;
  const isUrlSearchParams = supportURLSearchParams && req.data instanceof URLSearchParams;
  const data = isUrlSearchParams ? O.fromEntries(req.data.entries()) : req.data;
  let _data = data;
  const headers = req?.[h] ? { ...req[h] } : {};
  let newParams = req.params;
  const isGet = likeGET(method);

  // const isFormData = typeof data?.append === f; // f: 'function'
  const isFormData = typeof data?.append === f;

  let contentType = '',
    contentTypeKey = 'content-type';
  if (data && req?.[h]) {
    const key = keys(req[h]).find((key) => key.toLowerCase() === contentTypeKey);
    if (key) {
      contentTypeKey = key;
      contentType = req[h][key];
      if (isFormData) delete req[h][key];
    }
  }

  if (data && !isFormData) {
    if (!contentType || isUrlSearchParams) {
      contentType = isGet || isUrlSearchParams ? formUrl : jsonType;
      headers[contentTypeKey] = contentType;
    }

    // typeof data === 'object'
    if (typeof data === o) {
      if (isGet && newParams) {
        newParams = merge(data, newParams);
      }
      if (jsonRegex.test(contentType)) {
        _data = JSON.stringify(trimUndefined(data));
      } else if (!isGet && formUrlRegex.test(contentType)) {
        _data = stringifyParams(data);
      }
    }
  }

  if (newParams && keys(newParams).length > 0) {
    const result = stringifyParams(newParams, encodeURI);
    _url += _url.includes('?') ? `&${result}` : `?${result}`;
  }

  return {
    ...req,
    _data,
    _url,
    data,
    url,
    method,
    [h]: headers,
    isGet,
  };
}
