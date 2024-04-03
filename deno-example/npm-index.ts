import xior, { merge, delay, buildSortedURL, encodeParams } from 'npm:xior';
import cachePlugin from 'npm:xior/plugins/cache';
import errorRetryPlugin from 'npm:xior/plugins/error-retry';
import uploadDownloadProgressPlugin from 'npm:xior/plugins/progress';
import throttlePlugin from 'npm:xior/plugins/throttle';

// console.log(merge, delay, buildSortedURL);
const instance = xior.create({});
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
