import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      workbox: {
        // playroomkit (chunk Lobby-*.js, protótipo V2 em /v2/quem-sou-eu) é
        // ~800kB, e puxa o SDK do Discord (peer dep opcional que não usamos,
        // vira o chunk output-*.js) — nenhum dos dois faz sentido pré-cachear
        // pra todo usuário da V1 que nunca visita essa rota. Fora do
        // precache; se alguém abrir /v2 mesmo assim, carrega sob demanda e o
        // navegador cacheia normal. Nomes de chunk são auto-gerados — se o
        // precache crescer de novo inesperadamente depois de mexer em
        // dependências, procurar chunk novo só alcançável a partir de
        // Lobby.js e adicionar aqui.
        globIgnores: ['**/Lobby-*', '**/output-*.js'],
      },
      manifest: {
        name: 'Projeto Célula',
        short_name: 'Célula',
        description: 'Biblioteca de pregações, quebra-gelos e utilitários para células.',
        theme_color: '#0a0805',
        background_color: '#0a0805',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
})
