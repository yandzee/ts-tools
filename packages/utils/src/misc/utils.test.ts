import { describe, test, expect } from 'vitest';
import { isRecord } from './types';

class Custom {
  public m() {}
}

class Derived extends Custom {}

describe('utils', () => {
  test('isRecord', () => {
    expect([
      isRecord(1),
      isRecord(NaN),
      isRecord(''),
      isRecord('123'),
      isRecord(' '),
      isRecord(null),
      isRecord(undefined),
      isRecord(123),
      isRecord(() => {}),
      isRecord(function () {}),
      isRecord(new Date()),
      isRecord(new Function()),
      isRecord(new Map()),
      isRecord(new Set()),
      isRecord(new Custom()),
      isRecord(new Derived()),
      isRecord(Object.create(Date.prototype)),
    ]).not.toContain(true);

    expect([
      isRecord({}),
      isRecord(new Object()),
      isRecord(Object.create(null)),
      isRecord(Object.create({})),
      isRecord(Object.create(new Object())),
    ]).not.toContain(false);
  });
});
