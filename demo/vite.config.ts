import { defineConfig } from 'vite'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      'performer': resolve(__dirname, '../src'),
      'performer/*': resolve(__dirname, '../src/*')
    }
  },
  build: {
    rollupOptions: {
      external: ['effect', '@effect-ts/core', '@effect-ts/system', '@gftdcojp/effect-actor', '@microsoft/fast-element', '@microsoft/fast-foundation']
    }
  },
  server: {
    fs: {
      allow: ['.', '../src']
    }
  },
  optimizeDeps: {
    include: ['performer']
  }
})