import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const deployTarget = process.env.DEPLOY_TARGET
const base =
  deployTarget === 'gh-pages'
    ? '/opt-calculator/'
    : '/'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],

  // Base path adjusts for GitHub Pages vs Vercel/default hosting
  base,

  build: {
    // Production optimizations for minimal, sleek, fast-loading app
    target: 'esnext',
    minify: 'esbuild',

    // Chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'vue-vendor': ['vue', 'pinia'],
          'date-vendor': ['date-fns'],
        },
      },
    },

    // Source maps for debugging (disable if you want smaller bundle)
    sourcemap: false,

    // Optimize chunk size
    chunkSizeWarningLimit: 500,

    // CSS code splitting
    cssCodeSplit: true,
  },

  // Preview server settings
  preview: {
    port: 4173,
    strictPort: true,
  },

  // Dev server settings
  server: {
    port: 5173,
    strictPort: true,
    open: true,
  },

  esbuild: {
    drop: ['console', 'debugger'],
  },
})
