import { Readable } from 'stream';
import type { ReadableStream as NodeReadableStream } from 'stream/web';
import type { XiorPlugin } from '../types';

export default function streamPlugin(): XiorPlugin {
  return function (adapter) {
    return async (config) => {
      const res = await adapter(config);
      // Only convert if user wants stream
      if (config.responseType === 'stream') {
        res.data = Readable.fromWeb(res.response.body as unknown as NodeReadableStream<Uint8Array>);
      }
      return res;
    };
  };
}
