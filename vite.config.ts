import { svelte } from '@sveltejs/vite-plugin-svelte'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const appCssPath = fileURLToPath(new URL('./src/app.css', import.meta.url))
const appCssRawVirtualId = '\0project-almost-app-css-raw'

export default defineConfig({
  plugins: [
    {
      name: 'project-almost-app-css-raw',
      enforce: 'pre',
      resolveId(source) {
        const [path, query] = source.split('?')
        if (query?.split('&').includes('raw') && path.endsWith('app.css')) {
          return appCssRawVirtualId
        }

        return null
      },
      load(id) {
        if (id === appCssRawVirtualId) {
          return `export default ${JSON.stringify(readFileSync(appCssPath, 'utf8'))}`
        }

        return null
      },
    },
    svelte(),
  ],
  clearScreen: false,
  server: {
    strictPort: true,
    host: '127.0.0.1',
    port: 1420,
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
})
