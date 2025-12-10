import { defineConfig } from '@repo/tsdown';

export default defineConfig(
  {
    entry: {
      'data/page': 'src/data/page.ts',
      'data/pages': 'src/data/pages.ts',
      disposer: 'src/disposer/index.ts',
      events: 'src/events/index.ts',
      'http/api': 'src/http/api.ts',
      'http/client': 'src/http/client.ts',
      'http/result': 'src/http/result.ts',
      'http/index': 'src/http/index.ts',
      loader: 'src/loader/index.ts',
      timer: 'src/timer/index.ts',
      types: 'src/types/index.ts',
      'utils/index': 'src/utils/index.ts',
      'zod/date': 'src/zod/date.ts',
      dom: 'src/dom.ts',
    },
    watch: true,
    ignoreWatch: ['tsdown.*'],
    dts: {
      sourcemap: true,
    },
  },
  { node: false },
);
