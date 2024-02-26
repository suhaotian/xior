[![Build](https://github.com/suhaotian/xior/actions/workflows/check.yml/badge.svg)](https://github.com/suhaotian/xior/actions/workflows/check.yml)
[![codecov](https://codecov.io/gh/suhaotian/xior/graph/badge.svg?token=MQBCJQ1AU8)](https://codecov.io/gh/suhaotian/xior)
[![minzipped size](https://badgen.net/badge/gzip/2.6kb/green)](https://bundlephobia.com/package/xior)
[![npm version](https://badgen.net/npm/v/xior?color=green)](https://www.npmjs.com/package/xior)
![Downloads](https://img.shields.io/npm/dm/xior.svg?style=flat)
![typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label&color=blue)
![license](https://badgen.net/npm/license/xior?color=blue)

## Intro

A request lib based on **fetch** with plugins support.

**Features:**

- 🔥 Use **fetch**
- 🫡 **Similar axios API**: `axios.create` / `axios.interceptors` / `.get/post/put/patch/delete/head/options`
- 🤙 Support timeout and cancel requests
- 🥷 Plugin support: error retry, cache, throttling, and easily create custom plugins 😎
- 🚀 Lightweight (~6KB, Gzip ~2.6KB)
- 👊 Unit tested and strongly typed 💪

## Table of Contents

- [Intro](#intro)
- [Table of Contents](#table-of-contents)
- [Why Choose **xior**?](#why-choose-xior)
  - [Why Not Just Use `axios`?](#why-not-just-use-axios)
  - [Why Choose **xior** Over Custom Fetch Wrappers?](#why-choose-xior-over-custom-fetch-wrappers)
- [Getting Started](#getting-started)
  - [Installing](#installing)
  - [Create instance](#create-instance)
  - [GET / POST / DELETE / PUT / PATCH / OPTIONS / HEAD](#get--post--delete--put--patch--options--head)
  - [Supporting Nested Object Parameters](#supporting-nested-object-parameters)
  - [Uploading Files](#uploading-files)
  - [Using Interceptors](#using-interceptors)
  - [Timeout and Cancel request](#timeout-and-cancel-request)
- [Plugins](#plugins)
  - [Error retry plugin](#error-retry-plugin)
  - [Request throttle plugin](#request-throttle-plugin)
  - [Cache plugin](#cache-plugin)
  - [Upload and download progress plugin](#upload-and-download-progress-plugin)
  - [Custom your own plugins](#custom-your-own-plugins)
- [Helper functions](#helper-functions)
- [FAQ](#faq)
  - [Is **xior** 100% compatiable with `axios`?](#is-xior-100-compatiable-with-axios)
  - [Can I use **xior** inside expo/react-native/next.js/vue/nuxt.js projects?](#can-i-use-xior-inside-exporeact-nativenextjsvuenuxtjs-projects)
  - [What about response of `'stream' | 'document' | 'arraybuffer' | 'blob'`?](#what-about-response-of-stream--document--arraybuffer--blob)
  - [How to support nested object params in url encode?](#how-to-support-nested-object-params-in-url-encode)
  - [How to support old browser?](#how-to-support-old-browser)
  - [Why named **xior**?](#why-named-xior)
  - [More questions](#more-questions)
- [Migrate from `axios` to **xior**](#migrate-from-axios-to-xior)
  - [GET](#get)
  - [POST](#post)
  - [Creating an instance](#creating-an-instance)
  - [Download file with `responseType: 'stream'`](#download-file-with-responsetype-stream)
- [Migrate from `fetch` to **xior**](#migrate-from-fetch-to-xior)
  - [GET](#get-1)
  - [POST](#post-1)
  - [Abort a fetch](#abort-a-fetch)
  - [Sending a request with credentials included](#sending-a-request-with-credentials-included)
  - [Uploading a file](#uploading-a-file)
  - [Processing a text file line by line](#processing-a-text-file-line-by-line)
- [Thanks 🙌](#thanks-)

## Why Choose **xior**?

**xior** use the native **fetch API**, offering several advantages:

- **Web Standard:** Fetch is a widely supported web standard, ensuring compatibility across different environments.
- **Built-in Availability:** Both Node.js and browsers have built-in fetch implementations, eliminating the need for external dependencies.
- **Edge Compatibility:** Unlike Axios, xior works seamlessly in edge runtimes, making it suitable for serverless functions and Next.js middleware.
- **Convenient API and Plugin Support:** xior provides a familiar API similar to Axios, while also offering plugin support for customization and extending functionalities.

### Why Not Just Use `axios`?

While popular and convenient, Axios currently lacks native edge runtime support (see: [https://github.com/axios/axios/issues/5523](https://github.com/axios/axios/issues/5523)). This can be an issue for specific use cases like Next.js serverless functions and middleware files, where fetch offers built-in caching and revalidation mechanisms (see: [https://nextjs.org/docs/app/api-reference/functions/fetch](https://nextjs.org/docs/app/api-reference/functions/fetch)).

### Why Choose **xior** Over Custom Fetch Wrappers?

While you can certainly create your own wrapper library around fetch, **xior** offers a pre-built solution with a familiar API, plugin support for extensibility, and potentially a more streamlined development experience.

## Getting Started

### Installing

```sh
# npm
npm install xior

# pnpm
pnpm add xior

# yarn
yarn add xior
```

### Create instance

```ts
import Xior from 'xior';

export const http = Xior.create({
  baseURL: 'https://apiexampledomian.com/api',
  headers: {
    // put your common custom headers here
  },
});
```

### GET / POST / DELETE / PUT / PATCH / OPTIONS / HEAD

GET

> `HEAD` method is same usage with `GET`

```ts
async function run() {
  const { data } = await http.get('/');

  // with params
  const { data: data2 } = await http.get('/', { params: { a: 1, b: 2 } });

  // with headers
  const { data: data3 } = await http.get('/', {
    params: { a: 1, b: 2 },
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
  });

  // types
  const { data: data4 } = await http.get<{ field1: string; field2: number }>('/');
}
```

POST

> `DELETE`/`PUT`/`PATCH`/`OPTIONS` methods are same usage with `POST`

```ts
async function run() {
  const { data: data3 } = await http.post<{ field1: string; field2: number }>(
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

### Supporting Nested Object Parameters

**xior's** default URI encoding implementation might not handle nested objects or arrays within the `params` option, resulting in unexpected output like `[object object]`.
To properly support nested object parameters, you can use the `qs` library's `stringify` module:

```ts
import xior from 'xior';
import { stringify } from 'qs'; // Assuming proper import path

const http = xior.create({
  encode: (params: Record<string, any>) => stringify(params),
});

http.get('[http://httpbin.org](http://httpbin.org)', {
  params: {
    a: 1,
    b: {
      c: 2,
    },
  },
});

// Expected URL: [http://httpbin.org?a=1&b](http://httpbin.org?a=1&b)[c]=2
```

### Uploading Files

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

### Using Interceptors

**xior** supports interceptors similar to Axios, allowing you to modify requests and handle responses programmatically.

Request inteceptors:

```ts
import xior, { merge } from 'xior';

const http = xior.create({
  // ...options
});

http.inteceptors.request.use((config) => {
  const token = localStorage.getItem('REQUEST_TOKEN');
  if (!token) return config;

  return merge(config, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
});

// One more inteceptor for request
http.inteceptors.request.use((config) => {
  return config;
});
```

Response inteceptors:

```ts
import xior, { merge } from 'xior';

const http = xior.create({});

http.inteceptors.response.use(
  (result) => {
    const { data, request: config, response: originalResponse } = result;
    return result;
  },
  async (error) => {
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

## Plugins

**xior** offers a variety of built-in plugins to enhance its functionality:

- [Error retry plugin](#error-retry-plugin)
- [Request throttle plugin](#request-throttle-plugin)
- [Cache plugin](#cache-plugin)
- [Upload and download progress plugin](#upload-and-download-progress-plugin)

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
  retryInterval?: number;
  enableRetry?: boolean | (error: Xiorconfig, error: XiorRequestConfig) => boolean;
}): XiorPlugin;
```

The `options` object:

| Param         | Type                                                                   | Default value                              | Description                                                                           |
| ------------- | ---------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------- |
| retryTimes    | number                                                                 | 2                                          | Set the retry times for failed request                                                |
| retryInterval | number                                                                 | 3000                                       | After first time retry, the next retries interval time, default interval is 3 seconds |
| enableRetry   | boolean \| ((config: Xiorconfig, error: XiorRequestConfig) => boolean) | (config, error) => config.method === 'GET' | Default only retry if `GET` request error and `retryTimes > 0`                        |

Basic usage:

```ts
import xior from 'xior';
import errorRetryPlugin from 'xior/plugins/error-retry';

const http = xior.create();
http.plugins.use(
  errorRetryPlugin({
    retryTimes: 3,
    retryInterval: 3000,
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

### Request throttle plugin

> Throttle GET requests(or custom) most once per threshold milliseconds, filter repeat requests in certain time.

API:

```ts
function throttleRequestPlugin(options: {
  /** threshold in milliseconds, default: 1000ms */
  threshold?: number;
  /**
   * check if we need enable throttle, default only `GET` method enable
   */
  enableThrottle?: boolean | ((config?: XiorRequestConfig) => boolean);
  throttleCache?: ICacheLike<RecordedCache>;
}): XiorPlugin;
```

The `options` object:

> You can override default value in each request's own config (Except `throttleCache`)

| Param          | Type                                         | Default value                       | Description                                                                                |
| -------------- | -------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------ |
| threshold      | number                                       | 1000                                | The number of milliseconds to throttle request invocations to                              |
| enableThrottle | boolean \| ((config: Xiorconfig) => boolean) | (config) => config.method === 'GET' | Default only enabled in `GET` request                                                      |
| throttleCache  | CacheLike                                    | lru(10)                             | CacheLike instance that will be used for storing throttled requests, use `tiny-lru` module |

Basic usage:

```ts
import xior from 'xior';
import throttlePlugin from 'xior/plugins/throttle';

const http = xior.create();
http.plugins.use(throttlePlugin());

http.get('/'); // make real http request
http.get('/'); // response from cache
http.get('/'); // response from cache

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
```

### Cache plugin

> Makes xior cacheable

> Good to know: Next.js already support cache for fetch in server side. [More detail](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating#fetching-data-on-the-server-with-fetch)

API:

```ts
function cachePlugin(options: {
  enableCache?: boolean | ((config?: XiorRequestConfig) => boolean);
  defaultCache?: ICacheLike<XiorPromise>;
}): XiorPlugin;
```

The `options` object:

| Param        | Type                                         | Default value                       | Description                                                                                                                 |
| ------------ | -------------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| enableCache  | boolean \| ((config: Xiorconfig) => boolean) | (config) => config.method === 'GET' | Default only enabled in `GET` request                                                                                       |
| defaultCache | CacheLike                                    | lru(100, 1000\*60\*5)               | will used for storing requests by default, except you define a custom Cache with your request config, use `tiny-lru` module |

Basic usage:

```ts
import xior from 'xior';
import cachePlugin from 'xior/plugins/cache';

const http = xior.create();
http.plugins.use(cachePlugin());

http.get('/users'); // make real http request
http.get('/users'); // get cache from previous request
http.get('/users', { enableCache: false }); // disable cache manually and the the real http request

http.post('/users'); // default no cache for post

// enable cache manually in post request
http.post('/users', { enableCache: true }); // make real http request
http.post('/users', { enableCache: true }); // get cache from previous request
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
  })
);

http.get('/users', { enableCache: true }); // manually enable cache for this request
http.get('/users', { enableCache: true }); // get cache from  previous request

const cacheA = lru(100);
// a actual request made and cached due to force update configured
http.get('/users', { enableCache: true, defaultCache: cacheA, forceUpdate: true });
```

### Upload and download progress plugin

> Makes fetch support upload and download progress like axios, but it's simulated.

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
  onUploadProgress(e) {
    console.log(`Upload progress: ${e.progress}%`);
  },
  progressDuration: 10 * 1000, // simulate upload progress to 99% in 10 seconds, default is 5 seconds
});
```

### Custom your own plugins

**xior** empowers you with the flexibility to create custom plugins for tailored request functionalities. Here are examples:

1. Simple Logging Plugin:

```ts
import xior from 'xior';

const instance = xior.create();
instance.plugins.use(function logPlugin(adapter) {
  return async (config) => {
    const start = Date.now();
    const res = await adapter(config);
    console.log('%s %s %s take %sms', config.method, config.url, res.status, Date.now() - start);
    return res;
  };
});
```

2. Nested Object Parameter Detection Plugin:

```ts
import xior from 'xior';

const instance = xior.create();
instance.plugins.use(function detectNestedParamsPlugin(adapter) {
  instance.plugins.use(function detectNestedParamsPlugin(adapter) {
    const o = encodeURIComponent('[object Object]');
    return async (config) => {
      if (config._url?.includes(o) || config._url?.includes('[object Object]')) {
        return Promise.reject(
          new Error('You have nested object params, use `qs.stringify` to support that')
        );
      }
      return adapter(config);
    };
  });
});
```

## Helper functions

**xior** offers built-in helper functions to streamline various tasks:

```ts
import lru from 'tiny-lru';
import {
  encode as liteParamsEncode,
  merge as deepMerge,
  delay as sleep,
  buildSortedURL,
  isAbsoluteURL,
} from 'xior';
```

## FAQ

**xior** frequently asked questions.

### Is **xior** 100% compatiable with `axios`?

No. But similiar axios API: `axios.create` / `axios.interceptors` / `.get/post/put/patch/delete/head/options`.

### Can I use **xior** inside expo/react-native/next.js/vue/nuxt.js projects?

**xior** just built on top of `fetch`, you can use **xior** where fetch was supported, or use fetch polyfill for old browsers.

### What about response of `'stream' | 'document' | 'arraybuffer' | 'blob'`?

Use `{responseType: 'stream'}`, **xior** will just the original response, for example:

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

### How to support nested object params in url encode?

Check [Support nested object params](#support-nested-object-params)

### How to support old browser?

Use polyfill, check `src/tests/polyfill.test.ts`.

### Why named **xior**?

The original name would be `axior`, but npm not allowed that, so I try removed `a`: ~~a~~**xior**.

### More questions

Create issues to let me know, Thank you :)

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
import xior from 'xior';
// or import { xior } from 'xior';

const axios = xior.create();

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
import xior from 'xior';
// or import { xior } from 'xior';

const axios = xior.create();

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

### Download file with `responseType: 'stream'`

axios:

```ts
import axios from 'axios';

// GET request for remote image in node.js
axios({
  method: 'get',
  url: 'https://bit.ly/2mTM3nY',
  responseType: 'stream',
}).then(function (response) {
  response.data.pipe(fs.createWriteStream('ada_lovelace.jpg'));
});
```

xior:

```ts
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

> Add `{responseType: 'stream'}` will tell xior no need process response, and return original response in format `{response}`

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

> Add `{responseType: 'stream'}` will tell xior no need process response, and return original response in format `{response}`

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

## Thanks 🙌

Without these stuff's inspiration and help, **xior** will not exist:

- [axios](https://github.com/axios/axios)
- [axios-extensions](https://github.com/kuitos/axios-extensions)
- [ts-deepmerge](https://github.com/voodoocreation/ts-deepmerge)
- [tiny-lru](https://github.com/avoidwork/tiny-lru)
- [bunchee](https://github.com/huozhi/bunchee)
- [fetch MDN docs](https://developer.mozilla.org/en-US/docs/Web/API/fetch)
