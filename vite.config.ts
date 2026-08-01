import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

export default defineConfig({
  plugins: [solid()],
  server: {
    port: 4173,
    proxy: { '/graphql': 'http://127.0.0.1:8080', '/api': 'http://127.0.0.1:8080', '/auth': 'http://127.0.0.1:8080' },
  },
})
