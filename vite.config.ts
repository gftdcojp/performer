import { defineConfig } from 'vite'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    target: 'esnext',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'Performer',
      fileName: (format) => `performer.${format}.js`
    },
    rollupOptions: {
      external: [
        // Externalize Effect-TS dependencies
        '@effect-ts/core',
        '@effect-ts/system',
        '@effect-ts/data',
        '@effect-ts/io',
        '@effect-ts/stream',
        // Externalize XState
        'xstate',
        // Externalize Web Components
        '@microsoft/fast-element',
        '@microsoft/fast-foundation',
      ],
      output: {
        globals: {
          '@effect-ts/core': 'Effect',
          '@effect-ts/system': 'EffectSystem',
          '@effect-ts/data': 'EffectData',
          '@effect-ts/io': 'EffectIO',
          '@effect-ts/stream': 'EffectStream',
          'xstate': 'XState',
          '@microsoft/fast-element': 'FASTElement',
          '@microsoft/fast-foundation': 'FASTFoundation',
        },
      },
    },
  },
  optimizeDeps: {
    exclude: [
      '@microsoft/fast-element',
      '@microsoft/fast-foundation',
    ],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/domain': resolve(__dirname, 'src/domain'),
      '@/actor': resolve(__dirname, 'src/actor'),
      '@/ui': resolve(__dirname, 'src/ui'),
      '@/wasm': resolve(__dirname, 'src/wasm'),
      '@/rpc': resolve(__dirname, 'src/rpc'),
      '@/cli': resolve(__dirname, 'src/cli'),
    },
  },
  server: {
    fs: {
      allow: ['.']
    }
  },
})
