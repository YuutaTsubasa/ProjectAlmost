import type { PreloadAsset } from '../../domain/assets/preloadManifest'
import {
  createInitialPreloadProgress,
  presentPreloadProgress,
  recordPreloadFailure,
  recordPreloadSuccess,
  type PreloadFailure,
  type PreloadPhase,
  type PreloadProgressSnapshot,
} from './preloadProgress'

export type AssetSourceLoader = (asset: PreloadAsset, signal: AbortSignal) => Promise<void>

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

function abortReason(signal: AbortSignal): unknown {
  return signal.reason ?? new Error('Asset load aborted')
}

function loadImageWithBrowser(asset: PreloadAsset, signal: AbortSignal): Promise<void> {
  if (signal.aborted) return Promise.reject(abortReason(signal))

  const image = new Image()
  return new Promise<void>((resolve, reject) => {
    let settled = false
    const cleanup = (): void => signal.removeEventListener('abort', handleAbort)
    const resolveLoad = (): void => {
      if (settled) return
      settled = true
      cleanup()
      resolve()
    }
    const rejectLoad = (error: unknown): void => {
      if (settled) return
      settled = true
      cleanup()
      reject(error)
    }
    const handleAbort = (): void => {
      image.src = ''
      rejectLoad(abortReason(signal))
    }

    signal.addEventListener('abort', handleAbort, { once: true })
    image.src = asset.source
    void image.decode().then(resolveLoad, rejectLoad)
  })
}

async function loadWithBrowser(asset: PreloadAsset, signal: AbortSignal): Promise<void> {
  if (asset.kind === 'image' || asset.kind === 'spritesheet') {
    await loadImageWithBrowser(asset, signal)
    return
  }

  const response = await fetch(asset.source, { cache: 'force-cache', signal })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`.trim())
}

function normalizePositiveInteger(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) ? Math.max(1, Math.floor(value as number)) : fallback
}

function waitForLoad(
  request: Promise<void>,
  timeoutMs: number,
  abortController: AbortController,
): Promise<void> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      const error = new Error(`Asset load timed out after ${timeoutMs}ms`)
      reject(error)
      abortController.abort(error)
    }, timeoutMs)
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
      let slotReleased = false
      const releaseSlot = (): void => {
        if (slotReleased) return
        slotReleased = true
        activeLoads -= 1
        runQueuedLoads()
      }
      const abortController = new AbortController()
      const sourceLoad = Promise.resolve().then(() => loadSource(asset, abortController.signal))
      void waitForLoad(sourceLoad, timeoutMs, abortController)
        .then(() => {
          resolveRequest()
        }, (error) => {
          rejectRequest(error)
        })

      void sourceLoad
        .then(() => {
          completedSources.add(asset.source)
        }, () => undefined)
        .finally(() => {
          if (pendingSources.get(asset.source) === request) pendingSources.delete(asset.source)
          releaseSlot()
        })
    })
    runQueuedLoads()

    return request
  }

  async function preload(
    assets: readonly PreloadAsset[],
    requestOptions: PreloadRequestOptions,
  ): Promise<PreloadResult> {
    const uniqueAssets = [...new Map(assets.map((asset) => [asset.source, asset])).values()]
    let state = createInitialPreloadProgress(uniqueAssets.length, requestOptions.phase)

    let nextAssetIndex = 0
    // Physical load slots are shared globally; workers only advance this request's logical progress.
    async function worker(): Promise<void> {
      while (nextAssetIndex < uniqueAssets.length) {
        const asset = uniqueAssets[nextAssetIndex]
        nextAssetIndex += 1
        try {
          await startOrReuseLoad(asset)
          state = recordPreloadSuccess(state, asset.source)
        } catch (error) {
          state = recordPreloadFailure(state, {
            source: asset.source,
            kind: asset.kind,
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
