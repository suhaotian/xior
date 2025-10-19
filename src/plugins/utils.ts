import buildSortedURL from './cache/build-sorted-url';

export { buildSortedURL };

export function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export type ICacheLike<T> = {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
} & ({ del(key: string): void } | { delete(key: string): void });
