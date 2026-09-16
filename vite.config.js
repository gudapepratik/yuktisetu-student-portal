import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/api/auth': { target: 'http://localhost:8081', changeOrigin: true },
      '/api/user': { target: 'http://localhost:8083', changeOrigin: true },
      // drive-service: the student-facing drive list, Easy Apply and withdraw.
      '/api/drive': { target: 'http://localhost:8084', changeOrigin: true }
    }
  }
});