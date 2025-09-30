/// <reference types="vitest" />
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'esnext',
  },
  optimizeDeps: {
    exclude: ['@microsoft/fast-element'],
  },
  test: {
    globals: true,
    environment: 'node',
  },
})
