import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Base path for Databricks Apps deployment (only in production)
  base: process.env.NODE_ENV === 'production' ? '/apps/synthetic-data-generator-react/' : '/',

  // Build configuration
  build: {
    // Enable source maps for debugging in production
    sourcemap: true,

    // Optimize chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for React and MUI
          vendor: ['react', 'react-dom', 'react-router-dom'],
          mui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
        },
      },
    },
  },

  // Development server configuration
  server: {
    port: 5173,
    // Proxy API calls to Databricks during local development
    proxy: {
      '/api/2.0': {
        target: 'https://e2-demo-field-eng.cloud.databricks.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      },
      '/oauth': {
        target: 'https://e2-demo-field-eng.cloud.databricks.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
