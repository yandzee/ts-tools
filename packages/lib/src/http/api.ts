import { HttpClient } from '~/http/client';
import type { FetchFunction } from './types';

export interface APIBaseOptions {
  fetch: FetchFunction;
  baseURL: string;
  origin?: string;
  timeout?: number;
}

export class APIClientBase {
  protected perRequestHeaders: Headers = new Headers();
  protected http: HttpClient;
  protected refreshToken: string | null = null;

  constructor(protected readonly opts: APIBaseOptions) {
    this.http = new HttpClient({
      fetch: opts.fetch,
      origin: opts.origin,
      baseURL: opts.baseURL,
      headers: this.perRequestHeaders,
      timeout: opts.timeout ?? 20 * 1000,
      cors: true,
    });
  }

  public assignSharedHeaders(h: HeadersInit) {
    HttpClient.assignHeaders(this.perRequestHeaders, h);
  }

  public dropHeaders(...headers: string[]) {
    headers.forEach((header) => {
      this.perRequestHeaders.delete(header);
    });
  }
}
