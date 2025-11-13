// Author: Renat Tuktarov <yandzeek@gmail.com>, 2025

import { EventEmitter } from '@repo/common/misc/event-emitter';
import { Timer } from '@repo/common/misc/timer';
import { dumb, type Retrier } from '@repo/common/misc/retry';

export enum Event {
  DataReady = 'data-ready',
  GracePeriodStarted = 'grace-period-started',
  GracePeriodEnded = 'grace-period-ended',
  LoadingTriggered = 'loading-triggered',
  LoadingStarted = 'loading-started',
  LoadingAttempt = 'loading-attempt',
  LoadingSuccess = 'loading-success',
  LoadingFailed = 'loading-failed',
  LoadingFinished = 'loading-finished',
}

export type Events<T, Q, E = Error> = {
  [Event.DataReady]: (d: T, takenFromCache: boolean, q: Q) => void;
  [Event.GracePeriodStarted]: (q: Q) => void;
  [Event.GracePeriodEnded]: (q: Q) => void;
  [Event.LoadingTriggered]: (q: Q) => void;
  [Event.LoadingStarted]: (q: Q) => void;
  [Event.LoadingAttempt]: (q: Q, a: number) => void;
  [Event.LoadingSuccess]: (d: T, q: Q) => void;
  [Event.LoadingFailed]: (err: E, q: Q) => void;
  [Event.LoadingFinished]: (q: Q) => void;
};

export type Options<T, Q> = {
  loadFn: (q: Q) => Promise<T>;
  key: string;
  graceDelay?: number;
  cacheReader?: (q: Q) => T | null;
  cacheWriter?: (d: T, q: Q) => void;
  caching?: boolean;
  retrier?: Retrier;
};

export class Loader<T, Q, E = Error> extends EventEmitter<Events<T, Q, E>> {
  constructor(private readonly opts: Options<T, Q>) {
    super(opts.caching ?? true);
  }

  public get key(): string {
    return this.opts.key;
  }

  public async load(q: Q): Promise<T> {
    this.emit(Event.LoadingTriggered, q);

    if (this.opts.cacheReader != null) {
      const d = this.opts.cacheReader?.(q);

      if (d != null) {
        this.emit(Event.DataReady, d, true, q);
        return d;
      }
    }

    this.emit(Event.LoadingStarted, q);

    let graceTimer: Timer | null;
    if (this.opts.graceDelay != null) {
      graceTimer = Timer.new(this.opts.graceDelay)
        .onStarted(() => this.emit(Event.GracePeriodStarted, q))
        .onTimeout(() => this.emit(Event.GracePeriodEnded, q));
    }

    const retrier = this.opts?.retrier ?? dumb();

    return retrier
      .execute((ctx) => {
        this.emit(Event.LoadingAttempt, q, ctx.attempt);
        console.log(`Loader: attempt ${ctx.attempt}`);

        return this.opts.loadFn(q);
      })
      .then((d) => {
        this.emit(Event.LoadingSuccess, d, q);
        this.emit(Event.DataReady, d, false, q);

        this.opts.cacheWriter?.(d, q);
        return d;
      })
      .catch((err) => {
        this.emit(Event.LoadingFailed, err, q);
        throw err;
      })
      .finally(() => {
        if (graceTimer != null) {
          graceTimer.stop();
          graceTimer.offEverything();
        }

        this.emit(Event.LoadingFinished, q);
      });
  }

  public onReady(fn: (d: T, isCached: boolean) => void): this {
    this.on(Event.DataReady, fn);
    return this;
  }

  public onGracePeriodStarted(fn: Events<T, Q, E>[Event.GracePeriodStarted]): this {
    this.on(Event.GracePeriodStarted, fn);
    return this;
  }

  public onGracePeriodEnded(fn: Events<T, Q, E>[Event.GracePeriodEnded]): this {
    this.on(Event.GracePeriodEnded, fn);
    return this;
  }

  public onLoadingTriggered(fn: Events<T, Q, E>[Event.LoadingTriggered]): this {
    this.on(Event.LoadingTriggered, fn);
    return this;
  }

  public onLoadingStarted(fn: Events<T, Q, E>[Event.LoadingStarted]): this {
    this.on(Event.LoadingStarted, fn);
    return this;
  }

  public onLoadingSuccess(fn: Events<T, Q, E>[Event.LoadingSuccess]): this {
    this.on(Event.LoadingSuccess, fn);
    return this;
  }

  public onLoadingFailed(fn: Events<T, Q, E>[Event.LoadingFailed]): this {
    this.on(Event.LoadingFailed, fn);
    return this;
  }

  public onLoadingFinished(fn: Events<T, Q, E>[Event.LoadingFinished]): this {
    this.on(Event.LoadingFinished, fn);
    return this;
  }
}
