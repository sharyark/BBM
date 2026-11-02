/// <reference types="vitest" />
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [
    react(),
    // Installable app (home-screen icon, full screen). Only the app's own files are cached; /api never is,
    // so balances are always fresh and nothing works offline that needs the server.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Hisaab Portal',
        short_name: 'Hisaab',
        description: 'Khata, challan, stock and labour hisaab in one place',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#f5f7fa',
        theme_color: '#1f4e79',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        // PDFs and exports open as /api/... pages; they must reach the server, not the cached app shell.
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: {
    port: 5173,
    // In dev the API runs on :8000; in production Caddy serves both under one domain.
    proxy: { '/api': { target: process.env.VITE_API_PROXY ?? 'http://127.0.0.1:8000', changeOrigin: false } },
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: { manualChunks: { antd: ['antd', '@ant-design/icons'], react: ['react', 'react-dom', 'react-router-dom'] } },
    },
  },
  test: { include: ['src/**/*.test.{ts,tsx}'], environment: 'jsdom', setupFiles: ['./src/test/setup.ts'], globals: true, css: false },
})
