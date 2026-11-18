import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  optimizeDeps: {
    exclude: ['@supabase/supabase-js']
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        kingdom: resolve(__dirname, 'kingdom/index.html')
      }
    }
  },
  server: {
    port: 5173,
    open: false,
    host: true
  }
});
