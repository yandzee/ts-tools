import { isArray } from '~/misc/types';

import { HttpMethod, type FetchFunction } from './types';
import { HTTPResult } from './result';

export type Options = {
  fetch: FetchFunction;
  cors: boolean;
  baseURL?: string;
  origin?: string;
  timeout?: number;
  headers?: HeadersInit;
};

export type RequestConfig = Partial<Omit<Options, 'fetch'>>;
export type BeforeRequestFn = () => void;

export class HttpClient {
  constructor(private readonly opts: Options) {}

  public async get(path: string, cfg?: RequestConfig): Promise<HTTPResult> {
    return await this.doRequest(HttpMethod.Get, path, null, cfg);
  }

  public async post(path: string, data: any, cfg?: RequestConfig): Promise<HTTPResult> {
    return this.doRequest(HttpMethod.Post, path, data, cfg);
  }

  public async put(path: string, data: any, cfg?: RequestConfig): Promise<HTTPResult> {
    return this.doRequest(HttpMethod.Put, path, data, cfg);
  }

  public async delete(path: string, data: any, cfg?: RequestConfig): Promise<HTTPResult> {
    return this.doRequest(HttpMethod.Delete, path, data, cfg);
  }

  public async head(path: string, cfg?: RequestConfig): Promise<HTTPResult> {
    return await this.doRequest(HttpMethod.Head, path, null, cfg);
  }

  private async doRequest(
    method: HttpMethod,
    path: string,
    data?: any,
    cfg?: RequestConfig,
  ): Promise<HTTPResult> {
    const [req, beforeRequest] = this.buildRequest(method, path, data, cfg);
    beforeRequest?.();

    console.log(`Calling fetch`, this.opts.fetch, req, method, path, data, cfg);
    return this.opts.fetch(req).then(HTTPResult.from);
  }

  private buildRequest(
    method: HttpMethod,
    path: string,
    data?: any,
    cfg?: RequestConfig,
  ): [Request, BeforeRequestFn | null] {
    const headers = new Headers();

    const origin = this.getOrigin(cfg);
    if (origin != null) {
      headers.append('origin', origin);
    }

    if (this.opts.cors) {
      headers.append('access-control-request-method', method);
      headers.append('access-control-request-headers', 'content-type, content-length');
    }

    let body = data;
    if (data != null) {
      const [contentType, contentLength] = this.getContentProps(data);

      headers.append('content-type', contentType);
      headers.append('content-length', contentLength);

      if (contentType === 'application/json') {
        body = Object.hasOwn(data, 'toJSON') ? data : JSON.stringify(data);
      }
    }

    this.assignHeaders(headers, this.opts.headers, cfg?.headers);

    let controller: AbortController | null = null;
    let beforeRequest: BeforeRequestFn | null = null;

    const timeout = cfg?.timeout ?? this.opts.timeout;
    if (timeout != null) {
      controller = new AbortController();

      beforeRequest = () => {
        setTimeout(() => controller?.abort(`timeout of ${timeout}ms is reached`), timeout);
      };
    }

    const urlStr = this.ensureRequestUrl(path, cfg);
    const req = new Request(urlStr, {
      method,
      body,
      mode: this.opts.cors ? 'cors' : 'same-origin',
      headers,
      signal: controller?.signal,
      credentials: this.opts.cors ? 'include' : 'same-origin',
    });

    return [req, beforeRequest];
  }

  private assignHeaders(to: Headers, ...rest: (HeadersInit | null | undefined)[]) {
    HttpClient.assignHeaders(to, ...rest);
  }

  public static assignHeaders(to: Headers, ...rest: (HeadersInit | null | undefined)[]) {
    for (const h of rest) {
      if (!h) continue;

      if (h instanceof Headers) {
        h.forEach((value, key) => {
          to.set(key, value);
        });

        continue;
      }

      if (isArray(h)) {
        for (const [key, value] of h) {
          to.set(key, value);
        }

        continue;
      }

      for (const [key, value] of Object.entries(h)) {
        to.set(key, value);
      }
    }
  }

  private ensureRequestUrl(s: string, ...opts: (RequestConfig | undefined)[]): string {
    // NOTE: Return original s if its dedicated absolute url.
    try {
      new URL(s);
      return s;
    } catch (err: any) {
      void err;
    }

    let rawBaseURL: string | null = null;

    for (const o of opts) {
      if (!o || o.baseURL == null) continue;

      rawBaseURL = o.baseURL;
      break;
    }

    if (rawBaseURL == null) {
      rawBaseURL = this.opts.baseURL || '';
    }

    rawBaseURL = rawBaseURL.endsWith('/') ? rawBaseURL.slice(0, -1) : rawBaseURL;
    const path = s.startsWith('/') ? s.slice(1) : s;

    const final = `${rawBaseURL}/${path}`;
    return final;
  }

  private getOrigin(...opts: (RequestConfig | undefined)[]): string | null {
    // NOTE: Options first
    for (const o of opts) {
      if (!o) continue;

      if (o.origin != null) return o.origin;
    }

    // NOTE: Then the config
    if (this.opts.origin != null) return this.opts.origin;

    // NOTE: Fallback to `window` if possible
    if (typeof window === 'undefined') return null;
    return window.origin;
  }

  private getContentProps(data: any): [string, string] {
    if (data instanceof Uint8Array) {
      return ['application/octet-stream', `${data.length}`];
    } else if (data instanceof ArrayBuffer) {
      return ['application/octet-stream', `${data.byteLength}`];
    } else if (data instanceof FormData) {
      const msg = 'FormData payload is not supported yet';
      console.error(msg);

      throw new Error(msg);
    }

    const str = JSON.stringify(data);
    return ['application/json', `${str.length}`];
  }
}
