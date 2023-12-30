import { defineConfig } from 'vite'

export default defineConfig({
  // only needed when symlinking excalibur
  optimizeDeps: {
    include: ['excalibur'],
  },
  resolve: {
    dedupe: ['excalibur'],
  },
})
