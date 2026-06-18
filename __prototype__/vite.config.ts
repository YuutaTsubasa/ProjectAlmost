import { readdirSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

const VIRTUAL_ASSET_CATALOG = 'virtual:asset-catalog'
const RESOLVED_ASSET_CATALOG = `\0${VIRTUAL_ASSET_CATALOG}`
const RUNTIME_ASSET_EXTENSIONS = new Set(['.mp3', '.ogg', '.wav', '.webp', '.woff2'])

function isRuntimeAsset(path: string): boolean {
  const normalized = path.toLowerCase()
  const extension = normalized.slice(normalized.lastIndexOf('.'))
  if (!RUNTIME_ASSET_EXTENSIONS.has(extension)) return false
  return ![
    '/.ds_store',
    '-raw.',
    '/raw-',
    '-concept.',
  ].some((fragment) => normalized.includes(fragment))
    && !/\/(?:cast|crouch|death|hurt)-\d+\.webp$/.test(normalized)
}

function collectRuntimeAssets(directory: string, publicDirectory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = join(directory, entry.name)
    if (entry.isDirectory()) return collectRuntimeAssets(absolutePath, publicDirectory)
    const publicPath = `/${relative(publicDirectory, absolutePath).split(sep).join('/')}`
    return isRuntimeAsset(publicPath) ? [publicPath] : []
  })
}

function assetCatalogPlugin(): Plugin {
  let publicDirectory = ''

  return {
    name: 'asset-catalog',
    configResolved(config) {
      publicDirectory = config.publicDir
    },
    resolveId(id) {
      if (id === VIRTUAL_ASSET_CATALOG) return RESOLVED_ASSET_CATALOG
    },
    load(id) {
      if (id !== RESOLVED_ASSET_CATALOG) return
      const assets = collectRuntimeAssets(join(publicDirectory, 'assets'), publicDirectory).sort()
      return `export default ${JSON.stringify(assets)}`
    },
    configureServer(server) {
      const assetsDirectory = join(publicDirectory, 'assets')
      server.watcher.add(assetsDirectory)
      const refreshCatalog = (path: string) => {
        if (!path.startsWith(assetsDirectory)) return
        const catalogModule = server.moduleGraph.getModuleById(RESOLVED_ASSET_CATALOG)
        if (catalogModule) server.moduleGraph.invalidateModule(catalogModule)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', refreshCatalog)
      server.watcher.on('unlink', refreshCatalog)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [assetCatalogPlugin(), svelte()],
})
