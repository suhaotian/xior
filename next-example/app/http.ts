import xior from 'xior';
import cachePlugin from 'xior/plugins/cache';
import errorRetryPlugin from 'xior/plugins/error-retry';
import uploadDownloadProgressPlugin from 'xior/plugins/progress';
import proxyPlugin from 'xior/plugins/proxy';
import throttlePlugin from 'xior/plugins/throttle';

export const http = xior.create();

http.plugins.use(errorRetryPlugin());
http.plugins.use(throttlePlugin());
http.plugins.use(cachePlugin());
http.plugins.use(uploadDownloadProgressPlugin());
http.plugins.use(proxyPlugin());
