import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  clearScreen: false,
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
      fileName: 'lib',
      formats: ['es', 'cjs'],
    },
  },
});
