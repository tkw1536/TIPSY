// eslint-disable-next-line @typescript-eslint/triple-slash-reference -- needed for vitest config
/// <reference types="vitest" />
import prefresh from '@prefresh/vite'
import { defineConfig } from 'vitest/config'
import macros from 'unplugin-parcel-macros'
import { resolve } from 'node:path'

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
    rolldownOptions: {
      input: {
        inspector: resolve(__dirname, 'index.html'),
        rdf: resolve(__dirname, 'rdf', 'index.html'),
      },
    },
  },
  test: {
    environment: 'happy-dom',
  },
})
