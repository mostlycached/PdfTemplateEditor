/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./client/src/test/setup.ts'],
    include: [
      './client/src/test/**/*.test.{ts,tsx}',
      './server/test/**/*.test.{ts,tsx}'
    ],
    // Use different environments for different test files
    environmentMatchGlobs: [
      ['./client/src/test/**/*.test.{ts,tsx}', 'jsdom'],
      ['./server/test/**/*.test.{ts,tsx}', 'node']
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@components': path.resolve(__dirname, './client/src/components'),
      '@assets': path.resolve(__dirname, './client/src/assets'),
      '@lib': path.resolve(__dirname, './client/src/lib'),
      '@hooks': path.resolve(__dirname, './client/src/hooks'),
      '@pages': path.resolve(__dirname, './client/src/pages'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
});