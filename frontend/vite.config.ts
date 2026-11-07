import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// В dev запросы /api проксируются на backend, поэтому cookie сессии — same-origin (без CORS).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backend = env.VITE_PROXY_TARGET || 'http://127.0.0.1:8000'

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: backend,
          changeOrigin: true,
        },
      },
    },
    preview: {
      proxy: {
        '/api': {
          target: backend,
          changeOrigin: true,
        },
      },
    },
  }
})
