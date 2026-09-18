import { defineConfig } from 'vite';

export default defineConfig({
  root: process.env.VERCEL ? '.' : (process.platform === 'win32' && process.cwd().startsWith('A:') ? 'E:/KruuuuLove' : '.'),
  build: {
    outDir: 'dist',
    emptyOutDir: false
  },
  server: {
    port: 5173,
    open: false,
    host: true
  }
});
