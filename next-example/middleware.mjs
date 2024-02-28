import xior from 'xior';
import cachePlugin from 'xior/plugins/cache';
import errorRetryPlugin from 'xior/plugins/error-retry';
import uploadDownloadProgressPlugin from 'xior/plugins/progress';
import throttlePlugin from 'xior/plugins/throttle';

export const http = xior.create();

http.plugins.use(errorRetryPlugin());
http.plugins.use(throttlePlugin());
http.plugins.use(cachePlugin());
http.plugins.use(uploadDownloadProgressPlugin());

import { NextResponse } from 'next/server';

export async function middleware(request) {
  const { data } = await http.get('https://google.com'); // for test
  console.log(data.length);
}

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    '/((?!_next).*)',
    // Optional: only run on root (/) URL
    // '/'
  ],
};
