/* eslint-disable */
import xior, {
  merge,
  delay,
  buildSortedURL,
  encodeParams,
  mergeConfig,
  isAxiosError,
} from 'xior/axios';
import cachePlugin from 'xior/plugins/cache';
import errorRetryPlugin from 'xior/plugins/error-retry';
import MockPlugin from 'xior/plugins/mock';
import uploadDownloadProgressPlugin from 'xior/plugins/progress';
import throttlePlugin from 'xior/plugins/throttle';

// console.log(merge, delay, buildSortedURL);

export const instance = xior.create({});
instance.plugins.use(errorRetryPlugin({}));
instance.plugins.use(cachePlugin({}));
instance.plugins.use(throttlePlugin({}));
instance.plugins.use(uploadDownloadProgressPlugin({}));

const mock = new MockPlugin(instance, { onNoMatch: 'passthrough' });

instance.plugins.use((adapter) => {
  return async (config) => {
    const res = await adapter(config);
    console.log(`%s %s -> %s`, config.method, config.url, res.status);
    return res;
  };
});

instance.get('/', {
  progressDuration: 500,
  onDownloadProgress(e) {
    console.log(`Download %s%`, e.progress);
  },
});
