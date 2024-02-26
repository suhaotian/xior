/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-ignore
import stringify from 'qs/lib/stringify';
import xior from 'xior';
import cachePlugin from 'xior/plugins/cache';
import errorRetryPlugin from 'xior/plugins/error-retry';
import uploadDownloadProgressPlugin from 'xior/plugins/progress';
import throttlePlugin from 'xior/plugins/throttle';

const instance = xior.create({
  encode: (params: Record<string, any>) => stringify(params),
});
instance.plugins.use(errorRetryPlugin({}));
instance.plugins.use(cachePlugin({}));
instance.plugins.use(throttlePlugin({}));
instance.plugins.use(uploadDownloadProgressPlugin({}));
