import { describe, test, expect } from 'vitest';

import { VirtualScroller } from './virtual-scroller';
const INVIS = VirtualScroller.INVISIBLE_VIRTUAL_INDEX;

const buildScroller = (amount = 100) => {
  return new VirtualScroller({
    itemHeight: 10,
    amount,
    poolSize: (n) => n + 2,
  });
};

describe('height change', () => {
  test('initialization (integer number of items visible)', () => {
    const vscroller = buildScroller();
    vscroller.heightChanged(50);

    expect(vscroller.poolSize).toBe(7);
  });

  test('initialization (float number of items visible)', () => {
    const vscroller = buildScroller();
    vscroller.heightChanged(55);

    expect(vscroller.poolSize).toBe(8);
  });

  test('expansion (to integer number of items)', () => {
    const vscroller = buildScroller();
    vscroller.heightChanged(50);
    vscroller.heightChanged(100);

    expect(vscroller.poolSize).toBe(12);
  });

  test('expansion (to float number of items)', () => {
    const vscroller = buildScroller();
    vscroller.heightChanged(50);
    vscroller.heightChanged(102);

    expect(vscroller.poolSize).toBe(13);
  });

  test('shrinking (to integer number of items visible)', () => {
    const vscroller = buildScroller();
    vscroller.heightChanged(100);
    vscroller.heightChanged(30);

    expect(vscroller.poolSize).toBe(5);
  });

  test('shrinking (to float number of items visible)', () => {
    const vscroller = buildScroller();
    vscroller.heightChanged(100);
    vscroller.heightChanged(33);

    expect(vscroller.poolSize).toBe(6);
  });
});

describe('compute positions', () => {
  test('non-scrollable', () => {
    const vscroller = buildScroller(1);
    const [pos, isChanged] = vscroller.heightChanged(40);

    expect(isChanged).toBe(true);
    expect(pos).toStrictEqual([0, INVIS, INVIS, INVIS, INVIS, INVIS]);
  });

  describe('zero scroll', () => {
    test('positive scroll delta', () => {
      const vscroller = buildScroller();

      const [pos, isChanged] = vscroller.heightChanged(50);

      expect(isChanged).toBe(true);
      expect(pos).toStrictEqual([0, 1, 2, 3, 4, 5, 6]);
    });

    test('negative scroll delta', () => {
      const vscroller = buildScroller();

      const [_, isChanged] = vscroller.heightChanged(50);
      expect(isChanged).toBe(true);

      const pos = vscroller.computePositions(-1);
      expect(pos).toStrictEqual([6, 5, 0, 1, 2, 3, 4]);
    });
  });

  describe('pool size is greather than number of elements', () => {
    test('max possible index threshold', () => {
      const vscroller = buildScroller(5);

      const [pos, isChanged] = vscroller.heightChanged(50);

      expect(isChanged).toBe(true);
      expect(pos).toStrictEqual([0, 1, 2, 3, 4, INVIS, INVIS]);
    });

    test('min possible index threshold', () => {
      const vscroller = buildScroller(5);

      const [_, isChanged] = vscroller.heightChanged(50);
      expect(isChanged).toBe(true);

      const pos = vscroller.computePositions(-1);
      expect(pos).toStrictEqual([INVIS, INVIS, 0, 1, 2, 3, 4]);
    });
  });
});

describe('scroll change', () => {
  test('no change', () => {
    const vscroller = buildScroller();
    vscroller.heightChanged(50);

    const [pos, isChanged] = vscroller.scrollChanged(0);
    expect(isChanged).toBe(false);
    expect(pos).toStrictEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  describe('positive scroll delta', () => {
    test('non-overlapping window (float number of items skipped)', () => {
      const vscroller = buildScroller();
      vscroller.heightChanged(50);

      const [pos, isChanged] = vscroller.scrollChanged(99);
      expect(isChanged).toBe(true);
      expect(pos).toStrictEqual([9, 10, 11, 12, 13, 14, 15]);
    });

    test('non-overlapping window (integer number of items skipped)', () => {
      const vscroller = buildScroller();
      vscroller.heightChanged(50);

      const [pos, isChanged] = vscroller.scrollChanged(100);
      expect(isChanged).toBe(true);
      expect(pos).toStrictEqual([10, 11, 12, 13, 14, 15, 16]);
    });

    test('overlapping window 1', () => {
      const vscroller = buildScroller();
      vscroller.heightChanged(50);

      const [pos, isChanged] = vscroller.scrollChanged(25);
      expect(isChanged).toBe(true);

      expect(new Set(pos)).toStrictEqual(new Set([2, 3, 4, 5, 6, 7, 8]));
    });

    test('overlapping window 2', () => {
      const vscroller = buildScroller();
      vscroller.heightChanged(50);

      const [pos, isChanged] = vscroller.scrollChanged(40);
      expect(isChanged).toBe(true);

      expect(new Set(pos)).toStrictEqual(new Set([4, 5, 6, 7, 8, 9, 10]));
    });
  });

  describe('negative scroll delta', () => {
    test('non-overlapping window (float number of items skipped)', () => {
      const vscroller = buildScroller();
      vscroller.heightChanged(50);
      vscroller.scrollChanged(100);

      const [pos, isChanged] = vscroller.scrollChanged(49);
      expect(isChanged).toBe(true);
      expect(pos).toStrictEqual([3, 4, 5, 6, 7, 8, 9]);
    });

    test('non-overlapping window (integer number of items skipped)', () => {
      const vscroller = buildScroller();
      vscroller.heightChanged(50);
      vscroller.scrollChanged(100);

      const [pos, isChanged] = vscroller.scrollChanged(50);
      expect(isChanged).toBe(true);
      expect(pos).toStrictEqual([3, 4, 5, 6, 7, 8, 9]);
    });

    test('overlapping window 1', () => {
      const vscroller = buildScroller();
      vscroller.heightChanged(50);
      vscroller.scrollChanged(100);

      const [pos, isChanged] = vscroller.scrollChanged(25);
      expect(isChanged).toBe(true);

      expect(new Set(pos)).toStrictEqual(new Set([1, 2, 3, 4, 5, 6, 7]));
    });

    test('overlapping window 2', () => {
      const vscroller = buildScroller();
      vscroller.heightChanged(50);
      vscroller.scrollChanged(100);

      const [pos, isChanged] = vscroller.scrollChanged(40);
      expect(isChanged).toBe(true);

      expect(new Set(pos)).toStrictEqual(new Set([2, 3, 4, 5, 6, 7, 8]));
    });
  });
});
