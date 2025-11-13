import type { Page } from './page';
import { range } from '~/misc/utils';

export class Pages<T> {
  private pages: Map<number, T[]> = new Map();

  constructor(public lastPageSize: number = 10) { }

  public get length() {
    return this.size;
  }

  public get size() {
    let n = 0;
    this.pages.forEach((page) => (n += page.length));

    return n;
  }

  public get numPages() {
    return this.pages.size;
  }

  public set(pageIdx: number, data: T[], pageSize?: number) {
    if (pageSize != null && this.lastPageSize !== pageSize) {
      this.reassignPages(pageSize);
      this.lastPageSize = pageSize;
    }

    this.pages.set(pageIdx, data);
  }

  public setPage(p: Page<T>) {
    this.set(p.meta.currentPage, p.data, p.meta.currentPageSize);
  }

  public hasPage(idx: number): boolean {
    return this.pages.has(idx);
  }

  public getPage(idx: number): T[] | null {
    return this.pages.get(idx) || null;
  }

  public replaceElement(e: T, finder: (a: T) => boolean): boolean {
    let replaced = false;

    this.pages.forEach((page) => {
      const idx = page.findIndex((d) => finder(d));
      if (idx === -1) return;

      page.splice(idx, 1, e);
      replaced = true;
    });

    return replaced;
  }

  public insert(index: number, e: T): boolean {
    const [pageIdx, elemIndex] = this.getPageIndexesByGlobalIndex(index);

    const isPageCreated = !this.pages.has(pageIdx);
    if (isPageCreated) {
      this.pages.set(pageIdx, []);
    }

    return this.insertIntoPage(pageIdx, elemIndex, e) || isPageCreated;
  }

  public asSlice(): T[] {
    const arr = [] as T[];

    this.pages.forEach((page) => {
      page.forEach((datum) => {
        arr.push(datum);
      });
    });

    return arr;
  }

  public forEach(fn: (e: T, page: number, idx: number, gidx: number) => void) {
    const orderedPages = Array.from(this.pages.keys()).sort();
    const pageSize = this.lastPageSize;

    orderedPages.forEach((pageIdx) => {
      const page = this.pages.get(pageIdx);
      if (page == null) return;

      page.forEach((e, idx) => {
        // NOTE: Global Offset - absolute position in "continuos" representation
        const gidx = pageIdx * pageSize + idx;

        fn(e, pageIdx, idx, gidx);
      });
    });
  }

  public find(finder: (e: T) => boolean): T | null {
    for (const [_, page] of this.pages) {
      const elem = page.find(finder);
      if (elem != null) return elem;
    }

    return null;
  }

  public getIncompletePages(): number[] {
    const indexes = [] as number[];

    this.pages.forEach((page, pageIndex) => {
      if (page.length === this.lastPageSize) return;

      indexes.push(pageIndex);
    });

    return indexes;
  }

  public deletePage(idx: number): boolean {
    const isDeleted = this.pages.has(idx);
    this.pages.delete(idx);

    return isDeleted;
  }

  public replaceAllPages(data: T[]) {
    this.pages.clear();
    this.pages.set(0, data.slice());
  }

  public clear() {
    this.pages.clear();
  }

  private reassignPages(pageSize: number) {
    const newPages = new Map<number, T[]>();
    const pagesToDrop = new Set<number>();

    this.forEach((e, _pageIdx, _pageOffset, globalIdx) => {
      const newPageIdx = Math.floor(globalIdx / pageSize);
      if (!newPages.has(newPageIdx)) {
        newPages.set(newPageIdx, []);
      }

      const page = newPages.get(newPageIdx) || [];
      const newPageOffset = Math.max(0, globalIdx - newPageIdx * pageSize);

      if (newPageOffset !== page.length) {
        pagesToDrop.add(newPageIdx);
      } else {
        page.push(e);
        newPages.set(newPageIdx, page);
      }
    });

    for (const pageIdx of pagesToDrop) {
      newPages.delete(pageIdx);
    }

    this.pages = newPages;
  }

  private getPageIndexesByGlobalIndex(gindex: number): [number, number] {
    const pageIndex = Math.floor(gindex / this.lastPageSize);
    gindex -= pageIndex * this.lastPageSize;

    return [pageIndex, gindex];
  }

  // NOTE: Returns true if new page was inserted
  private insertIntoPage(pageIndex: number, elemIndex: number, e: T): boolean {
    const page = this.pages.get(pageIndex);
    if (page == null) return false;

    const pageSize = this.lastPageSize;

    if (elemIndex > Math.max(page.length, 1)) {
      throw new Error(
        `PagedBuffer: failed to insert to ${elemIndex} at page ${pageIndex}:` +
        ` index is out of range (page size: ${page.length})`
      );
    }

    page.splice(elemIndex, 0, e);

    let currentPage = page;
    let currentPageIdx = pageIndex;
    let pageCreated = false;

    while (currentPage.length > pageSize) {
      if (!this.pages.has(currentPageIdx + 1)) {
        this.pages.set(currentPageIdx + 1, []);
        pageCreated = true;
      }

      const nextPage = this.pages.get(currentPageIdx + 1) || [];
      range(currentPage.length - pageSize).forEach(() => {
        const evicted = currentPage.pop();
        if (evicted == null) return;

        nextPage.unshift(evicted);
      });

      if (nextPage.length <= pageSize) break;

      currentPage = nextPage;
      currentPageIdx += 1;
    }

    return pageCreated;
  }
}
