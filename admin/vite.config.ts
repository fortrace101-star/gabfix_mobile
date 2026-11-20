import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    fs: {
      // The rate card reads the single pricing source used by the mobile app.
      allow: ['..'],
    },
  },
});
