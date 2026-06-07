import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const isGhPages = process.env.MODE === 'ghpages';

export default defineConfig({
  plugins: [react()],
  base: isGhPages ? '/crm-de-ventas/' : '/',
  define: isGhPages ? { 'import.meta.env.VITE_MOCK': '"true"' } : {},
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
});
