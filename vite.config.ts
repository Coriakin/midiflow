import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    host: true,
    strictPort: true, // Don't try other ports if 3000 is occupied
    open: false // Don't auto-open browser
  },
  build: {
    target: 'esnext'
  }
})
