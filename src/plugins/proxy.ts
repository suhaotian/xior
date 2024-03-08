import { XiorInterceptorRequestConfig, XiorPlugin, XiorRequestConfig } from '../types';
import { isAbsoluteURL } from '../utils';
import { xior } from '../xior';

/** @ts-ignore */
declare module 'xior' {
  interface XiorRequestConfig {
    proxy?: XiorProxyConfig;
  }
}

export interface XiorBasicCredentials {
  username: string;
  password: string;
}

export interface XiorProxyConfig {
  host: string;
  protocol?: string;
  port?: number;
  auth?: XiorBasicCredentials;
}

export default function xiorProxyPlugin(): XiorPlugin {
  const proxyInstance = xior.create();
  return function proxyPlugin(adapter) {
    return async (config) => {
      const proxyConfig = (config as { proxy?: XiorProxyConfig }).proxy;

      if (proxyConfig && proxyConfig.host) {
        // url is not absolute url
        // url match with baseURL
        let isValidUrlToProxy = true;
        let isAbsolute = false;
        if (config.url && isAbsoluteURL(config.url)) {
          isValidUrlToProxy = !!(config.baseURL && config.url.startsWith(config.baseURL));
          isAbsolute = true;
        }
        if (isValidUrlToProxy) {
          const { protocol, host, port, auth } = proxyConfig;
          let proxyUrl = '';
          if (protocol) {
            proxyUrl += `${protocol}://`;
          }
          proxyUrl += host;
          if (port) {
            proxyUrl += `:${port}`;
          }
          const url = isAbsolute
            ? config.url?.replace(config.baseURL as string, proxyUrl)
            : proxyUrl + (config.url || '');

          const proxyHeaders: Record<string, string> = {};

          if (auth) {
            proxyHeaders['Authorization'] = `Basic ${btoa(auth.username + ':' + auth.password)}`;
          }

          const proxyRequestConfig = {
            ...config,
            _url: '',
            url,
            proxy: undefined,
            baseURL: proxyUrl,
            headers: {
              ...config.headers,
              ...proxyHeaders,
            },
          } as XiorInterceptorRequestConfig;
          return proxyInstance.request(proxyRequestConfig);
        }
      }
      return adapter(config);
    };
  };
}
