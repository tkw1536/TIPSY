// eslint-disable-next-line @typescript-eslint/triple-slash-reference -- needed for vitest config
/// <reference types="vitest" />
import prefresh from '@prefresh/vite'
import { defineConfig } from 'vite'
import macros from 'unplugin-parcel-macros'
import { resolve } from 'node:path'

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- hack broke
export default defineConfig({
  plugins: [prefresh(), macros.vite()],
  worker: {
    format: 'es',
  },
  resolve: {
    alias: {
      'react-dom/test-utils': 'preact/test-utils',
      'react-dom': 'preact/compat',
      'react': 'preact/compat',
    },
  },
  build: {
    rollupOptions: {
      input: {
        inspector: resolve(__dirname, 'index.html'),
        rdf: resolve(__dirname, 'rdf', 'index.html'),
      },
      output: {
        manualChunks: {
          // define a couple smaller chunks for vis-network
          'vis-network': ['vis-network'],
          'vis-data': ['vis-data'],
          'vis-network-css': [
            'vis-network/dist/dist/vis-network.min.css?inline',
          ],
        },
      },
    },
  },
  test: {
    environment: 'happy-dom',
  },
} as unknown as any)
