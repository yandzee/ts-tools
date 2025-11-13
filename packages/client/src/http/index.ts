export type FetchFunction = (r: Request) => Promise<Response>;

export enum HttpMethod {
  Get = 'GET',
  Post = 'POST',
  Put = 'PUT',
  Head = 'HEAD',
  Delete = 'DELETE',
  Options = 'OPTIONS',
}
