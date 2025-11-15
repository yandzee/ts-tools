export interface Retrier {
  execute: <T>(fn: DoFn<T>) => Promise<T>;
}

export type RetryContext = {
  attempt: number;
};

export type DoFn<T> = (rc: RetryContext, a?: AbortSignal) => T | Promise<T>;

export const dumb = (): Retrier => {
  return {
    execute: async <T>(fn: DoFn<T>): Promise<T> => {
      const p = fn({ attempt: 1 });
      return p instanceof Promise ? await p : p;
    },
  };
};
