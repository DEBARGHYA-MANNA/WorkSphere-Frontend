import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // The browser never talks to a hard-coded API host. Requests to /api are
  // proxied by Vite in development (and by the reverse proxy in production),
  // which keeps the refresh-token cookie same-origin.
  const proxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:3000'

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: Number(env.PORT) || 5173,
      strictPort: false,
      // Allow the sandbox preview host (e.g. 5173-<id>.e2b.app) through.
      allowedHosts: true,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      host: '0.0.0.0',
      port: Number(env.PORT) || 4173,
      allowedHosts: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
      chunkSizeWarningLimit: 900,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./tests/setup.js'],
      css: false,
      // The organization and shell specs both mount the full router and share
      // jsdom's single document; forked, isolated workers keep focus and timers
      // from leaking between files so the suite cannot flake on load order.
      isolate: true,
      pool: 'forks',
      include: ['src/**/*.{test,spec}.{js,jsx}', 'tests/**/*.{test,spec}.{js,jsx}'],
      exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
        reportsDirectory: './coverage',
        exclude: [
          'node_modules/**',
          'dist/**',
          'tests/**',
          'src/main.jsx',
          '**/*.config.js',
          'src/components/ui/**',
        ],
      },
    },
  }
})
