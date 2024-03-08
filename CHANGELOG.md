# CHANGELOG 📝

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
