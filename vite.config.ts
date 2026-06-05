import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react-vendor',
              test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
            },
            {
              name: 'supabase-vendor',
              test: /[\\/]node_modules[\\/](@supabase|@realtime|@postgrest|@gotrue|@storage-js)[\\/]/,
            },
            {
              name: 'map-vendor',
              test: /[\\/]node_modules[\\/](leaflet|react-leaflet|@react-leaflet)[\\/]/,
            },
            {
              name: 'ui-vendor',
              test: /[\\/]node_modules[\\/](lucide-react|dayjs|zod)[\\/]/,
            },
          ],
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      selfDestroying: true,
      includeAssets: ['favicon.svg', 'icons.svg', 'og-image.svg', 'robots.txt', 'sitemap.xml'],
      manifest: {
        name: 'Velozty',
        short_name: 'Velozty',
        description: 'Crie corridas, desafie amigos e acompanhe todo mundo no mapa em tempo real.',
        lang: 'pt-BR',
        theme_color: '#f4f4f9',
        background_color: '#f4f4f9',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
