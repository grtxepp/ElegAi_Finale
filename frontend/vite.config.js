import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The dev server proxies API + image requests to the Express backend,
// so the browser never talks to the database or backend directly.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: true, // allow the sandbox preview host
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      '/images': { target: 'http://localhost:5000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
});
