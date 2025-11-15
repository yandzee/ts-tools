import { z } from 'zod';

export const pageMeta = z.object({
  totalEntries: z.number(),
  totalPages: z.number(),
  pageSizeLimit: z.number(),
  currentPage: z.number(),
  currentPageSize: z.number(),
});

export const unparsedPage = z.object({
  data: z.array(z.any()).catch(() => []),
  meta: pageMeta,
});

export type UnparsedPage = z.infer<typeof unparsedPage>;
export type PageMeta = z.infer<typeof pageMeta>;

export type Page<T> = {
  data: T[];
  meta: PageMeta;
};
