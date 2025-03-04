/* eslint-disable @typescript-eslint/no-unused-vars */
import { stringify } from 'qs';
import xior from 'xior';
import cachePlugin from 'xior/plugins/cache';
import errorRetryPlugin from 'xior/plugins/error-retry';
import uploadDownloadProgressPlugin from 'xior/plugins/progress';
import throttlePlugin from 'xior/plugins/throttle';

const instance = xior.create({
  paramsSerializer: (params: Record<string, any>) => stringify(params),
});
instance.plugins.use(errorRetryPlugin({}));
instance.plugins.use(cachePlugin({}));
instance.plugins.use(throttlePlugin({}));
instance.plugins.use(uploadDownloadProgressPlugin({}));
