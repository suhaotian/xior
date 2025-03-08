# CHANGELOG 📝

## v0.7.4

- Fix(plugins): For the `errorRetry` plugin, if `enableRetry` is a function returning `undefined` or is `undefined`, it only retries GET requests and skips POST requests; same with other plugins adjustments.
- Chore: Add https://www.jsdocs.io/package/xior to README's API Reference section
- Chore(build): switc to `tsup` bundler from `bunchee`, reduce the output size!!

## v0.7.3

- Refactor: minor improve size
- Plugins: use relative path to import utils and types

## v0.7.2

- Refactor: Don't exports unnecessary internal properties
- Chore: update README.md

## v0.7.1

- Chore: remove `ts-deepmerge` from `dependencies`
- Docs: update README to fix about `node-fetch` agent example code
- Refactor: minor reduce size

## v0.7.0

- Feat: Add `fetch` option; now we can use `node-fetch` and `undici` as replacements for the built-in fetch to support the **proxy** feature, or you can easily use other fetch implementations. [How can I use custom fetch implementation or How to support **proxy** feature?](https://github.com/suhaotian/xior?tab=readme-ov-file#3-how-can-i-use-custom-fetch-implementation-or-how-to-support-proxy-feature)
- Tests: Add tests for `node-fetch` and `undici` replacements.
- Refactor: Minor improvement.
- Build: Add sourcemap output by default with updated `bunchee` version.
- README: Update README about `fetch` option.
- Good to Know: Change internal properties `._RSIRun` to `_did` and `.fetch` to `._`.

## v0.6.3

- Refactor: Add `cacheKey` to cache plugin for persistent cache
- Tests: Add persistent cache test

## v0.6.2

- Refactor: minor improvement
- Refactor: use `'./utils'` instead of `'xior/utils'`, fix [Unable to resolve module xior/utils #34](https://github.com/suhaotian/xior/issues/34)

## v0.6.1

- Fix: response interceptors should run only once with error-retry plugin

## v0.6.0

- Fix: response interceptors should run after plugins (Fix https://github.com/suhaotian/xior/issues/29)

## v0.5.5

- Refactor: `content-type` detecting code improve and decrease size

## v0.5.4

- feat(core): Support `URLSearchParams` Fix [issues/26](https://github.com/suhaotian/xior/issues/26)

## v0.5.3

- fix(core): RangeError: Invalid time value. ref [issues/23](https://github.com/suhaotian/xior/issues/23)

## v0.5.2 2024/7/9

- Fix(core): if params include `Date` value, call `.toISOString()` and utils `encodeParams` support options `allowDot: true` and `arrayFormat: 'indices' | 'repeat' | 'brackets'` (default is `'indices'`). Fix [issues/22](https://github.com/suhaotian/xior/issues/22) and [issues/23](https://github.com/suhaotian/xior/issues/23)

---

**Code example:**

```ts
import xior, { encodeParams } from 'xior';

const filter = {
  ids: [1, 2, 3],
  dateFrom: new Date(),
  dateTo: new Date(),
};

const http = xior.create({
  paramsSerializer: (params: any) =>
    encodeParams(params, true, null, {
      allowDots: false,
      arrayFormat: 'indices', // 'indices' | 'repeat' | 'brackets'
      serializeDate: (date) => date.toISOString(),
    }),
});

/* 
'indices': { a: ['b', 'c'] } -> 'a[0]=b&a[1]=c'
'brackets': { a: ['b', 'c'] } -> 'a[]=b&a[]=c'
'repeat': { a: ['b', 'c'] } -> 'a=b&a=c'
*/

http.get('https://example.com', { params: { filter } });
```

## v0.5.1 2024/5/28

- Feat(core): if request config `withCredentials: true`, before useless, now will set fetch config `credentials: 'include'`. Fix [issues/19](https://github.com/suhaotian/xior/issues/19)

## v0.5.0 2024/5/19

**This is a breaking change:**

- Feat(core): The xior class should be CapitalCase like: `Xior`. Fix [issues/18](https://github.com/suhaotian/xior/issues/18)

### Migration

If you always use `import xior from 'xior';`, you can ignore migration code below.

**Before:**

```ts
import { xior } from 'xior';
```

**Now:**

```ts
import { Xior } from 'xior';
```

## v0.4.2 2024/5/2

- Feat(new plugin): add token refresh plugin

## v0.4.1 2024/04/29

- Feat: remove `undefined` value in `params` / `data`

## v0.4.0 2024/04/24

**Breaking Change**

This version is about Axios compatible issue in some cases. Fixing https://github.com/suhaotian/xior/issues/12 and https://github.com/suhaotian/xior/issues/15.

- Feat(core): when `responseType: 'blob' | 'arraybuffer'` then the `response.data` is `Blob` and `ArrayBuffer`, no need `response.blob()` or `response.arraybuffer()` anymore.
- Fix(interceptors): make sure the multiple response interceptors chain behavior same as axios's interceptors.

## v0.3.13 2024/04/21

- Feat(plugin): add custom parameters of LRU in plugins: cache, error-cache, throttle
- Feat(plugin): add `cacheTime` to cache plugin

## v0.3.12 2024/04/13

- fix(plugin): fix error cache plugin `cacheTime` is undefined when `useCacheFirst: true`

## v0.3.11 2024/04/12

- feat(plugin): error-cache plugin add cacheTime to the response

## v0.3.10 2024/04/11

- feat(plugin): `error-retry` plugin's `retryInterval` add `config` and `error` to parameters

## v0.3.9 2024/04/9

- feat(core): add `try catch` to `await fetch(...)`

Now you can capture the request error in response interceptors, and the error will be `TypeError`:

```ts
import xior, { merge } from 'xior';

const http = xior.create({
  // ...options
});

http.interceptors.response.use(
  (result) => {
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

## v0.3.8 2024/04/8

- feat(plugins): enhance plugins's `enable*` logic

---

Now you can return `undefined` in `enable*` method:

```ts
import xior from 'xior';
import errorRetryPlugin from 'xior/plugins/error-retry';

const http = xior.create();
http.plugins.use(
  errorRetryPlugin({
    enableRetry(config, error) {
      if (error.response?.status === 401) {
        return false;
      }
      // no return here, and will reuse the default `enableRetry` logic
    },
  })
);
```

## v0.3.7 2024/04/7

- feat(plugin): add `useCacheFirst` to error cache plugin

> If `useCacheFirst: true` and there's a cache, it will return the cached response first, then run fetching in the background. This is useful when the response takes a long time, and the data is unnecessary in real-time.

## v0.3.6 2024/04/6

- feat(plugin): add `onThrottle` to throttle plugin for logging purpose

## v0.3.5 2024/03/30

- feat(plugin): add `onDedupe` to dedupe plugin for logging purpose

## v0.3.2 2024/03/30

- feat: reduce build size use common `xior/utils`
- chore: bump bunchee to v5.0.1

## v0.3.1 2024/03/25

- fix(error-retry plugin): if have `request interceptors`, when error retry, retry with the latest request config from `request interceptors`

## v0.3.0 2024/03/24

- fix(core): POST/DELETE/PUT/PATCH methods when `content-type=application/x-www-form-urlencoded`, use formData to in body (previous put in url)
- refactor(core): default request interceptors should work before send fetch
- refactor(core): remove `_data` in request config
- refactor(core): remove `encode` in options, use `paramsSerializer` option instead
- chore(README): add encrypt/decrypt example to README

## v0.2.6 2024/03/22

- fix(core): when post with `headers: { 'content-type': 'application/x-www-form-urlencoded' }`, shouldn't post with body
- chore(core): shorter naming words

## v0.2.5 2024/03/20

- fix(plugin): fix `error-retry` plugin default options override bugs
- fix(plugin): `requestConfig` with plugins should always get latest config from `request interceptors`

## v0.2.4

- fix(plugin): fix `mock` plugin not working after bundle
- chore(tests): refactor tests to use bundled files to run tests

## v0.2.3 2024/03/19

- fix(plugin): fix `error-retry` plugin not working after bundle

## v0.2.2

- fix(plugin): fix `error-retry` plugin, `TypeError` should retry too
- feat(plugin): `error-retry` plugin, `retryInterval` can be `function` too, and add `onRetry` to options
- chore(core): minor improvement

## v0.2.1 2024/03/17

- feat(core): support direct call `xior.get/post..` similar to `axios.get/post..` API, no need create instance at first
- fix(core): `DELETE` and `OPTIONS` method's data option should be url encoded format like `GET` / `HEAD`
- feat: add `UMD` (Universal Module Definition) format bundle (now you can directly load xior in browser)
- feat: add `VERSION` to `xior`, now you can get current version of xior by: `import xior from 'xior'; console.log(xior.VERSION)`
- feat(new plugin): add `error-cache` plugin
- feat(new plugin): add `dedupe` plugin
- feat(new plugin): add `mock` plugin

**Breaking Change:**

1. **Type**

before:

```ts
import xior from 'xior';

let instance: xior;
instance = xior.create();
```

Now:

```ts
import xior, { XiorInstance } from 'xior';

let instance: XiorInstance;
instance = xior.create();
```

2. **OPTIONS** method

before:

```ts
import xior, { XiorInstance } from 'xior';

const instance = xior.create();
instance.options('/options_api_path', { text: 'this is data' }, { params: { a: 1 } });
```

now:

```ts
import xior, { XiorInstance } from 'xior';

const instance = xior.create();
instance.options('/options_api_path', { params: { a: 1, text: 'this is data' } });
```

## v0.1.4 2024-03-09

- Feat(core): support `xiorInstance.defaults.headers['Authorization'] = 'Basic token';`

## v0.1.3 2024-03-08

- Feat(core): add `isGet?: boolean` option

## v0.1.2

- Feat(cache plugin): add `fromCache: boolean` in cache plugin

## v0.1.1 2024-03-04

- Fix: compatible `delete` method with axios, and `delete` method shouldn't have body
- Chore: remove unused code in core module

**Breaking change:**

```ts
import xior from 'xior';

const http = xior.create({ baseURL: 'https://exampled.com' });

// before
http.delete('/', {}, { params: { a: 1, b: 2 } });

// now
http.delete('/', { params: { a: 1, b: 2 } });
```

## v0.0.10 2024-03-01

- chore(build): Update build config to ensure consistency of plugin import paths
- chore(doc): Update README

## v0.0.9 2024-02-29

- fix(plugins): resolve import plugins not found file error in expo (react-native) project

## v0.0.8 2024-02-29

- feat(core): compatible axios's options: `paramsSerializer` and `withCredentials`

## v0.0.7 2024-02-27

- feat(core): support nested object parameters in default
- feat(plugin): implemented **error retry**, **cache**, **throttle**, and upload/download **progress** plugins
- fix(build): resolved Bunchee build output error with Vite projects.
- chore(doc): updated README.md
- chore(examples): add bun, vite, and next build example for make sure it's working in these projects

## v0.0.6 2024-02-24

- feat(plugin): Plugin mechanism implemented 🖖
- feat: Compatibility with polyfills in older environments

## v0.0.5 2024-02-20

- fix: resolved issues with GitHub Actions release

## v0.0.4

- feat: support url as first parameter in xiorInstance.request('/url')
- feat: Removed first parameter `url` from `xiorInstance.request`

## v0.0.3

- Chore: Enhanced README and added more tests
- Feat: `xiorInstance.request` remove first parameter `url`

## v0.0.2 2024-02-18

- Feat: improved error handling compatibility with Axios's response interceptor.

## v0.0.1 2024-02-15

🐣
