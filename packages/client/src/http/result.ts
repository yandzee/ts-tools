export class HTTPResult<T = any> {
  public static from<T = any>(res: Response): HTTPResult<T> {
    return new HTTPResult(res);
  }

  private response: Response;
  private extractedData: T | null = null;

  constructor(response: Response) {
    this.response = response;
  }

  public toString(): string {
    return this.isConnectionError
      ? this.errorMessage
      : `HTTPResult(code: ${this.status}, status: ${this.errorMessage})`;
  }

  public get isOk(): boolean {
    return this.status === 200;
  }

  public get hasJson(): boolean {
    return this.contentType === 'application/json' && (this.contentLength || 0) > 0;
  }

  public get contentType(): string | null {
    return this.response.headers.get('content-type');
  }

  public get contentLength(): number | null {
    const str = this.response.headers.get('content-length');
    if (str == null) return null;

    const parsed = parseInt(str, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  public get isSuccess(): boolean {
    const status = this.status || 0;
    return status >= 200 && status < 300;
  }

  public get isAnyServerError(): boolean {
    const status = this.status ?? 0;
    return status >= 500;
  }

  public get isConnectionError(): boolean {
    return this.response.type === 'error';
  }

  public get errorMessage(): string {
    return this.isConnectionError ? 'Network error occured' : this.response.statusText;
  }

  public get headers(): Response['headers'] {
    return this.response.headers;
  }

  public get locationHeader(): string | null {
    return this.headers.get('Location') ?? this.headers.get('location');
  }

  public get status(): number | null {
    return this.response.status;
  }

  public get statusText(): string {
    return this.response.statusText;
  }

  public get responseUrl(): string {
    return this.response.url;
  }

  public get responsePath(): string {
    try {
      const url = new URL(this.responseUrl);
      return url.pathname;
    } catch (_err) {}

    return '';
  }

  public get data(): T | null {
    return this.extractedData ?? null;
  }

  public get isBadRequest(): boolean {
    return this.status === 400;
  }

  public get isUnauthorized(): boolean {
    return this.status === 401;
  }

  public get isForbidden(): boolean {
    return this.status === 403;
  }

  public get isNotFound(): boolean {
    return this.status === 404;
  }

  public get isConflict(): boolean {
    return this.status === 409;
  }

  public get isLargeRequest(): boolean {
    return this.status === 413;
  }

  public get isCapacityLimitExceeded(): boolean {
    return this.isLargeRequest;
  }

  public get isServerError(): boolean {
    return this.status === 500;
  }

  public get isNotSupported(): boolean {
    return this.status === 501;
  }

  public get isServerOverloaded(): boolean {
    return this.status === 503;
  }

  public async arrayBuffer(): Promise<HTTPResult<ArrayBuffer>> {
    return await this.mapAsync((_) => this.response.arrayBuffer());
  }

  public async json(): Promise<HTTPResult<object>> {
    return await this.mapAsync((_) => this.response.json());
  }

  public async blob(): Promise<HTTPResult<Blob>> {
    return await this.mapAsync((_) => this.response.blob());
  }

  public async text(): Promise<HTTPResult<string>> {
    return await this.mapAsync((_) => this.response.text());
  }

  public map<D>(fn: (_: T | null) => D): HTTPResult<D> {
    const r = new HTTPResult<D>(this.response);
    r.extractedData = fn(this.extractedData);

    return r;
  }

  public async mapAsync<D>(fn: (_: T | null) => D | Promise<D>): Promise<HTTPResult<D>> {
    const d = fn(this.extractedData);
    const data = d instanceof Promise ? await d : d;

    return this.map((_) => data);
  }

  public mapSuccess<D>(fn: (_: T | null) => D): HTTPResult<D> {
    return this.map((d) => {
      return this.isOk ? fn(d) : (this.data as D);
    });
  }

  public expect(msg?: string): T {
    if (this.data == null) {
      throw new Error(`HTTPResult: data is null: ${msg || 'expected to be non null'}`);
    }

    return this.data;
  }

  public unwrap(): T | null {
    if (this.isOk) return this.data;

    throw this;
  }

  public datum(): T | null {
    return this.data;
  }
}
