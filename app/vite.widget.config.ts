import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The in-chat widget (PRD v33, FR-27): a separate small bundle, not the web app. Built into
// widget-dist/ as one script + one stylesheet (fonts inlined), which worker/mcp/widget.ts puts
// into a single HTML page: AI apps show it in a sandboxed frame that can't load other files.
export default defineConfig({
  plugins: [react()],
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    outDir: 'widget-dist',
    emptyOutDir: true,
    assetsInlineLimit: 200_000,
    lib: {
      entry: 'widget/main.tsx',
      formats: ['iife'],
      name: 'HikingBuddyWidget',
      fileName: () => 'widget.js',
      cssFileName: 'widget',
    },
  },
})
