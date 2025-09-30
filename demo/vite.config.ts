import { defineConfig } from 'vite'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      'peformer': resolve(__dirname, '../src'),
      'peformer/*': resolve(__dirname, '../src/*')
    }
  },
  build: {
    rollupOptions: {
      external: ['effect', '@effect-ts/core', '@effect-ts/system', 'xstate', '@microsoft/fast-element', '@microsoft/fast-foundation']
    }
  },
  server: {
    fs: {
      allow: ['.', '../src']
    }
  },
  optimizeDeps: {
    include: ['peformer']
  }
})