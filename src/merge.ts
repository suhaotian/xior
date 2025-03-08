/** From @voodoocreation/ts-deepmerge: https://github.com/voodoocreation/ts-deepmerge/blob/master/src/index.ts */

import { isArray, keys, O, op, o, f, p } from './shorts';

type TAllKeys<T> = T extends any ? keyof T : never;

type TIndexValue<T, K extends PropertyKey, D = never> = T extends any
  ? K extends keyof T
    ? T[K]
    : D
  : never;

type TPartialKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>> extends infer O
  ? { [P in keyof O]: O[P] }
  : never;

type TFunction = (...a: any[]) => any;

type TPrimitives = string | number | boolean | bigint | symbol | Date | TFunction;

type TMerged<T> = [T] extends [any[]]
  ? { [K in keyof T]: TMerged<T[K]> }
  : [T] extends [TPrimitives]
    ? T
    : [T] extends [object]
      ? TPartialKeys<{ [K in TAllKeys<T>]: TMerged<TIndexValue<T, K>> }, never>
      : T;

const getPrototypeOf = O.getPrototypeOf;
// istanbul ignore next
const isObject = (obj: any) => {
  if (obj !== null && typeof obj === o) {
    if (typeof getPrototypeOf === f) {
      const prototype = getPrototypeOf(obj);
      return prototype === op || prototype === null;
    }

    return op.toString.call(obj) === `[${o} Object]`;
  }

  return false;
};

interface IObject {
  [key: string]: any;
}

export const merge = <T extends IObject[]>(...objects: T): TMerged<T[number]> =>
  objects.reduce((result, current) => {
    if (isArray(current)) {
      throw new TypeError(`Arguments must be ${o}s, not arrays.`);
    }

    keys(current).forEach((key) => {
      if (['__proto__', 'constructor', p].includes(key)) {
        return;
      }

      if (isArray(result[key]) && isArray(current[key])) {
        result[key] = Array.from(new Set((result[key] as unknown[]).concat(current[key])));
      } else if (isObject(result[key]) && isObject(current[key])) {
        result[key] = merge(result[key] as IObject, current[key] as IObject);
      } else {
        result[key] = current[key];
      }
    });

    return result;
  }, {}) as any;
