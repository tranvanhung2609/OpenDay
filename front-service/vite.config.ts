import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 4000,
    hmr: {
      host: 'openday.openlab.com.vn',
      port: 443,
      protocol: 'wss',
      clientPort: 443
    },
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'openday.openlab.com.vn',
      'www.openday.openlab.com.vn',
      '14.225.255.177'
    ],
    proxy: {
      '/mqtt': {
        target: 'http://localhost:8084',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  define: {
    global: 'globalThis',
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['react-router-dom'],
  },
});
