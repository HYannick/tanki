import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    tailwindcss(),
    vue(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['tanki-icon.svg', 'icons/tanki-192.png', 'icons/tanki-512.png', 'icons/tanki-apple-touch-icon.png'],
      manifest: {
        id: '/', name: 'Tanki · Prix carburant', short_name: 'Tanki', lang: 'fr',
        description: 'Trouvez le carburant le moins cher autour de vous.',
        start_url: '/', scope: '/', theme_color: '#17213f', background_color: '#f7f8f7', display: 'standalone',
        categories: ['travel', 'utilities'],
        icons: [
          { src: 'tanki-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icons/tanki-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/tanki-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      }
    })
  ],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } }
})
