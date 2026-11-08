import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The 3D world is a lazy chunk, so normally the browser only asks for it after the main script has
// downloaded and run. This adds <link rel="modulepreload"> for it (and the chunks it imports, three.js
// among them) so they download in parallel with the main script, straight from the HTML.
function preloadWorld() {
  let base = '/'
  return {
    name: 'preload-3d-world',
    apply: 'build',
    configResolved(config) {
      base = config.base
    },
    transformIndexHtml: {
      order: 'post',
      handler(html, { bundle }) {
        if (!bundle) return html
        const chunks = Object.values(bundle).filter((c) => c.type === 'chunk')
        const world = chunks.find((c) => c.facadeModuleId?.replace(/\\/g, '/').endsWith('/src/world3d/World3D.jsx'))
        if (!world) return html
        const files = new Set()
        const visit = (file) => {
          if (files.has(file)) return
          files.add(file)
          const chunk = bundle[file]
          if (chunk?.type === 'chunk') chunk.imports.forEach(visit)
        }
        visit(world.fileName)
        const entry = chunks.find((c) => c.isEntry)
        if (entry) {
          files.delete(entry.fileName)
          entry.imports.forEach((f) => files.delete(f))
        }
        const tags = [...files].map((f) => `    <link rel="modulepreload" crossorigin href="${base}${f}">`).join('\n')
        return html.replace('</head>', `${tags}\n  </head>`)
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), preloadWorld()],
  build: {
    // three.js and the React renderer for it make one ~900 kB chunk. It is lazy-loaded and preloaded
    // in parallel with the main script (see above), so the size warning is expected
    chunkSizeWarningLimit: 1000,
  },
})
