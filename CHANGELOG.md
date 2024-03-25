# CHANGELOG 📝

## v0.3.1 2024/03/25

- fix(error-retry plugin): if have `request inteceptors`, when error retry, retry with the latest request cofnig from `request inteceptors`

## v0.3.0 2024/03/24

- fix(core): POST/DELETE/PUT/PATCH methods when `content-type=application/x-www-form-urlencoded`, use formData to in body(previous put in url)
- refactor(core): default request inteceptor should work before send fetch
- refactor(core): remove `_data` in request config
- refactor(core): remove `encode` in options, use `paramsSerializer` option instead
- chore(README): add encrypt/decrypt example to README

## v0.2.6 2024/03/22

- fix(core): when post with `headers: { 'content-type': 'application/x-www-form-urlencoded' }`, shouldn't post with body
- chore(core): shorter naming words

## v0.2.5 2024/03/20

- fix(plugin): fix `error-retry` plugin default options override bugs
- fix(plugin): `requestConfig` with plugins should always get latest config from `requestInteceptors`

## v0.2.4

- fix(plugin): fix `mock` plugin not working after bundle
- chore(tests): refactor tests to use bundled files to run tests

## v0.2.3 2024/03/19

- fix(plugin): fix `error-retry` plugin not working after bundle

## v0.2.2

- fix(plugin): fix `error-retry` plugin, `TypeError` should retry too
- feat(plugin): `error-retry` plugin, `retryInterval` can be `function` too, and add `onRetry` to options
- chore(core): minor improvment

## v0.2.1 2024/03/17

- feat(core): support direct call `xior.get/post..` similar to `axios.get/post..` API, no need create instance at first
- fix(core): `DELETE` and `OPTIONS` method's data option should be url encoded format like `GET` / `HEAD`
- feat: add `UMD`(Universal Module Definition) format bundle(now you can directly load xior in browser)
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

- Fix: compatiable `delete` method with axios, and `delete` method shouldn't have body
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

- fix(plugins): resolve import plugins not found file error in expo(react-native) project

## v0.0.8 2024-02-29

- feat(core): compatiable axios's options: `paramsSerializer` and `withCredentials`

## v0.0.7 2024-02-27

- feat(core): suport nested object paramaters in default
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

- feat: support url as first paramter in xiorInstance.request('/url')
- feat: Removed first parameter `url` from `xiorInstance.request`

## v0.0.3

- Chore: Enhanced README and added more tests
- Feat: `xiorInstance.request` remove first parameter `url`

## v0.0.2 2024-02-18

- Feat: improved error handling compatibility with Axios's response interceptor.

## v0.0.1 2024-02-15

🐣
