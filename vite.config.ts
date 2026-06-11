import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'inline',
      manifest: {
        name: 'Tempestus Fulgor',
        short_name: 'Tempestus',
        description: '⚡ The storm knows. — Premium Weather Web App',
        theme_color: '#030308',
        background_color: '#030308',
        display: 'standalone',
        scope: '/tempestus-fulgor/',
        start_url: '/tempestus-fulgor/',
        icons: [
          {
            src: 'lightning.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: 'lightning.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
        ],
      },
    }),
  ],
  base: '/tempestus-fulgor/',
})
