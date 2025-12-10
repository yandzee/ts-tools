import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@repo/tsdown';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  entry: [resolve(__dirname, 'src/loader.ts')],
  watch: true,
  ignoreWatch: ['tsdown.*'],
  dts: {
    sourcemap: true,
  },
});
