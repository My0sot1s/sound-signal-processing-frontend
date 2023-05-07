import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://175.178.162.207:9090',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  resolve: {
    // 别名
    alias: {
      '@': resolve(__dirname, 'src'),
      sty: resolve(__dirname, 'styles'),
      pkg: resolve(__dirname, 'packages')
    }
  }
})
