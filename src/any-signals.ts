/** Code Ref: https://github.com/jacobheun/any-signal/pull/40/files */

export interface ClearableSignal extends AbortSignal {
  clear: () => void;
}

/**
 * Takes an array of AbortSignals and returns a single signal.
 * If any signals are aborted, the returned signal will be aborted.
 */
export function anySignal(
  signals: (AbortSignal | undefined | null)[],
  cleanCb?: Function
): ClearableSignal {
  const controller = new AbortController();

  function onAbort(reason?: Error) {
    controller.abort(reason);
    clear();
  }

  const unsubscribe: Function[] = [];
  for (const signal of signals) {
    if (signal?.aborted === true) {
      onAbort(signal.reason);
      break;
    }

    if (signal?.addEventListener != null) {
      const cb = () => {
        onAbort(signal.reason);
      };
      unsubscribe.push(() => {
        signal.removeEventListener?.('abort', cb);
      });
      signal.addEventListener('abort', cb);
    }
  }

  function clear() {
    unsubscribe.forEach((cb) => cb());
    cleanCb?.();
  }

  const signal = controller.signal as ClearableSignal;
  signal.clear = clear;

  return signal;
}
