import { ExtensibleFunction } from '~/types';

export type DisposeFn = () => void;
export type AnyDisposer = null | undefined | DisposeFn | Disposer;

export class Disposer extends ExtensibleFunction {
  private subdisposers: Set<DisposeFn> = new Set();

  public static chain(...fns: AnyDisposer[]): Disposer {
    return new Disposer().chainArray(fns);
  }

  public static new(): Disposer {
    return new Disposer();
  }

  constructor() {
    super(() => {
      this.subdisposers.forEach((d) => {
        d();
      });

      this.subdisposers.clear();
    });
  }

  public chain(...fns: AnyDisposer[]): Disposer {
    return this.chainArray(fns);
  }

  public chainArray(fns: AnyDisposer[]): this {
    for (const fn of fns) {
      if (fn == null) continue;

      this.subdisposers.add(fn instanceof Disposer ? fn.asFunction() : fn);
    }

    return this;
  }

  public asFunction(): DisposeFn {
    return this as any;
  }
}
