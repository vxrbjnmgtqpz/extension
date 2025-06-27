import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        proxy: './src/proxy.html',
      },
    },
  },
})
