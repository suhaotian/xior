import xior from 'https://esm.sh/xior@0.0.7';
import cachePlugin from 'https://esm.sh/xior@0.0.7/plugins/cache';
import errorRetryPlugin from 'https://esm.sh/xior@0.0.7/plugins/error-retry';
import uploadDownloadProgressPlugin from 'https://esm.sh/xior@0.0.7/plugins/progress';
import throttlePlugin from 'https://esm.sh/xior@0.0.7/plugins/throttle';

console.log('hi xior from deno', xior);

const instance = xior.create();
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
