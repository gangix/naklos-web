import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/naklos-web/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Naklos Filo Yönetimi',
        short_name: 'Naklos',
        description: 'Filo ve nakliye yönetim sistemi',
        theme_color: '#0070f3',
        background_color: '#ffffff',
        display: 'standalone'
      }
    })
  ],
  server: {
    host: true,
    allowedHosts: [
      '.trycloudflare.com',
      '.loca.lt',
      'localhost',
      '192.168.178.121'
    ]
  }
})
