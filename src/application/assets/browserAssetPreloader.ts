import type { PreloadAsset, PreloadAssetKind } from '../../domain/assets/preloadManifest'
import {
  createInitialPreloadProgress,
  presentPreloadProgress,
  recordPreloadFailure,
  recordPreloadSuccess,
  type PreloadFailure,
  type PreloadPhase,
  type PreloadProgressSnapshot,
} from './preloadProgress'

export type AssetSourceLoader = (asset: PreloadAsset) => Promise<void>

export const DEFAULT_PRELOAD_TIMEOUT_MS = 10_000
export const DEFAULT_PRELOAD_CONCURRENCY = 4

export type BrowserAssetPreloaderOptions = {
  loadSource?: AssetSourceLoader
  timeoutMs?: number
  concurrency?: number
}

export type PreloadRequestOptions = {
  phase: PreloadPhase
  onProgress?: (snapshot: PreloadProgressSnapshot) => void
}

export type PreloadResult = PreloadProgressSnapshot & {
  failures: readonly PreloadFailure[]
}

export type BrowserAssetPreloader = {
  preload: (assets: readonly PreloadAsset[], options: PreloadRequestOptions) => Promise<PreloadResult>
  preloadInBackground: (assets: readonly PreloadAsset[]) => Promise<PreloadResult>
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

async function loadWithBrowser(asset: PreloadAsset): Promise<void> {
  if (asset.kind === 'image' || asset.kind === 'spritesheet') {
    const image = new Image()
    image.src = asset.source
    await image.decode()
    return
  }

  const response = await fetch(asset.source, { cache: 'force-cache' })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`.trim())
}

function normalizePositiveInteger(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) ? Math.max(1, Math.floor(value as number)) : fallback
}

function waitForLoad(request: Promise<void>, timeoutMs: number): Promise<void> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`Asset load timed out after ${timeoutMs}ms`)), timeoutMs)
  })

  return Promise.race([request, timeout]).finally(() => {
    if (timeoutId !== undefined) clearTimeout(timeoutId)
  })
}

export function createBrowserAssetPreloader(options: BrowserAssetPreloaderOptions = {}): BrowserAssetPreloader {
  const loadSource = options.loadSource ?? loadWithBrowser
  const timeoutMs = normalizePositiveInteger(options.timeoutMs, DEFAULT_PRELOAD_TIMEOUT_MS)
  const concurrency = normalizePositiveInteger(options.concurrency, DEFAULT_PRELOAD_CONCURRENCY)
  const completedSources = new Set<string>()
  const pendingSources = new Map<string, Promise<void>>()
  const queuedLoads: Array<() => void> = []
  let activeLoads = 0

  function runQueuedLoads(): void {
    while (activeLoads < concurrency && queuedLoads.length > 0) {
      const start = queuedLoads.shift()
      if (start) {
        activeLoads += 1
        start()
      }
    }
  }

  function startOrReuseLoad(asset: PreloadAsset): Promise<void> {
    if (completedSources.has(asset.source)) return Promise.resolve()

    const pending = pendingSources.get(asset.source)
    if (pending) return pending

    let resolveRequest!: () => void
    let rejectRequest!: (error: unknown) => void
    const request = new Promise<void>((resolve, reject) => {
      resolveRequest = resolve
      rejectRequest = reject
    })
    pendingSources.set(asset.source, request)

    queuedLoads.push(() => {
      const sourceLoad = Promise.resolve().then(() => loadSource(asset))
      void waitForLoad(sourceLoad, timeoutMs)
        .then(() => {
          resolveRequest()
        }, rejectRequest)

      void sourceLoad
        .then(() => {
          completedSources.add(asset.source)
        }, () => undefined)
        .finally(() => {
          activeLoads -= 1
          if (pendingSources.get(asset.source) === request) pendingSources.delete(asset.source)
          runQueuedLoads()
        })
    })
    runQueuedLoads()

    return request
  }

  function load(asset: PreloadAsset): Promise<void> {
    return startOrReuseLoad(asset)
  }

  async function preload(
    assets: readonly PreloadAsset[],
    requestOptions: PreloadRequestOptions,
  ): Promise<PreloadResult> {
    const uniqueAssets = [...new Map(assets.map((asset) => [asset.source, asset])).values()]
    let state = createInitialPreloadProgress(uniqueAssets.length, requestOptions.phase)

    let nextAssetIndex = 0
    async function worker(): Promise<void> {
      while (nextAssetIndex < uniqueAssets.length) {
        const asset = uniqueAssets[nextAssetIndex]
        nextAssetIndex += 1
        try {
          await load(asset)
          state = recordPreloadSuccess(state, asset.source)
        } catch (error) {
          state = recordPreloadFailure(state, {
            source: asset.source,
            kind: asset.kind as PreloadAssetKind,
            message: errorMessage(error),
          })
        }
        requestOptions.onProgress?.(presentPreloadProgress(state))
      }
    }

    await Promise.all(Array.from({ length: Math.min(concurrency, uniqueAssets.length) }, () => worker()))

    return {
      ...presentPreloadProgress(state),
      failures: state.failures,
    }
  }

  return {
    preload,
    preloadInBackground: (assets) => preload(assets, { phase: 'background' }),
  }
}
