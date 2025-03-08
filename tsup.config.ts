import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'dist/index': 'src/index.ts',
    utils: 'src/utils.ts',
    'plugins/error-retry': 'src/plugins/error-retry.ts',
    'plugins/throttle': 'src/plugins/throttle.ts',
    'plugins/dedupe': 'src/plugins/dedupe.ts',
    'plugins/cache': 'src/plugins/cache.ts',
    'plugins/progress': 'src/plugins/progress.ts',
    'plugins/mock': 'src/plugins/mock.ts',
    'plugins/error-cache': 'src/plugins/error-cache.ts',
    'plugins/token-refresh': 'src/plugins/token-refresh.ts',
  },
  outDir: './',
  splitting: true,
  format: ['esm', 'cjs'],
  minify: true,
  target: 'esnext',
  dts: true,
});
