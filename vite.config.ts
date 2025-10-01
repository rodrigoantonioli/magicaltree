import { defineConfig } from 'vite';

const repoName = 'magicaltree';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  base: process.env.GHPAGES === 'true' ? `/${repoName}/` : '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true
  },
  server: {
    open: true
  }
});
