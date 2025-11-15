export class ExtensibleFunction extends Function {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  constructor(f: Function) {
    super();
    return Object.setPrototypeOf(f, new.target.prototype);
  }
}

export type TimerId = ReturnType<typeof setTimeout>;
export type IntervalId = ReturnType<typeof setInterval>;

export const isObject = (d: any): boolean => {
  return d != null && typeof d === 'object' && !Array.isArray(d);
};

export const isNormalNumber = (num: number): boolean => {
  return Number.isFinite(num) && !Number.isNaN(num);
};

export const isRecord = <T = any>(v: any, of?: (v: any) => v is T): v is Record<string, T> => {
  // if (typeof v !== 'object' || v == null || Array.isArray(v)) return false;
  if (!isObject(v)) return false;
  if (v.constructor != null && v.constructor !== Object) return false;

  if (of != null) {
    for (const key of Object.keys(v)) {
      return of(v[key]);
    }
  }

  return true;
};

export const isArray = <T = any>(v: any, of?: (v: any) => v is T): v is T[] => {
  if (v == null) return false;

  const isArr = Array.isArray(v);
  if (of == null) return isArr;

  if (v.length === 0) return true;
  return of(v[0]);
};

export const isString = (v: any): v is string => {
  return typeof v === 'string';
};

export const isNumeric = (v: any): boolean => {
  return !Number.isNaN(v);
};

export const isPrimitive = (v: any): v is string | number | boolean => {
  const t = typeof v;
  return t === 'string' || t === 'number' || t === 'boolean';
};
