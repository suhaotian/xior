import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { stringify } from 'qs';
import { XiorRequestConfig, Xior } from 'xior';
import xiorProgressPlugin, { XiorProgressRequestOptions } from 'xior/plugins/progress';

import { startServer } from '../server';

let close: Function;
const port = 7872;
const baseURL = `http://localhost:${port}`;
before(async () => {
  close = await startServer(port);
});

after(async () => {
  return close(1);
});

describe('xior progress plugin tests', () => {
  const instance = Xior.create({ baseURL, paramsSerializer: (params) => stringify(params) });
  instance.plugins.use(
    xiorProgressPlugin({
      progressDuration: 5 * 1000,
    })
  );

  it('should work with `onUploadProgress`', async () => {
    let progress = 0;
    await instance.get('/timeout', {
      params: { timeout: 3000 },
      progressDuration: 2000,
      onUploadProgress: (e) => {
        progress = e.progress;
      },
    } as XiorProgressRequestOptions & XiorRequestConfig);
    assert.strictEqual(progress, 100);
  });

  it('should work with `onDownloadProgress`', async () => {
    let progress = 0;
    await instance.get('/timeout', {
      params: { timeout: 1000 },
      progressDuration: 2000,
      onDownloadProgress: (e) => {
        progress = e.progress;
      },
    } as XiorProgressRequestOptions & XiorRequestConfig);
    assert.strictEqual(progress, 100);
  });
});
