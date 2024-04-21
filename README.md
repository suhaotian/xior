[![Build](https://github.com/suhaotian/xior/actions/workflows/check.yml/badge.svg)](https://github.com/suhaotian/xior/actions/workflows/check.yml)
[![minzipped size](https://badgen.net/badge/gzip/3kb/green)](https://bundlephobia.com/package/xior)
[![npm version](https://badgen.net/npm/v/xior?color=green)](https://www.npmjs.com/package/xior)
![Downloads](https://img.shields.io/npm/dm/xior.svg?style=flat)
![typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label&color=blue)
![license](https://badgen.net/npm/license/xior?color=blue)

## Intro

A lite request lib based on **fetch** with plugin support and similar API to axios.

**Features:**

- 🔥 Use **fetch**
- 🫡 **Similar axios API**: `axios.create` / `axios.interceptors` / `.get/post/put/patch/delete/head/options`
- 🤙 Support timeout and cancel requests
- 🥷 Plugin support: error retry, cache, throttling, dedupe, error cache, mock and easily create custom plugins
- 🚀 Lightweight (~8KB, Gzip ~3kb)
- 👊 Unit tested and strongly typed 💪

## Table of Contents

- [Intro](#intro)
- [Table of Contents](#table-of-contents)
- [Why Choose **xior**?](#why-choose-xior)
  - [Why not just use `axios`?](#why-not-just-use-axios)
  - [Why choose **xior** over Custom Fetch Wrappers?](#why-choose-xior-over-custom-fetch-wrappers)
- [Getting Started](#getting-started)
  - [Installing](#installing)
    - [Package manager](#package-manager)
    - [Use CDN](#use-cdn)
  - [Create instance](#create-instance)
  - [GET / POST / DELETE / PUT / PATCH / OPTIONS / HEAD](#get--post--delete--put--patch--options--head)
  - [Change default headers or params](#change-default-headers-or-params)
  - [Get response headers](#get-response-headers)
  - [Upload file](#upload-file)
  - [Using interceptors](#using-interceptors)
  - [Timeout and Cancel request](#timeout-and-cancel-request)
  - [Encrypt and Decrypt Example](#encrypt-and-decrypt-example)
  - [Automatically refreshing access token](#automatically-refreshing-access-token)
  - [Tips: Make your SSR(Server-side Rendering) app more stable and faster](#tips-make-your-ssrserver-side-rendering-app-more-stable-and-faster)
- [Plugins](#plugins)
  - [Error retry plugin](#error-retry-plugin)
  - [Request throttle plugin](#request-throttle-plugin)
  - [Request dedupe plugin](#request-dedupe-plugin)
  - [Error cache plugin](#error-cache-plugin)
  - [Cache plugin](#cache-plugin)
  - [Upload and download progress plugin](#upload-and-download-progress-plugin)
  - [Mock plugin](#mock-plugin)
  - [Auth refresh token plugin](#auth-refresh-token-plugin)
  - [Create your own custom plugin](#create-your-own-custom-plugin)
- [Helper functions](#helper-functions)
- [FAQ](#faq)
  - [1. Is **xior** 100% compatiable with `axios`?](#1-is-xior-100-compatiable-with-axios)
  - [2. Can I use xior in projects like Bun, Expo, React Native, RemixJS, Next.js, Vue, or Nuxt.js?](#2-can-i-use-xior-in-projects-like-bun-expo-react-native-remixjs-nextjs-vue-or-nuxtjs)
  - [3. How do I handle responses with types like `'stream'`, `'document'`, `'arraybuffer'`, or `'blob'`?](#3-how-do-i-handle-responses-with-types-like-stream-document-arraybuffer-or-blob)
  - [5. How do I support older browsers?](#5-how-do-i-support-older-browsers)
  - [6. Why is xior named "xior"?](#6-why-is-xior-named-xior)
  - [7. Where can I ask additional questions?](#7-where-can-i-ask-additional-questions)
- [Migrate from `axios` to **xior**](#migrate-from-axios-to-xior)
  - [GET](#get)
  - [POST](#post)
  - [`axios(requestObj)`: axios({ method: 'get', params: { a: 1 } })](#axiosrequestobj-axios-method-get-params--a-1--)
  - [Creating an instance](#creating-an-instance)
  - [Get response headers](#get-response-headers-1)
  - [Download file with `responseType: 'stream' | 'blob'`](#download-file-with-responsetype-stream--blob)
  - [Use stream](#use-stream)
- [Migrate from `fetch` to **xior**](#migrate-from-fetch-to-xior)
  - [GET](#get-1)
  - [POST](#post-1)
  - [Abort a fetch](#abort-a-fetch)
  - [Sending a request with credentials included](#sending-a-request-with-credentials-included)
  - [Uploading a file](#uploading-a-file)
  - [Processing a text file line by line](#processing-a-text-file-line-by-line)
- [Star History](#star-history)
- [Thanks](#thanks)

## Why Choose **xior**?

**xior** use the native **fetch API**, offering several advantages:

- **Web Standard:** Fetch is a widely supported web standard, ensuring compatibility across different environments.
- **Built-in Availability:** Both Node.js and browsers have built-in fetch implementations, eliminating the need for external dependencies.
- **Edge Compatibility:** Unlike Axios, xior works seamlessly in edge runtimes, making it suitable for serverless functions and Next.js middleware.
- **Convenient API and Plugin Support:** xior provides a familiar API similar to Axios, while also offering plugin support for customization and extending functionalities.

### Why not just use `axios`?

> If you want proxy support, use `axios`, because `xior` doesn't support proxy feature yet

While popular and convenient, Axios currently lacks native edge runtime support (see: [https://github.com/axios/axios/issues/5523](https://github.com/axios/axios/issues/5523)). This can be an issue for specific use cases like Next.js serverless functions and middleware files, where fetch offers built-in caching and revalidation mechanisms (see: [https://nextjs.org/docs/app/api-reference/functions/fetch](https://nextjs.org/docs/app/api-reference/functions/fetch)).

### Why choose **xior** over Custom Fetch Wrappers?

While you can certainly create your own wrapper library around fetch, **xior** offers a pre-built solution with a familiar API, plugin support for extensibility, and potentially a more streamlined development experience.

## Getting Started

### Installing

#### Package manager

```sh
# npm
npm install xior

# pnpm
pnpm add xior

# bun
bun add xior

# yarn
yarn add xior
```

#### Use CDN

> Since v0.2.1, xior support UMD format

Use jsDelivr CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/xior@0.3.13/dist/xior.umd.js"></script>

<!-- Usage -->
<script>
  console.log(xior.VERSION);

  xior.get('https://exmapledomain.com/api').then((res) => {
    console.log(res.data);
  });
</script>
```

Use unpkg CDN:

```html
<script src="https://unpkg.com/xior@0.3.13/dist/xior.umd.js"></script>

<!-- Usage -->
<script>
  xior.get('https://exmapledomain.com/api').then((res) => {
    console.log(res.data);
  });
</script>
```

### Create instance

```ts
import xior from 'xior';

export const xiorInstance = xior.create({
  baseURL: 'https://apiexampledomian.com/api',
  headers: {
    // put your common custom headers here
  },
});
```

### GET / POST / DELETE / PUT / PATCH / OPTIONS / HEAD

GET

> `HEAD` / `DELETE` / `OPTIONS` are same usage with `GET` method

```ts
async function run() {
  const { data } = await xiorInstance.get('/');

  // with params
  const { data: data2 } = await xiorInstance.get('/', { params: { a: 1, b: 2 } });

  // with headers
  const { data: data3 } = await xiorInstance.get('/', {
    params: { a: 1, b: 2 },
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
  });

  // types
  const { data: data4 } = await xiorInstance.get<{ field1: string; field2: number }>('/');
}
```

POST

> `PUT`/`PATCH` methods are same usage with `POST`

```ts
async function run() {
  const { data: data3 } = await xiorInstance.post<{ field1: string; field2: number }>(
    '/',
    { a: 1, b: '2' },
    {
      params: { id: 1 },
      headers: {
        'content-type': 'application/json',
      },
    }
  );
}
```

### Change default headers or params

```ts
import xior from 'xior';

export const xiorInstance = xior.create({
  baseURL: 'https://apiexampledomian.com/api',
});

function setAccessToken(token: string) {
  // xiorInstance.defaults.params['x'] = 1;
  xiorInstance.defaults.headers['Authorization'] = `Bearer ${token}`;
}

function removeUserToken() {
  // delete xiorInstance.defaults.params['x'];
  delete xiorInstance.defaults.headers['Authorization'];
}
```

### Get response headers

```ts
import xior from 'xior';

const xiorInstance = xior.create({
  baseURL: 'https://apiexampledomian.com/api',
});

const { data, headers } = await xiorInstance.get('/');

console.log(headers.get('X-Header-Name'));
```

### Upload file

**xior** supports file uploads using the `FormData` API and provides an optional `'xior/plugins/progress'` plugin for simulating upload progress, usage similar to Axios.

```ts
import Xior from 'xior';
import uploadDownloadProgressPlugin from 'xior/plugins/progress';

const http = Xior.create({});

http.plugins.use(
  uploadDownloadProgressPlugin({
    progressDuration: 5 * 1000,
  })
);

const formData = FormData();
formData.append('file', fileObject);
formData.append('field1', 'val1');
formData.append('field2', 'val2');

http.post('/upload', formData, {
  onUploadProgress(e) {
    console.log(`Upload progress: ${e.progress}%`);
  },
  // progressDuration: 10 * 1000
});
```

### Using interceptors

**xior** supports interceptors similar to Axios, allowing you to modify requests and handle responses programmatically.

Request interceptors:

```ts
import xior, { merge } from 'xior';

const http = xior.create({
  // ...options
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('REQUEST_TOKEN');
  if (!token) return config;

  return merge(config, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
});

// One more inteceptor for request
http.interceptors.request.use((config) => {
  return config;
});
```

Response interceptors:

```ts
import xior, { merge } from 'xior';

const http = xior.create({});

http.interceptors.response.use(
  (result) => {
    const { data, request: config, response: originalResponse } = result;
    return result;
  },
  async (error) => {
    if (error instanceof TypeError) {
      console.log(`Request error:`, error);
    }
    if (error?.response?.status === 401) {
      localStorage.removeItem('REQUEST_TOKEN');
    }
  }
);
```

### Timeout and Cancel request

Timeout:

```ts
import xior from 'xior';

const instance = xior.create({
  timeout: 120 * 1000, // set default timeout
});

await instance.post(
  'http://httpbin.org',
  {
    a: 1,
    b: 2,
  },
  {
    timeout: 60 * 1000, // override default timeout 120 * 1000
  }
);
```

Cancel request:

```ts
import xior from 'xior';
const instance = xior.create();

const controller = new AbortController();

xiorInstance.get('http://httpbin.org', { signal: controller.signal }).then((res) => {
  console.log(res.data);
});

class CancelRequestError extends Error {}
controller.abort(new CancelRequestError()); // abort request with custom error
```

### Encrypt and Decrypt Example

We can use interceptors easily to handle encrypt/decrypt.

Create `encryption.ts`:

```ts
// encryption.ts
export const SECRET = '&*&*^SDxsdasdas776';

export function encrypt(data: string) {
  return data + '____' + SECRET;
}

export function decrypt(data: string, s?: string) {
  return data.replace('____' + (s || SECRET), '');
}
```

Create `xior-instance.ts`:

```ts
import xior from 'xior';

import { SECRET, encrypt, decrypt } from './encryption';

export const instance = xior.create();

instance.interceptors.request.use((req) => {
  req.headers['X'] = SECRET;

  if (req.url && req.data) {
    const result = JSON.stringify(req.data);
    const blob = encrypt(result);
    req.data = { blob };
  }

  return req;
});

instance.interceptors.response.use((res) => {
  if (res.request.url && res.data?.blob) {
    res.data = decrypt(res.data.blob);
    try {
      res.data = JSON.parse(res.data);
    } catch (e) {
      console.error(e);
    }
  }
  return res;
});
```

> Check test code in `tests/src/tests/encrypt-decrypt/`

### Automatically refreshing access token

We can use some plugins and interceptors to achieve this. The flow would be:

1. In response interceptors, check if status code is session expired, we set the new access token from API
2. Then throw error, the error will occur the error retry plugin to retry request with the new access token

> The error retry plugin will not retry with `POST` method request in default.

Example code:

```ts
import axios, { XiorError as AxiosError } from 'xior';
import errorRetryPlugin from 'xior/plugins/error-retry';
import dedupePlugin from 'xior/plugins/dedupe';
import throttlePlugin from 'xior/plugins/throttle';

const http = axios.create({
  baseURL: 'http://localhost:3000',
});
http.plugins.use(errorRetryPlugin());
http.plugins.use(dedupePlugin()); // Prevent same `GET` requests from occurring simultaneously.
http.plugins.use(throttlePlugin()); // Throttle same `GET` request in 1000ms

const TOKEN_EXPIRED_STATUS = 403;
const TOKEN_STORAGE_KEY = 'AUTH_TOKEN';
http.interceptors.request.use((config) => {
  // Get token from localStorage
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers['Authorization'] = 'Bearer ' + token;
  }
  return config;
});

let refreshingToken = false;
const queue: (() => void)[] = [];
http.interceptors.response.use(
  async (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (error.response?.status === TOKEN_EXPIRED_STATUS && token) {
      if (refreshingToken) {
        await new Promise<void>((resolve, reject) => {
          queue.push(resolve);
        });
      } else {
        refreshingToken = true;
        try {
          const { data } = await http.post('/api/new_token', {
            enableDedupe: true, // Use `enableDedupe: true` to enable dedupe request, if is GET method, can ignore
            enableThrottle: true, // Use `enableThrottle: true` to enable throttle request, if is GET method, can ignore
          });
          // Save token
          localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
        } catch (e) {
          // refresh token wrong, remove the old token?
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          throw e;
        } finally {
          refreshingToken = false;
          queue.forEach((r) => r());
        }
        return Promise.reject(new Error('Token expired, new token refreshed, try again!'));
      }
    }
    // If error, will retry on GET method
    return Promise.reject(error);
  }
);
```

Or You can use the plugin from community: [Auth refresh token plugin](#auth-refresh-token-plugin).

### Tips: Make your SSR(Server-side Rendering) app more stable and faster

How we do that? Use the xior's plugins:

1. If `GET` data error, at least have chance to retry;
2. If retry still error, return the cache data(if have) to prevent page crash or show error page;
3. Dedupe the `GET` requests
4. Throttle the `GET` requests
5. Return cache data first and run the fetching data task on the background

Example code:

```ts
import xior, { XiorError as AxiosError } from 'xior';
import errorRetryPlugin from 'xior/plugins/error-retry';
import dedupePlugin from 'xior/plugins/dedupe';
import throttlePlugin from 'xior/plugins/throttle';
import errorCachePlugin from 'xior/plugins/error-cache';

// Setup
const http = axios.create({
  baseURL: 'http://localhost:3000',
});
http.plugins.use(errorRetryPlugin());
http.plugins.use(errorCachePlugin());
http.plugins.use(dedupePlugin()); // Prevent same GET requests from occurring simultaneously.
http.plugins.use(throttlePlugin()); // Throttle same `GET` request in 1000ms

// 1. If `GET` data error, at least have chance to retry;
// 2. If retry still error, return the cache data(if have) to prevent page crash or show error page;
const res = await http.get('/api/get-data'); // these will retry if have error
if (res.fromCache) {
  console.log(`the data from cahce`, res.cacheTime);
}

// 3. Dedupe the same `GET` requests, this will only sent 1 real request
await Promise.all([
  http.get('/api/get-data-2'),
  http.get('/api/get-data-2'),
  http.get('/api/get-data-2'),
]);

// 4. Throttle the `GET` requests,
//    we want throttle some larget data request in 10s, default is 1s
http.get('/api/get-some-big-data', { threshold: 10e3 });

// 5. If have cache data, return the cache data first,
//    and run the real request in background
http.get('/api/get-some-big-data', { threshold: 10e3, useCacheFirst: true });
```

## Plugins

**xior** offers a variety of built-in plugins to enhance its functionality:

- [Error retry plugin](#error-retry-plugin)
- [Request dedupe plugin](#request-dedupe-plugin)
- [Request throttle plugin](#request-throttle-plugin)
- [Error cache plugin](#error-cache-plugin)
- [Cache plugin](#cache-plugin)
- [Upload and download progress plugin](#upload-and-download-progress-plugin)
- [Mock plugin](#Mock-plugin)
- [Auth token refreshing plugin]

Usage:

```ts
import xior from 'xior';
import errorRetryPlugin from 'xior/plugins/error-retry';
import throttlePlugin from 'xior/plugins/throttle';
import cachePlugin from 'xior/plugins/cache';
import uploadDownloadProgressPlugin from 'xior/plugins/progress';

const http = xior.create();

http.plugins.use(errorRetryPlugin());
http.plugins.use(throttlePlugin());
http.plugins.use(cachePlugin());
http.plugins.use(uploadDownloadProgressPlugin());
```

### Error retry plugin

> Retry the failed request with special times

API:

```ts
function errorRetryPlugin(options: {
  retryTimes?: number;
  retryInterval?: number | ((errorCount: number) => number);
  enableRetry?: boolean | (config: XiorRequestConfig, error: XiorError | Error) => boolean | undefined;
  onRetry?: (config: XiorRequestConfig, error: XiorError | Error, count: number) => void;
}): XiorPlugin;
```

The `options` object:

| Param         | Type                                                                                        | Default value                                                | Description                                                                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| retryTimes    | number                                                                                      | 2                                                            | Set the retry times for failed request                                                                                                             |
| retryInterval | number \| ((errorCount: number, config: XiorRequestConfig, error: XiorError) => number)     | 3000                                                         | After first time retry, the next retries interval time, default interval is 3 seconds; you can use function as param to return interval number too |
| enableRetry   | boolean \| ((config: XiorRequestConfig, error: XiorError \| Error) => boolean \| undefined) | (config, error) => config.method === 'GET' \|\| config.isGet | Default only retry if `GET` request error and `retryTimes > 0`                                                                                     |
| onRetry       | boolean \| ((config: XiorRequestConfig, error: XiorError \| Error, count: number) => void)  | undefined                                                    | For log retry info                                                                                                                                 |

Basic usage:

```ts
import xior from 'xior';
import errorRetryPlugin from 'xior/plugins/error-retry';

const http = xior.create();
http.plugins.use(
  errorRetryPlugin({
    retryTimes: 3,
    // retryInterval: 3000,
    retryInterval(count, config, error) {
      // if (error.response?.status === 500) {
      //   return 10e3;
      // }
      return count * 1e3;
    },
    onRetry(config, error, count) {
      console.log(`${config.method} ${config.url} retry ${count} times`);
    },
    // enableRetry(config, error) {
    //   if ([401, 400].includes(error.response?.status)) { // no retry when status is 400 or 401
    //     return false;
    //   }
    //   // no return or return `undefined` here, will reuse the default `enableRetry` logic
    // },
  })
);

// if request error, max retry 3 times until success
http.get('/api1');

// if request error, will not retry, because `retryTimes: 0`
http.get('/api2', { retryTimes: 0 });

// if POST request error, will not retry
http.post('/api1');

// Use `enableRetry: true` to support post method, max retry 5 times until success
http.post('/api1', null, { retryTimes: 5, enableRetry: true });
```

Advance usage:

> The retry key for the unique request generated by use `params` and `data`, if your request depends on `headers`, you can add request interceptor to add headers's value to `params`:

```ts
import xior from 'xior';
import errorRetryPlugin from 'xior/plugins/error-retry';

const http = xior.create();
http.plugins.use(errorRetryPlugin());

http.interceptors.request.use((config) => {
  config.params['___k'] = `${config.headers['x-custom-field'] || ''}`;
  return config;
});
```

Use CDN:

Using jsDelivr CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/xior@0.3.13/dist/xior.umd.js"></script>
<!-- Load plugin -->
<script src="https://cdn.jsdelivr.net/npm/xior@0.3.13/plugins/error-retry.umd.js"></script>

<!-- Usage -->
<script>
  console.log(xior.VERSION);

  xior.plugins.use(xiorErrorRetry());
</script>
```

Using unpkg CDN:

```html
<script src="https://unpkg.com/xior@0.3.13/dist/xior.umd.js"></script>

<!-- Load plugin -->
<script src="https://unpkg.com/xior@0.3.13/plugins/error-retry.umd.js"></script>

<!-- Usage -->
<script>
  console.log(xior.VERSION);

  xior.plugins.use(xiorErrorRetry());
</script>
```

### Request throttle plugin

> Throttle GET requests(or custom) most once per threshold milliseconds, filter repeat requests in certain time.

API:

```ts
function throttleRequestPlugin(options: {
  /** threshold in milliseconds, default: 1000ms */
  threshold?: number;
  /**
   * check if we need enable throttle, default only `GET` method or`isGet: true` enable
   */
  enableThrottle?: boolean | ((config?: XiorRequestConfig) => boolean | undefined);
  throttleCache?: ICacheLike<RecordedCache>;
  onThrottle?: (config: XiorRequestConfig) => void;
  throttleItems?: number;
}): XiorPlugin;
```

The `options` object:

> You can override default value in each request's own config (Except `throttleCache`)

| Param          | Type                                                             | Default value                                         | Description                                                                                |
| -------------- | ---------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| threshold      | number                                                           | 1000                                                  | The number of milliseconds to throttle request invocations to                              |
| enableThrottle | boolean \| ((config: XiorRequestConfig) => boolean \| undefined) | (config) => config.method === 'GET' \|\| config.isGet | Default only enabled in `GET` request                                                      |
| throttleCache  | CacheLike                                                        | lru(100)                                              | CacheLike instance that will be used for storing throttled requests, use `tiny-lru` module |
| throttleItems  | number                                                           | 100                                                   | The max number of throttle items in the default LRU cache                                  |

Basic usage:

```ts
import xior from 'xior';
import throttlePlugin from 'xior/plugins/throttle';

const http = xior.create();
http.plugins.use(
  throttlePlugin({
    onThrottle(config) {
      console.log(`Throttle requests ${config.method} ${config.url}`);
    },
  })
);

http.get('/'); // make real http request
http.get('/'); // response from cache
http.get('/'); // response from cache
http.get('/', { throttle: 2e3 }); // custom throttle to 2 seconds

http.post('/'); // make real http request
http.post('/'); // make real http request
http.post('/'); // make real http request

http.post('/', null, {
  enableThrottle: true,
}); // make real http request
http.post('/', null, {
  enableThrottle: true,
}); // response from cache
http.post('/', null, {
  enableThrottle: true,
}); // response from cache

// make post method as get method use `{isGet: true}`,
// useful when some API is get data but the method is `post`
http.post('/get', null, {
  isGet: true,
}); // make real http request
http.post('/get', null, {
  isGet: true,
}); // response from cache
http.post('/get', null, {
  isGet: true,
}); // response from cache
```

Use CDN:

Using jsDelivr CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/xior@0.3.13/dist/xior.umd.js"></script>
<!-- Load plugin -->
<script src="https://cdn.jsdelivr.net/npm/xior@0.3.13/plugins/throttle.umd.js"></script>

<!-- Usage -->
<script>
  console.log(xior.VERSION);

  xior.plugins.use(xiorThrottle());
</script>
```

Using unpkg CDN:

```html
<script src="https://unpkg.com/xior@0.3.13/dist/xior.umd.js"></script>

<!-- Load plugin -->
<script src="https://unpkg.com/xior@0.3.13/plugins/throttle.umd.js"></script>

<!-- Usage -->
<script>
  console.log(xior.VERSION);

  xior.plugins.use(xiorThrottle());
</script>
```

### Request dedupe plugin

> Prevents having multiple identical requests on the fly at the same time.

API:

```ts
function dedupeRequestPlugin(options: {
  /**
   * check if we need enable dedupe, default only `GET` method or`isGet: true` enable
   */
  enableDedupe?: boolean | ((config?: XiorRequestConfig) => boolean);
  onDedupe?: (config: XiorRequestConfig) => void;
}): XiorPlugin;
```

Basic usage:

```ts
import xior from 'xior';
import dedupePlugin from 'xior/plugins/dedupe';

const http = xior.create();
http.plugins.use(
  dedupePlugin({
    onDedupe(config) {
      console.log(`Dedupe ${config.method} ${config.url}`);
    },
  })
);

http.get('/'); // make real http request
http.get('/'); // response from previous if previous request return response
http.get('/'); // response from previous if previous request return response

http.post('/'); // make real http request
http.post('/'); // make real http request
http.post('/'); // make real http request
```

Use CDN:

Using jsDelivr CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/xior@0.3.13/dist/xior.umd.js"></script>
<!-- Load plugin -->
<script src="https://cdn.jsdelivr.net/npm/xior@0.3.13/plugins/dedupe.umd.js"></script>

<!-- Usage -->
<script>
  console.log(xior.VERSION);

  xior.plugins.use(xiorDedupe());
</script>
```

Using unpkg CDN:

```html
<script src="https://unpkg.com/xior@0.3.13/dist/xior.umd.js"></script>

<!-- Load plugin -->
<script src="https://unpkg.com/xior@0.3.13/plugins/dedupe.umd.js"></script>

<!-- Usage -->
<script>
  console.log(xior.VERSION);

  xior.plugins.use(xiorDedupe());
</script>
```

### Error cache plugin

> When request error, if have cached data then use the cached data

API:

```ts
function errorCachePlugin(options: {
  enableCache?: boolean | ((config?: XiorRequestConfig) => boolean | undefined);
  defaultCache?: ICacheLike<XiorPromise>;
  useCacheFirst?: boolean;
}): XiorPlugin;
```

The `options` object:

| Param         | Type                                                             | Default value                                         | Description                                                                                                                                                                                                                     |
| ------------- | ---------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| enableCache   | boolean \| ((config: XiorRequestConfig) => boolean \| undefined) | (config) => config.method === 'GET' \|\| config.isGet | Default only enabled in `GET` request                                                                                                                                                                                           |
| defaultCache  | CacheLike                                                        | lru(100, 0)                                           | will used for storing requests by default, except you define a custom Cache with your request config, use `tiny-lru` module                                                                                                     |
| useCacheFirst | boolean                                                          | false                                                 | If `useCacheFirst: true` and there's a cache, it will return the cached response first, then run fetching task on the background. This is useful when the response takes a long time, and the data is unnecessary in real-time. |
| cacheItems    | number                                                           | 100                                                   | The max number of error cache items in the default LRU cache                                                                                                                                                                    |

Basic usage:

```ts
import xior from 'xior';
import errorCachePlugin from 'xior/plugins/error-cache';

const http = xior.create();
http.plugins.use(errorCachePlugin({}));

http.get('/users'); // make real http request, and cache the response
const res = await http.get('/users'); // if request error, use the cache data
if (res.fromCache) {
  // if `fromCache` is true, means data from cache!
  console.log('data from cache!');
  console.log('data cache timestamp: ', res.cacheTime);
  // and get what's the error
  console.log('error', res.error);
}

http.post('/users'); // no cache for post

http.post('/users', { isGet: true }); // but with `isGet: true` can let plugins know this is `GET` behavior! then will cache data
```

Use CDN:

Using jsDelivr CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/xior@0.3.13/dist/xior.umd.js"></script>
<!-- Load plugin -->
<script src="https://cdn.jsdelivr.net/npm/xior@0.3.13/plugins/error-cache.umd.js"></script>

<!-- Usage -->
<script>
  console.log(xior.VERSION);

  xior.plugins.use(xiorErrorCache());
</script>
```

Using unpkg CDN:

```html
<script src="https://unpkg.com/xior@0.3.13/dist/xior.umd.js"></script>

<!-- Load plugin -->
<script src="https://unpkg.com/xior@0.3.13/plugins/error-cache.umd.js"></script>

<!-- Usage -->
<script>
  console.log(xior.VERSION);

  xior.plugins.use(xiorErrorCache());
</script>
```

### Cache plugin

> Makes xior cacheable

> Good to Know: Next.js already support cache for fetch in server side. [More detail](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating#fetching-data-on-the-server-with-fetch)

> Different with `error-cache` plugin: this plugin will use the data in cache if the cache data not expired.

API:

```ts
function cachePlugin(options: {
  enableCache?: boolean | ((config?: XiorRequestConfig) => boolean);
  defaultCache?: ICacheLike<XiorPromise>;
  cacheItems?: number;
}): XiorPlugin;
```

The `options` object:

| Param        | Type                                                             | Default value                                         | Description                                                                                                                 |
| ------------ | ---------------------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| enableCache  | boolean \| ((config: XiorRequestConfig) => boolean \| undefined) | (config) => config.method === 'GET' \|\| config.isGet | Default only enabled in `GET` request                                                                                       |
| defaultCache | CacheLike                                                        | lru(100, 1000\*60\*5)                                 | will used for storing requests by default, except you define a custom Cache with your request config, use `tiny-lru` module |
| cacheItems   | number                                                           | 100                                                   | Custom the default LRU cache numbers                                                                                        |
| cacheTime    | number                                                           | 1000 \* 60 \* 5                                       | Custom the default LRU cache time                                                                                           |

Basic usage:

```ts
import xior from 'xior';
import cachePlugin from 'xior/plugins/cache';

const http = xior.create();
http.plugins.use(
  cachePlugin({
    cacheItems: 100,
    cacheTime: 1e3 * 60 * 5,
  })
);

http.get('/users'); // make real http request
http.get('/users'); // get cache from previous request
http.get('/users', { enableCache: false }); // disable cache manually and the real http request

http.post('/users'); // default no cache for post

// enable cache manually in post request
http.post('/users', { enableCache: true }); // make real http request
const res = await http.post('/users', { enableCache: true }); // get cache from previous request
if (res.fromCache) {
  // if `fromCache` is true, means data from cache!
  console.log('data from cache!', res.cacheTime);
}
```

Advanced:

```ts
import xior from 'xior';
import cachePlugin from 'xior/plugins/cache';
import { lru } from 'tiny-lru';

const http = xior.create({
  baseURL: 'https://example-domain.com/api',
  headers: { 'Cache-Control': 'no-cache' },
});
http.plugins.use(
  cachePlugin({
    // disable the default cache
    enableCache: false,
    cacheItems: 1000,
    cacheTime: 1e3 * 60 * 10,
  })
);

http.get('/users', { enableCache: true }); // manually enable cache for this request
http.get('/users', { enableCache: true }); // get cache from  previous request

const cacheA = lru(100);
// a actual request made and cached due to force update configured
http.get('/users', { enableCache: true, defaultCache: cacheA, forceUpdate: true });
```

### Upload and download progress plugin

> Enable upload and download progress like axios, but the progress is simulated,
> This means it doesn't represent the actual progress but offers a user experience similar to libraries like axios.

API:

```ts
function progressPlugin(options: {
  /** default: 5*1000 ms */
  progressDuration?: number;
}): XiorPlugin;
```

The `options` object:

| Param            | Type   | Default value | Description                                          |
| ---------------- | ------ | ------------- | ---------------------------------------------------- |
| progressDuration | number | 5000          | The upload or download progress grow to 99% duration |

Basic usage:

```ts
import xior from 'xior';
import uploadDownloadProgressPlugin from 'xior/plugins/progress';

const http = xior.create({});
http.plugins.use(uploadDownloadProgressPlugin());

const formData = FormData();
formData.append('file', fileObject);
formData.append('field1', 'val1');
formData.append('field2', 'val2');

http.post('/upload', formData, {
  // simulate upload progress to 99% in 10 seconds, default is 5 seconds
  progressDuration: 10 * 1000,
  onUploadProgress(e) {
    console.log(`Upload progress: ${e.progress}%`);
  },
  // onDownloadProgress(e) {
  //   console.log(`Download progress: ${e.progress}%`);
  // },
});
```

Use CDN:

Using jsDelivr CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/xior@0.3.13/dist/xior.umd.js"></script>
<!-- Load plugin -->
<script src="https://cdn.jsdelivr.net/npm/xior@0.3.13/plugins/progress.umd.js"></script>

<!-- Usage -->
<script>
  console.log(xior.VERSION);

  xior.plugins.use(xiorProgress());
</script>
```

Using unpkg CDN:

```html
<script src="https://unpkg.com/xior@0.3.13/dist/xior.umd.js"></script>

<!-- Load plugin -->
<script src="https://unpkg.com/xior@0.3.13/plugins/progress.umd.js"></script>

<!-- Usage -->
<script>
  console.log(xior.VERSION);

  xior.plugins.use(xiorProgress());
</script>
```

### Mock plugin

> This plugin let you eaisly mock requests

Usage:

with `GET`:

```ts
import xior from 'xior';
import MockPlugin from 'xior/plugins/mock';

const instance = xior.create();
const mock = new MockPlugin(instance);

// Mock any GET request to /users
// arguments for reply are (status, data, headers)
mock.onGet('/users').reply(
  200,
  {
    users: [{ id: 1, name: 'John Smith' }],
  },
  {
    'X-Custom-Response-Header': '123',
  }
);

instance.get('/users').then(function (response) {
  console.log(response.data);
  console.log(response.headers.get('X-Custom-Response-Header')); // 123
});

// Mock GET request to /users when param `searchText` is 'John'
// arguments for reply are (status, data, headers)
mock.onGet('/users', { params: { searchText: 'John' } }).reply(200, {
  users: [{ id: 1, name: 'John Smith' }],
});

instance.get('/users', { params: { searchText: 'John' } }).then(function (response) {
  console.log(response.data);
});
```

with `POST`:

```ts
import xior from 'xior';
import MockPlugin from 'xior/plugins/mock';

const instance = xior.create();
const mock = new MockPlugin(instance);

// Mock any POST request to /users
// arguments for reply are (status, data, headers)
mock.onPost('/users').reply(
  200,
  {
    users: [{ id: 1, name: 'John Smith' }],
  },
  {
    'X-Custom-Response-Header': '123',
  }
);

instance.post('/users').then(function (response) {
  console.log(response.data);
  console.log(response.headers.get('X-Custom-Response-Header')); // 123
});

// Mock POST request to /users when param `searchText` is 'John'
// arguments for reply are (status, data, headers)
mock.onPost('/users', null, { params: { searchText: 'John' } }).reply(200, {
  users: [{ id: 1, name: 'John Smith' }],
});

instance.get('/users', null, { params: { searchText: 'John' } }).then(function (response) {
  console.log(response.data);
});

// Mock POST request to /users when body `searchText` is 'John'
// arguments for reply are (status, data, headers)
mock.onPost('/users', { searchText: 'John' }).reply(200, {
  users: [{ id: 1, name: 'John Smith' }],
});

instance.get('/users', { searchText: 'John' }).then(function (response) {
  console.log(response.data);
});
```

**More details**, [check here](./Mock-plugin.md).

Use CDN:

Using jsDelivr CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/xior@0.3.13/dist/xior.umd.js"></script>
<!-- Load plugin -->
<script src="https://cdn.jsdelivr.net/npm/xior@0.3.13/plugins/mock.umd.js"></script>

<!-- Usage -->
<script>
  console.log(xior.VERSION);

  const mock = new xiorMock(xior);
</script>
```

Using unpkg CDN:

```html
<script src="https://unpkg.com/xior@0.3.13/dist/xior.umd.js"></script>

<!-- Load plugin -->
<script src="https://unpkg.com/xior@0.3.13/plugins/mock.umd.js"></script>

<!-- Usage -->
<script>
  console.log(xior.VERSION);

  const mock = new xiorMock(xior);
</script>
```

### Auth refresh token plugin

We will use `xior-auth-refresh` plugin from the community: https://github.com/Audiu/xior-auth-refresh

**Install:**

```sh
npm install xior-auth-refresh --save
# or
yarn add xior-auth-refresh
# or
pnpm add xior-auth-refresh
```

**Usage:**

```ts
import xior from 'xior';
import createAuthRefreshInterceptor from 'xior-auth-refresh';

// Function that will be called to refresh authorization
const refreshAuthLogic = (failedRequest) =>
  xior.post('https://www.example.com/auth/token/refresh').then((tokenRefreshResponse) => {
    localStorage.setItem('token', tokenRefreshResponse.data.token);
    failedRequest.response.config.headers['Authorization'] =
      'Bearer ' + tokenRefreshResponse.data.token;
    return Promise.resolve();
  });

// Instantiate the interceptor
createAuthRefreshInterceptor(xior, refreshAuthLogic);

// Make a call. If it returns a 401 error, the refreshAuthLogic will be run,
// and the request retried with the new token
xior.get('https://www.example.com/restricted/area').then(/* ... */).catch(/* ... */);
```

More: https://github.com/Audiu/xior-auth-refresh

### Create your own custom plugin

**xior** let you easily to create custom plugins.

Here are examples:

1. Simple Logging plugin:

```ts
import xior from 'xior';

const instance = xior.create();
instance.plugins.use(function logPlugin(adapter, instance) {
  return async (config) => {
    const start = Date.now();
    const res = await adapter(config);
    console.log('%s %s %s take %sms', config.method, config.url, res.status, Date.now() - start);
    return res;
  };
});
```

2. Check built-in plugins get more inspiration:

Check [src/plugins](./src/plugins)

## Helper functions

**xior** has built-in helper functions, may useful for you:

```ts
import lru from 'tiny-lru';
import {
  encodeParams,
  merge as deepMerge,
  delay as sleep,
  buildSortedURL,
  isAbsoluteURL,
  joinPath,
  isXiorError,
} from 'xior';
```

## FAQ

**xior** frequently asked questions.

### 1. Is **xior** 100% compatiable with `axios`?

**No**, but **xior** offers a similar API like axios: `axios.create` / `axios.interceptors` / `.get/post/put/patch/delete/head/options`.

### 2. Can I use xior in projects like Bun, Expo, React Native, RemixJS, Next.js, Vue, or Nuxt.js?

**Yes**, **xior** works anywhere where the native `fetch` API is supported.
Even if the environment doesn't support `fetch`, you can use a `fetch` polyfill like for older browsers.

### 3. How do I handle responses with types like `'stream'`, `'document'`, `'arraybuffer'`, or `'blob'`?

> Currently in `xior`, when `responseType` is set to `'stream', 'document', 'arraybuffer', 'blob', or 'original'`, Xior will return the original fetch response.

```ts
fetch('https://exmaple.com/some/api').then((response) => {
  console.log(response);
});

// same with
xior.get('https://exmaple.com/some/api', { responseType: 'blob' }).then((res) => {
  console.log(res.response); // res.data will be undefined
});
```

And to handle a stream response, use the `responseType: 'stream'` option in your request, then do something with the `response` as `fetch` does:

```ts
import xior from 'xior';

const http = xior.create({ baseURL });

const { response } = await http.post<{ file: any; body: Record<string, string> }>(
  '/stream/10',
  null,
  { responseType: 'stream' }
);
const reader = response.body!.getReader();
let chunk;
for await (chunk of readChunks(reader)) {
  console.log(`received chunk of size ${chunk.length}`);
}
```

### 5. How do I support older browsers?

You can use a polyfill for the `fetch` API. Check the file `src/tests/polyfill.test.ts` for a potential example.

### 6. Why is xior named "xior"?

The original name `axior` was unavailable on npm, so when removed the "a": ~~a~~**xior**.

### 7. Where can I ask additional questions?

If you have any questions, feel free to create issues.

## Migrate from `axios` to **xior**

### GET

axios:

```ts
import axios from 'axios';

// Make a request for a user with a given ID
axios
  .get('/user?ID=12345')
  .then(function (response) {
    // handle success
    console.log(response);
  })
  .catch(function (error) {
    // handle error
    console.log(error);
  })
  .finally(function () {
    // always executed
  });

// Optionally the request above could also be done as
axios
  .get('/user', {
    params: {
      ID: 12345,
    },
  })
  .then(function (response) {
    console.log(response);
  })
  .catch(function (error) {
    console.log(error);
  })
  .finally(function () {
    // always executed
  });

// Want to use async/await? Add the `async` keyword to your outer function/method.
async function getUser() {
  try {
    const response = await axios.get('/user?ID=12345');
    console.log(response);
  } catch (error) {
    console.error(error);
  }
}
```

xior:

```ts
import axios from 'xior';

// Make a request for a user with a given ID
axios
  .get('/user?ID=12345')
  .then(function (response) {
    // handle success
    console.log(response);
  })
  .catch(function (error) {
    // handle error
    console.log(error);
  })
  .finally(function () {
    // always executed
  });

// Optionally the request above could also be done as
axios
  .get('/user', {
    params: {
      ID: 12345,
    },
  })
  .then(function (response) {
    console.log(response);
  })
  .catch(function (error) {
    console.log(error);
  })
  .finally(function () {
    // always executed
  });

// Want to use async/await? Add the `async` keyword to your outer function/method.
async function getUser() {
  try {
    const response = await axios.get('/user?ID=12345');
    console.log(response);
  } catch (error) {
    console.error(error);
  }
}
```

### POST

axios:

```ts
import axios from 'axios';

axios
  .post('/user', {
    firstName: 'Fred',
    lastName: 'Flintstone',
  })
  .then(function (response) {
    console.log(response);
  })
  .catch(function (error) {
    console.log(error);
  });
```

xior:

```ts
import axios from 'xior';

axios
  .post('/user', {
    firstName: 'Fred',
    lastName: 'Flintstone',
  })
  .then(function (response) {
    console.log(response);
  })
  .catch(function (error) {
    console.log(error);
  });
```

### `axios(requestObj)`: axios({ method: 'get', params: { a: 1 } })

axios:

```ts
import axios from 'axios';

await axios({ method: 'get', params: { a: 1 } });
```

xior:

```ts
import xior from 'xior';

const axios = xior.create();

await axios.request({ method: 'get', params: { a: 1 } });
```

### Creating an instance

axios:

```ts
import axios from 'axios';
const instance = axios.create({
  baseURL: 'https://some-domain.com/api/',
  timeout: 1000,
  headers: { 'X-Custom-Header': 'foobar' },
});
```

xior:

```ts
import axios from 'xior';
const instance = axios.create({
  baseURL: 'https://some-domain.com/api/',
  timeout: 1000,
  headers: { 'X-Custom-Header': 'foobar' },
});
```

### Get response headers

axios:

```ts
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://apiexampledomian.com/api',
});

const { data, headers } = await axiosInstance.get('/');

console.log(headers['X-Header-Name']);
```

xior:

```ts
import xior from 'xior';

const xiorInstance = xior.create({
  baseURL: 'https://apiexampledomian.com/api',
});

const { data, headers } = await xiorInstance.get('/');

console.log(headers.get('X-Header-Name'));
```

### Download file with `responseType: 'stream' | 'blob'`

axios:

```ts
import axios from 'axios';
import fs from 'fs';

// GET request for remote image in Node.js
axios({
  method: 'get',
  url: 'https://bit.ly/2mTM3nY',
  responseType: 'stream',
}).then(function (response) {
  response.data.pipe(fs.createWriteStream('ada_lovelace.jpg'));
});

// For browser
axios({
  method: 'get',
  url: 'https://bit.ly/2mTM3nY',
  responseType: 'blob',
}).then(function (response) {
  // create file link in browser's memory
  const href = URL.createObjectURL(response.data);

  // create "a" HTML element with href to file & click
  const link = document.createElement('a');
  link.href = href;
  link.setAttribute('download', 'file.pdf'); //or any other extension
  document.body.appendChild(link);
  link.click();

  // clean up "a" element & remove ObjectURL
  document.body.removeChild(link);
  URL.revokeObjectURL(href);
});
```

xior:

```ts
// Node.js
import xior from 'xior';
const axios = xior.create();

axios
  .get('https://bit.ly/2mTM3nY', {
    responseType: 'stream',
  })
  .then(async function ({ response, config }) {
    const buffer = Buffer.from(await response.arrayBuffer());
    return writeFile('ada_lovelace.jpg', buffer);
  });

// For browser
xior
  .get('https://d2l.ai/d2l-en.pdf', {
    headers: {
      Accept: 'application/pdf',
    },
    responseType: 'blob',
  })
  .then((res) => res.response.blob())
  .then((blob) => {
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'filename.pdf';
    document.body.appendChild(a); // we need to append the element to the dom -> otherwise it will not work in firefox
    a.click();
    a.remove(); //afterwards we remove the element again
  });
```

### Use stream

axios:

```ts
import axios from 'axios';
import { Readable } from 'stream';

const http = axios.create();

async function getStream(url: string, params: Record<string, any>) {
  const { data } = await http.get(url, {
    params,
    responseType: 'stream',
  });
  return data;
}
```

xior:

```ts
import axxios from 'xior';
import { Readable } from 'stream';

const http = axios.create();

async function getStream(url: string, params: Record<string, any>) {
  const { response } = await http.get(url, {
    params,
    responseType: 'stream',
  });
  const stream = convertResponseToReadable(response);
  return stream;
}

function convertResponseToReadable(response: Response): Readable {
  const reader = response.body.getReader();
  return new Readable({
    async read() {
      const { done, value } = await reader.read();
      if (done) {
        this.push(null);
      } else {
        this.push(Buffer.from(value));
      }
    },
  });
}
```

## Migrate from `fetch` to **xior**

### GET

fetch:

```ts
async function logMovies() {
  const response = await fetch('http://example.com/movies.json?page=1&perPage=10');
  const movies = await response.json();
  console.log(movies);
}
```

xior:

```ts
import xior from 'xior';

const http = xior.create({
  baseURL: 'http://example.com',
});
async function logMovies() {
  const { data: movies } = await http.get('/movies.json', {
    params: {
      page: 1,
      perPage: 10,
    },
  });
  console.log(movies);
}
```

### POST

fetch:

```ts
// Example POST method implementation:
async function postData(url = '', data = {}) {
  // Default options are marked with *
  const response = await fetch(url, {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, *cors, same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, *same-origin, omit
    headers: {
      'Content-Type': 'application/json',
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: JSON.stringify(data), // body data type must match "Content-Type" header
  });
  return response.json(); // parses JSON response into native JavaScript objects
}

postData('https://example.com/answer', { answer: 42 }).then((data) => {
  console.log(data); // JSON data parsed by `data.json()` call
});
```

xior:

```ts
import xior from 'xior';

const http = xior.create({
  baseURL: 'http://example.com',
});

http
  .post(
    '/answer',
    { answer: 42 },
    {
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json',
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: 'follow', // manual, *follow, error
      referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    }
  )
  .then(({ data }) => {
    console.log(data);
  });
```

### Abort a fetch

fetch:

```ts
const controller = new AbortController();
const signal = controller.signal;
const url = 'video.mp4';

const downloadBtn = document.querySelector('#download');
const abortBtn = document.querySelector('#abort');

downloadBtn.addEventListener('click', async () => {
  try {
    const response = await fetch(url, { signal });
    console.log('Download complete', response);
  } catch (error) {
    console.error(`Download error: ${error.message}`);
  }
});

abortBtn.addEventListener('click', () => {
  controller.abort();
  console.log('Download aborted');
});
```

xior:

```ts
import xior from 'xior';

const http = xior.create();

const controller = new AbortController();
const signal = controller.signal;
const url = 'video.mp4';

const downloadBtn = document.querySelector('#download');
const abortBtn = document.querySelector('#abort');

downloadBtn.addEventListener('click', async () => {
  try {
    const response = await http.get(url, { signal });
    console.log('Download complete', response);
  } catch (error) {
    console.error(`Download error: ${error.message}`);
  }
});

abortBtn.addEventListener('click', () => {
  controller.abort();
  console.log('Download aborted');
});
```

### Sending a request with credentials included

fetch:

```ts
fetch('https://example.com', {
  credentials: 'include',
});
```

xior:

```ts
import xior from 'xior';

const http = xior.create();

http.get('https://example.com', {
  credentials: 'include',
});
```

### Uploading a file

fetch:

```ts
async function upload(formData) {
  try {
    const response = await fetch('https://example.com/profile/avatar', {
      method: 'PUT',
      body: formData,
    });
    const result = await response.json();
    console.log('Success:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

const formData = new FormData();
const fileField = document.querySelector('input[type="file"]');

formData.append('username', 'abc123');
formData.append('avatar', fileField.files[0]);

upload(formData);
```

xior:

```ts
import xior from 'xior';

const http = xior.create({
  baseURL: 'https://example.com',
});

async function upload(formData) {
  try {
    const { data: result } = await http.put('/profile/avatar', formData);
    console.log('Success:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

const formData = new FormData();
const fileField = document.querySelector('input[type="file"]');

formData.append('username', 'abc123');
formData.append('avatar', fileField.files[0]);

upload(formData);
```

### Processing a text file line by line

fetch:

```ts
async function* makeTextFileLineIterator(fileURL) {
  const utf8Decoder = new TextDecoder('utf-8');
  const response = await fetch(fileURL);
  const reader = response.body.getReader();
  let { value: chunk, done: readerDone } = await reader.read();
  chunk = chunk ? utf8Decoder.decode(chunk) : '';

  const newline = /\r?\n/gm;
  let startIndex = 0;
  let result;

  while (true) {
    const result = newline.exec(chunk);
    if (!result) {
      if (readerDone) break;
      const remainder = chunk.substr(startIndex);
      ({ value: chunk, done: readerDone } = await reader.read());
      chunk = remainder + (chunk ? utf8Decoder.decode(chunk) : '');
      startIndex = newline.lastIndex = 0;
      continue;
    }
    yield chunk.substring(startIndex, result.index);
    startIndex = newline.lastIndex;
  }

  if (startIndex < chunk.length) {
    // Last line didn't end in a newline char
    yield chunk.substr(startIndex);
  }
}

async function run() {
  for await (const line of makeTextFileLineIterator(urlOfFile)) {
    processLine(line);
  }
}

run();
```

xior:

> Good to Know: add `{responseType: 'stream'}` options will tell xior no need process response, and return original response in format `{response}`

```ts
import xior from 'xior';

const http = xior.create();

async function* makeTextFileLineIterator(fileURL) {
  const utf8Decoder = new TextDecoder('utf-8');
  const { response } = await http.get(fileURL, { responseType: 'stream' });
  const reader = response.body.getReader();
  let { value: chunk, done: readerDone } = await reader.read();
  chunk = chunk ? utf8Decoder.decode(chunk) : '';

  const newline = /\r?\n/gm;
  let startIndex = 0;
  let result;

  while (true) {
    const result = newline.exec(chunk);
    if (!result) {
      if (readerDone) break;
      const remainder = chunk.substr(startIndex);
      ({ value: chunk, done: readerDone } = await reader.read());
      chunk = remainder + (chunk ? utf8Decoder.decode(chunk) : '');
      startIndex = newline.lastIndex = 0;
      continue;
    }
    yield chunk.substring(startIndex, result.index);
    startIndex = newline.lastIndex;
  }

  if (startIndex < chunk.length) {
    // Last line didn't end in a newline char
    yield chunk.substr(startIndex);
  }
}

async function run() {
  for await (const line of makeTextFileLineIterator(urlOfFile)) {
    processLine(line);
  }
}

run();
```

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=suhaotian/xior&type=Date)](https://star-history.com/#suhaotian/xior&Date)

## Thanks

Without the support of these resources, xior wouldn't be possible:

- [axios](https://github.com/axios/axios)
- [axios-extensions](https://github.com/kuitos/axios-extensions)
- [axios-mock-adapter](https://github.com/ctimmerm/axios-mock-adapter)
- [ts-deepmerge](https://github.com/voodoocreation/ts-deepmerge)
- [tiny-lru](https://github.com/avoidwork/tiny-lru)
- [bunchee](https://github.com/huozhi/bunchee)
- [fetch MDN docs](https://developer.mozilla.org/en-US/docs/Web/API/fetch)
