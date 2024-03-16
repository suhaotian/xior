/* eslint-disable @typescript-eslint/no-unused-vars */
import xior, { merge, delay, buildSortedURL, XiorInstance } from 'xior';
import cachePlugin from 'xior/plugins/cache';
import errorCachePlugin from 'xior/plugins/error-cache';
import errorRetryPlugin from 'xior/plugins/error-retry';
import MockPlugin from 'xior/plugins/mock';
import uploadDownloadProgressPlugin from 'xior/plugins/progress';
import throttlePlugin from 'xior/plugins/throttle';

console.log(merge, delay, buildSortedURL);

const instance: XiorInstance = xior.create({});
instance.plugins.use(errorRetryPlugin({}));
instance.plugins.use(cachePlugin({}));
instance.plugins.use(throttlePlugin({}));
instance.plugins.use(errorCachePlugin({}));
instance.plugins.use(uploadDownloadProgressPlugin({}));

const mock = new MockPlugin(instance, { onNoMatch: 'passthrough' });

instance.plugins.use((adapter) => {
  return async (config) => {
    const res = await adapter(config);
    console.log(`%s %s -> %s`, config.method, config.url, res.status);
    return res;
  };
});

setTimeout(() => {
  instance
    .get('/main', {
      progressDuration: 1000,
      onDownloadProgress(e) {
        console.log(`Download %s%`, e.progress);
      },
    })
    .then((res) => {
      if (res.fromCache) {
        console.log('data from cache!');
      }
    });
}, 3000);

instance
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

fetch('https://github.com')
  .then((res) => res.text())
  .catch((e) => {
    console.log('fetch:', e instanceof TypeError, e);
  });

const http = xior.create({});

http.get('https://github.com').catch((e) => {
  console.log('xior:', e instanceof TypeError, e);
});
