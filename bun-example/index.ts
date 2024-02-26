/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-ignore
import stringify from 'qs/lib/stringify';
import xior, { merge, delay, buildSortedURL } from 'xior';
import cachePlugin from 'xior/plugins/cache';
import errorRetryPlugin from 'xior/plugins/error-retry';
import uploadDownloadProgressPlugin from 'xior/plugins/progress';
import throttlePlugin from 'xior/plugins/throttle';

// console.log(merge, delay, buildSortedURL);

const instance = xior.create({
  encode: (params: Record<string, any>) => stringify(params),
});
instance.plugins.use(errorRetryPlugin({}));
instance.plugins.use(cachePlugin({}));
instance.plugins.use(throttlePlugin({}));
instance.plugins.use(uploadDownloadProgressPlugin({}));

instance.plugins.use((adapter) => {
  return async (config) => {
    const res = await adapter(config);
    console.log(`%s %s -> %s`, config.method, config.url, res.status);
    return res;
  };
});

instance.get('https://google.com', {
  progressDuration: 500,
  onDownloadProgress(e) {
    console.log(`Download %s%`, e.progress);
  },
});
