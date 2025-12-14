import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin'; // Ditambahkan: Wajib ada karena dipakai di plugins
import react from '@vitejs/plugin-react';  // Diperbaiki: Hanya satu import
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    laravel({
        input: ['src/main.jsx'], 
        refresh: true,
        // Pastikan path ini benar-benar ada relatif dari folder frontend
        publicDirectory: '../backend/public', 
    }),
    react(), 
    tailwindcss(),
  ],
  server: {
    host: '127.0.0.1',
    proxy: {
      '/api': {
        target: 'https://kompeta.web.bps.go.id', 
        changeOrigin: true,
        secure: false,
      },
      '/storage': {
         target: 'https://kompeta.web.bps.go.id',
         changeOrigin: true,
      }
    },
  },
});