import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './app'),
      '@pkg': resolve(__dirname, '../../../packages'),
    },
  },
  server: {
    port: 3001, // 3000が競合していたので3001に変更
    host: true,
    hmr: {
      overlay: false, // エラーオーバーレイを無効化
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
})
