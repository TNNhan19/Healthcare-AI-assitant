import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy các request chat đến chatbot service
      '/api/chat': {
        target: 'http://localhost:8002',
        changeOrigin: true,
      },
      // Proxy các request khác đến main backend
      '/api': {
        target: 'https://health-care-app-uszu.onrender.com',
        changeOrigin: true,
      },
    },
    https: false,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
