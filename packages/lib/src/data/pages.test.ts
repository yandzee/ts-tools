import { describe, test, expect } from 'vitest';
import { Pages } from './pages';

// NOTE: [elem, pageIndex, elemIndexInPage, globalElemIndex]
type ForEachLine<T> = [T, number, number, number];

type TestDescriptor<T> = {
  name: string;
  initPages: [number, T[], number][];
  insert?: [number, T, boolean][];
  expectForEach?: ForEachLine<T>[];
};

const runTest = <T>(td: TestDescriptor<T>) => {
  const buf = new Pages<T>();

  td.initPages.forEach(([pageIndex, elems, pageSize]) => {
    buf.set(pageIndex, elems, pageSize);
  });

  test(td.name, () => {
    if (td.insert) {
      td.insert.forEach((pair) => {
        const [idx, elem, expectedNewPage] = pair;

        const newPageCreated = buf.insert(idx, elem);
        expect(newPageCreated).toBe(expectedNewPage);
      });
    }

    if (td.expectForEach) {
      const forEachLines = [] as ForEachLine<T>[];
      buf.forEach((e, page, idx, gidx) => {
        forEachLines.push([e, page, idx, gidx]);
      });

      expect(forEachLines).toStrictEqual(td.expectForEach);
    }
  });
};

describe('Pages', () => {
  describe('forEach', () => {
    runTest({
      name: 'gap',
      initPages: [
        [0, [1, 2], 2],
        [2, [3, 4], 2],
      ],
      expectForEach: [
        [1, 0, 0, 0],
        [2, 0, 1, 1],
        [3, 2, 0, 4],
        [4, 2, 1, 5],
      ],
    });
  });

  describe('reassignPages', () => {
    runTest({
      name: 'spread case 0',
      initPages: [
        [0, [1, 2], 2],
        [1, [3, 4], 2],
        [6, [7], 1],
      ],
      expectForEach: [
        [1, 0, 0, 0],
        [2, 1, 0, 1],
        [3, 2, 0, 2],
        [4, 3, 0, 3],
        [7, 6, 0, 6],
      ],
    });

    runTest({
      name: 'spread case 1',
      initPages: [
        [0, [1, 2, 3], 3],
        [1, [4], 2],
      ],
      expectForEach: [
        [1, 0, 0, 0],
        [2, 0, 1, 1],
        [4, 1, 0, 2],
      ],
    });

    runTest({
      name: 'shrink case 0',
      initPages: [
        [0, [1], 1],
        [1, [2], 1],
        [1, [3], 2],
      ],
      expectForEach: [
        [1, 0, 0, 0],
        [2, 0, 1, 1],
        [3, 1, 0, 2],
      ],
    });
  });

  describe('insert', () => {
    runTest({
      name: 'insert into empty (one elem)',
      initPages: [],
      insert: [[0, 1, true]],
      expectForEach: [[1, 0, 0, 0]],
    });

    runTest({
      name: 'insert into empty (two elems)',
      initPages: [],
      insert: [
        [0, 1, true],
        [1, 2, false],
      ],
      expectForEach: [
        [1, 0, 0, 0],
        [2, 0, 1, 1],
      ],
    });

    runTest({
      name: 'insert into existing (no eviction)',
      initPages: [[1, [1, 2], 2]],
      insert: [
        [0, 4, true],
        [1, 5, false],
      ],
      expectForEach: [
        [4, 0, 0, 0],
        [5, 0, 1, 1],
        [1, 1, 0, 2],
        [2, 1, 1, 3],
      ],
    });

    runTest({
      name: 'insert into existing (eviction case)',
      initPages: [[1, [1, 2], 2]],
      insert: [
        [0, 4, true],
        [1, 5, false],
        [2, 6, true],
      ],
      expectForEach: [
        [4, 0, 0, 0],
        [5, 0, 1, 1],
        [6, 1, 0, 2],
        [1, 1, 1, 3],
        [2, 2, 0, 4],
      ],
    });

    runTest({
      name: 'insert into existing (transitive eviction case)',
      initPages: [[1, [1, 2], 2]],
      insert: [
        [0, 4, true],
        [1, 5, false],
        [2, 6, true],
        [0, 10, false],
      ],
      expectForEach: [
        [10, 0, 0, 0],
        [4, 0, 1, 1],
        [5, 1, 0, 2],
        [6, 1, 1, 3],
        [1, 2, 0, 4],
        [2, 2, 1, 5],
      ],
    });
  });
});
