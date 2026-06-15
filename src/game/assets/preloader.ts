import assetCatalog from 'virtual:asset-catalog'

type PreloadProgress = (completed: number, total: number) => void

const IMAGE_EXTENSIONS = /\.webp$/i
const AUDIO_EXTENSIONS = /\.(?:mp3|ogg|wav)$/i
const FONT_EXTENSIONS = /\.woff2$/i
const PRELOAD_CONCURRENCY = 4
const ASSET_PRELOAD_TIMEOUT_MS = 8000

const loadedAssets = new Set<string>()
const pendingAssets = new Map<string, Promise<void>>()

export const runtimeAssets = assetCatalog

export const bootAssets = runtimeAssets.filter((source) =>
  source.startsWith('/assets/fonts/')
  || source.startsWith('/assets/title/')
  || source === '/assets/audio/titlescreen.mp3'
  || source.startsWith('/assets/audio/sfx/ui-'),
)

export const sharedGameplayAssets = runtimeAssets.filter((source) =>
  source.startsWith('/assets/hud/')
  || source.startsWith('/assets/props/')
  || source.startsWith('/assets/results/')
  || source.startsWith('/assets/sprites/')
  || source.startsWith('/assets/tiles/')
  || source.startsWith('/assets/avg/')
  || source.startsWith('/assets/audio/sfx/')
  || source === '/assets/audio/game_result.mp3',
)

export function getWorldAssets(worldIndex: number): string[] {
  const world = String(worldIndex).padStart(2, '0')
  return runtimeAssets.filter((source) =>
    source.includes(`world${world}_`)
    || (worldIndex === 1 && (
      source.startsWith('/assets/maps/white_palace_')
      || source.includes('white-palace')
    )),
  )
}

export const worldSelectAssets = runtimeAssets.filter((source) => /_stage_select\.webp$/i.test(source))

async function fetchAndCache(source: string): Promise<void> {
  const response = await fetch(source, { cache: 'force-cache' })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
  await response.blob()
}

async function withTimeout(source: string, promise: Promise<void>): Promise<void> {
  let timeoutId: number | undefined
  try {
    await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeoutId = window.setTimeout(
          () => reject(new Error(`Timed out after ${ASSET_PRELOAD_TIMEOUT_MS}ms`)),
          ASSET_PRELOAD_TIMEOUT_MS,
        )
      }),
    ])
  } finally {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId)
  }
}

function loadAsset(source: string): Promise<void> {
  if (loadedAssets.has(source)) return Promise.resolve()
  const existing = pendingAssets.get(source)
  if (existing) return existing

  const pending = withTimeout(source, (async () => {
    if (IMAGE_EXTENSIONS.test(source)) {
      const image = new Image()
      image.src = source
      await image.decode()
    } else if (AUDIO_EXTENSIONS.test(source)) {
      await fetchAndCache(source)
    } else if (FONT_EXTENSIONS.test(source)) {
      await fetchAndCache(source)
    }
    loadedAssets.add(source)
  })()).finally(() => pendingAssets.delete(source))

  pendingAssets.set(source, pending)
  return pending
}

export async function preloadAssets(sources: readonly string[], onProgress?: PreloadProgress): Promise<void> {
  const uniqueSources = [...new Set(sources)]
  let nextIndex = 0
  let completed = 0

  const worker = async () => {
    while (nextIndex < uniqueSources.length) {
      const source = uniqueSources[nextIndex++]
      try {
        await loadAsset(source)
      } catch (error) {
        console.warn(`Unable to preload ${source}`, error)
      } finally {
        completed += 1
        onProgress?.(completed, uniqueSources.length)
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(PRELOAD_CONCURRENCY, uniqueSources.length) }, worker))
}

export function preloadInBackground(sources: readonly string[]): void {
  void preloadAssets(sources)
}
