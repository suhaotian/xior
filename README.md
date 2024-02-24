[![Build](https://github.com/suhaotian/xior/actions/workflows/check.yml/badge.svg)](https://github.com/suhaotian/xior/actions/workflows/check.yml)
[![npm version](https://badgen.net/npm/v/xior?color=green)](https://www.npmjs.com/package/xior)
[![minzipped size](https://badgen.net/badge/gzip/2.6kb/green)](https://bundlephobia.com/package/xior)
[![tree shaking](https://badgen.net/bundlephobia/tree-shaking/xior)](https://bundlephobia.com/package/xior)
![typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label&color=blue)
[![dependency](https://badgen.net/bundlephobia/dependency-count/xior)](https://bundlephobia.com/package/xior)
![license](https://badgen.net/npm/license/xior?color=blue)

# Xior

An axios similar API request library but use fetch, and more.

Features:

- 🫡 Similiar `axios.create` / `axios.interceptors.request.use` / `axios.interceptors.response.use` / `.get/post/put/patch/delete/head/options`
- 🔥 Use fetch [why `fetch` instead of `axios`?](#why-use-xior)
- 🚀 Lightweight ~6KB, Gzip ~2.6KB
- 🤙 Support timeout and cancel request
- 👊 Unit tests
- 💪 100% Write in TypeScript
- [ ] **❗️❗️❗️WIP** 🥷 Plugins support: error retry, cache, repeat requests filter plugins 😎

## Getting Started

Install

```bash
npm i xior
```

Quick start

```ts
import xior from 'xior';

const http = xior.create({ baseURL: 'https://exmaple.com', timeout: 120 * 1000 });

http.interceptors.request.use((config) => {
  // do something
  return config;
});

http.interceptors.response.use((result) => {
  const { config, response, data } = result;
  // do something
  return result;
});

// GET
async function getList() {
  const { data } = await http.get('/list', { params: { page: 1, perPage: 20 } });
  return data;
}

// POST
async function create() {
  const { data } = await http.post(
    '/create',
    { name: 'test', desc: 'foobar..foobar' },
    { params: { redirect: '/list' } }
  );
  return data;
}
```

## Usage

### GET / POST

```ts
import xior from 'xior';

const instance = xior.create({});

await instance.get('http://httpbin.org', {
  params: {
    a: 1,
    b: 2,
  },
});

await instance.post('http://httpbin.org', {
  a: 1,
  b: 2,
});
```

### URL encode support nested objects

In **xior**, URI encoded strings default use lite encode, means if your `params` is nested object, it will be `[object object]`:

```ts
import xior from 'xior';

const instance = xior.create({});
instance.get('http://httpbin.org', {
  params: {
    a: 1,
    b: {
      c: 2,
    },
  },
});
```

The final request url will be like: `http://httpbin.org?a=1&b=[object object]`, so we need use `qs`'s `stringify` module to support nested objects url encoded:

```ts
import xior from 'xior';
// @ts-ignore
import stringify from 'qs/lib/stringify';

const instance = xior.create({
  encode: (params: Record<string, any>) => stringify(params),
});
instance.get('http://httpbin.org', {
  params: {
    a: 1,
    b: {
      c: 2,
    },
  },
});

// http://httpbin.org?a=1&b[c]=2
```

### Upload file

> Not like axios, xior doesn't support upload progess or download progress.

Use FormData to upload files.

```ts
import xior from 'xior';

const instance = xior.create();

const formData = new FormData();

formData.append('file', fileObject);
formData.append('filed1', 'val1');
formData.append('filed2', 'val2');

instance.post('/upload', formData).then((res) => {
  console.log(res.data);
});
```

### Timeout

```ts
import xior from 'xior';

const instance = xior.create({
  timeout: 120 * 1000, // default timeout
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

### Cancel request

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

### xior.interceptors.request.use

```ts
import xior, { merge as deepMerge } from 'xior';

const instance = xior.create();
instance.interceptors.request.use((config) => {
  return deepMerge(config, {
    headers: {
      token: localStorage.getItem('token') || '',
    },
  });
});
```

### xior.interceptors.response.use

```ts
import xior, { merge as deepMerge } from 'xior';

const instance = xior.create();
instance.interceptors.response.use(
  (res) => {
    const { data, request, response } = res;
    console.log(request, resposne, data);
    return res;
  },
  function onRejected(error) {
    throw error;
  }
);
```

### stream

> if the options `responseType` is `responseType: 'stream' | 'document' | 'arraybuffer' | 'blob'`, then xior will just return the original response: `{ response }`, you can do anthing with response you like:

```ts
import xior, { merge as deepMerge } from 'xior';
const instance = xior.create({
  baseURL: 'http://httpbin.org',
});

instance.get('/stream', { responseType: 'stream' }).then(({ response }) => {
  // `response` is the original response,
  // like fetch('/stream').then(response => { console.log(response)})
});
```

## Use plugins

**❗️❗️❗️ WIP (Work in Progress) ❗️❗️❗️**

```ts
import xior from 'xior';
import xiorCachePlugin from 'xior/lib/plugins/cache';
import xiorErrorRetryPlugin from 'xior/lib/plugins/error-retry';
import xiorRepeatRequestsFilterPlugin from 'xior/lib/plugins/repeat-requests-filter';

const instance = xior.create();

instance.plugins.use(xiorCachePlugin());
instance.plugins.use(xiorErrorRetryPlugin());
instance.plugins.use(xiorAvoidRepeatRequestsPlugin());
```

## Custom plugin

Let's implement a simple custom logs plugin:

```ts
import xior from 'xior';

const instance = xior.create();
instance.plugins.use(function logPlugin(adapter) {
  return async (config) => {
    const start = Date.now();
    const res = await adapter(config);
    console.log('%s %s take %sms', config.method, config.url, Date.now() - start);
    return res;
  };
});
```

## FAQ

- Is `xior` 100% compatiable with `axios`? No
- How to upload files? Use `FormData`
- How to show upload progress like axios? Doesn't support.
- What about response of `'stream' | 'document' | 'arraybuffer' | 'blob'` ? Use `responseType: 'stream' | 'document' | 'arraybuffer' | 'blob'`, will return original `{ response }`
- How to support old browser? use polyfill, check `src/tests/polyfill.test.ts`
- More: Anything else? create new issues let me know!

### Why use xior?

Xior based on `fetch`, and here are some reasons **why `fetch` instead of `axios`**:

- Built in to node and the browser
- Edge compatible
- Next.js extends the native fetch to [support caching and revalidating](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating)

Why don't just use `fetch`?

Yeah, you can. But xior's API similiar with axios, it's more make sense than the original `fetch`.
