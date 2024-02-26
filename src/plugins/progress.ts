import { XiorPlugin } from '../types';

export interface XiorProgressOptions {
  /** default: 5*1000ms, 5 seconds */
  progressDuration?: number;
}

type BrowserProgressEvent = any;
export interface XiorProgressEvent {
  loaded: number;
  total: number;
  progress: number;
  bytes?: number;
  rate?: number;
  estimated?: number;
  upload?: boolean;
  download?: boolean;
  event?: BrowserProgressEvent;
}

export interface XiorProgressRequestOptions extends XiorProgressOptions {
  onUploadProgress?: (progressEvent: XiorProgressEvent) => void;
  onDownloadProgress?: (progressEvent: XiorProgressEvent) => void;
}
/** @ts-ignore */
declare module 'xior' {
  interface XiorRequestConfig extends XiorProgressRequestOptions {}
}

/** upload progress / download progress */
export default function xiorProgressPlugin(options: XiorProgressOptions = {}): XiorPlugin {
  const { progressDuration: _progressDuration = 5 * 1000 } = options;
  return function (adapter) {
    return async (config) => {
      const {
        progressDuration = _progressDuration,
        onUploadProgress,
        onDownloadProgress,
      } = config as XiorProgressRequestOptions;
      // const percentCompleted = Math.round( (progressEvent.loaded * 100) / progressEvent.total );
      let interval: ReturnType<typeof setInterval> | undefined;
      if (onUploadProgress || onDownloadProgress) {
        const total = 1000;
        let loaded = 0;
        let progress = 0;
        const step = total / (progressDuration / 300);
        interval = setInterval(() => {
          if (progress >= 99) {
            return clearInterval(interval);
          }
          loaded += Math.random() * step;
          progress = Math.floor((loaded / total) * 100);
          const event: XiorProgressEvent = {
            total,
            loaded,
            progress,
          };
          if (event.progress >= 99) {
            event.progress = 99;
            event.loaded = 0.99 * total;
          }
          onUploadProgress?.(event);
          onDownloadProgress?.(event);
        }, 300);
      }
      try {
        const res = await adapter(config);
        if (onUploadProgress || onDownloadProgress) {
          const event: XiorProgressEvent = {
            total: 1000,
            loaded: 1000,
            progress: 100,
          };
          onUploadProgress?.(event);
          onDownloadProgress?.(event);
        }

        return res;
      } catch (e) {
        throw e;
      } finally {
        if (interval) clearInterval(interval);
      }
    };
  };
}
