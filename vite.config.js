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
      '/api/drive': { target: 'http://localhost:8084', changeOrigin: true },
      // The in-app bell. Added when the notification producers were wired: the
      // service had been running on 8085 with a working inbox API that no
      // portal could reach, so every in-app notification it wrote was invisible.
      '/api/notification': { target: 'http://localhost:8085', changeOrigin: true }
    }
  }
});