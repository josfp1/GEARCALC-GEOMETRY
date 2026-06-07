import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // All files are in root — tell Vite where to find them
  root: '.',
  publicDir: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: 'index.html',
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Gear Calc — Desarrollos de Bicicleta',
        short_name: 'GearCalc',
        description: 'Calculadora de desarrollos SRAM con presión tubeless',
        theme_color: '#18181b',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
      },
    })
  ]
})
