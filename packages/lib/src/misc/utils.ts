import { camelCase, snakeCase, isFunction } from 'es-toolkit';
import { isRecord } from './types';

export type KeyTransformHook = (key: string, path: string[]) => string | null;

export const transformObjectKeys = (
  obj: any,
  tr: (_: string) => string,
  hook?: (key: string, path: string[]) => string | null,
  path: string[] = [],
): any => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((v: any, idx: any) => {
      return transformObjectKeys(v, tr, hook, path.concat(idx.toString()));
    });
  }

  if (isFunction(obj)) {
    return obj;
  }

  if (isRecord(obj)) {
    return Object.entries(obj).reduce((acc: any, pair: [string, any]) => {
      const key = pair[0];
      const transformedKey = hook?.(key, path) ?? tr(key);
      const transformedValue = transformObjectKeys(pair[1], tr, hook, path.concat(key));

      return Object.assign(acc, {
        [transformedKey]: transformedValue,
      });
    }, {});
  }

  return obj;
};

export const camelCasify = (obj: any, hook?: KeyTransformHook): any => {
  return transformObjectKeys(obj, camelCase, hook);
};

export const snakeCasify = (obj: any, hook?: KeyTransformHook): any => {
  return transformObjectKeys(obj, snakeCase, hook);
};

export const isValidDate = (d: Date): boolean => {
  return d instanceof Date && !Number.isNaN(+d);
};

export const once1 = () => {
  let permits = 1;

  return {
    call: (fn: () => void) => {
      if (permits === 0) {
        return;
      }
      permits = 0;

      fn();
    },
  };
};

export const once2 = <A>(fn: (...args: A[]) => void) => {
  let permits = 1;

  return (...args: A[]) => {
    if (permits === 0) {
      return;
    }

    fn(...args);
    permits = 0;
  };
};

export const sync = <A, O>(fn: (...args: A[]) => Promise<O>) => {
  const box = { p: null as Promise<O> | null };

  return (...args: A[]): Promise<O> => {
    if (box.p != null) {
      return box.p;
    }

    box.p = fn(...args).finally(() => {
      box.p = null;
    });

    return box.p;
  };
};

export const capitalize = (s: string): string => {
  return s.charAt(0).toUpperCase().concat(s.slice(1));
};

export const range = (size: number, start: number = 0): number[] => {
  const arr = new Array(size);

  for (let i = 0; i < size; i += 1) {
    arr[i] = start + i;
  }

  return arr;
};

export const range2 = (from: number, to: number): number[] => {
  [from, to] = from > to ? [to, from] : [from, to];

  const arr = new Array(to - from);

  for (let i = 0; i < arr.length; i += 1) {
    arr[i] = from + i;
  }

  return arr;
};
