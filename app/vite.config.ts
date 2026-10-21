import { cloudflare } from '@cloudflare/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// The Cloudflare plugin runs the Worker (./worker, /api and /auth) inside `npm run dev`, with a
// local copy of the D1 database, and builds it next to the app for deployment.
export default defineConfig({
  plugins: [react(), cloudflare()],
})
