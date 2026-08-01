import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PreloadAsset } from '../../domain/assets/preloadManifest'
import { createBrowserAssetPreloader } from './browserAssetPreloader'

const imageAsset: PreloadAsset = {
  id: 'title-background',
  source: '/assets/title/project-almost-title-background.webp',
  kind: 'image',
  group: 'boot',
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('browser asset preloader', () => {
  it('reports progress and treats failed assets as non-fatal warnings', async () => {
    const progress: number[] = []
    const preloader = createBrowserAssetPreloader({
      loadSource: async (asset) => {
        if (asset.source.includes('missing')) throw new Error('404 Not Found')
      },
    })

    const result = await preloader.preload([
      imageAsset,
      { ...imageAsset, id: 'missing-audio', source: '/assets/audio/missing.mp3', kind: 'audio' },
    ], {
      phase: 'boot',
      onProgress: (snapshot) => progress.push(snapshot.completed),
    })

    expect(result.status).toBe('ready-with-errors')
    expect(result.failures).toEqual([
      { source: '/assets/audio/missing.mp3', kind: 'audio', message: '404 Not Found' },
    ])
    expect(progress).toEqual([1, 2])
  })

  it('reuses completed and pending sources', async () => {
    let calls = 0
    let release!: () => void
    const pending = new Promise<void>((resolve) => {
      release = resolve
    })
    const preloader = createBrowserAssetPreloader({
      loadSource: async () => {
        calls += 1
        await pending
      },
    })

    const first = preloader.preload([imageAsset], { phase: 'boot' })
    const second = preloader.preload([imageAsset], { phase: 'boot' })
    release()
    await Promise.all([first, second])
    await preloader.preload([imageAsset], { phase: 'boot' })

    expect(calls).toBe(1)
  })

  it('resolves a stalled load as a non-fatal timeout failure', async () => {
    const preloader = createBrowserAssetPreloader({
      timeoutMs: 5,
      loadSource: () => new Promise<void>(() => undefined),
    })

    const result = await preloader.preload([imageAsset], { phase: 'boot' })

    expect(result.status).toBe('ready-with-errors')
    expect(result.failures).toEqual([{
      source: imageAsset.source,
      kind: imageAsset.kind,
      message: 'Asset load timed out after 5ms',
    }])
  })

  it('retries a stalled source after a logical timeout', async () => {
    let calls = 0
    const preloader = createBrowserAssetPreloader({
      timeoutMs: 5,
      loadSource: () => {
        calls += 1
        return new Promise<void>(() => undefined)
      },
    })

    await preloader.preload([imageAsset], { phase: 'boot' })
    await preloader.preload([imageAsset], { phase: 'boot' })

    expect(calls).toBe(2)
  })

  it('caches a physical success that completes after its logical timeout', async () => {
    let calls = 0
    let release!: () => void
    const physicalLoad = new Promise<void>((resolve) => {
      release = resolve
    })
    const preloader = createBrowserAssetPreloader({
      timeoutMs: 5,
      loadSource: () => {
        calls += 1
        return physicalLoad
      },
    })

    const firstResult = await preloader.preload([imageAsset], { phase: 'boot' })
    release()
    await physicalLoad
    await new Promise((resolve) => setTimeout(resolve, 0))
    const secondResult = await preloader.preload([imageAsset], { phase: 'boot' })

    expect(firstResult.status).toBe('ready-with-errors')
    expect(secondResult).toMatchObject({ status: 'ready', failures: [] })
    expect(calls).toBe(1)
  })

  it('starts a queued asset timeout only after its physical load begins', async () => {
    vi.useFakeTimers()
    try {
      const startedSources: string[] = []
      const firstAsset = { ...imageAsset, id: 'first', source: '/assets/first.webp' }
      const secondAsset = { ...imageAsset, id: 'second', source: '/assets/second.webp' }
      const preloader = createBrowserAssetPreloader({
        concurrency: 1,
        timeoutMs: 10,
        loadSource: (asset) => {
          startedSources.push(asset.source)
          return new Promise<void>((resolve) => setTimeout(resolve, 8))
        },
      })

      const first = preloader.preload([firstAsset], { phase: 'boot' })
      const second = preloader.preload([secondAsset], { phase: 'boot' })

      await vi.advanceTimersByTimeAsync(8)
      expect(startedSources).toEqual([firstAsset.source, secondAsset.source])

      await vi.advanceTimersByTimeAsync(8)
      expect((await first).status).toBe('ready')
      expect((await second).status).toBe('ready')
    } finally {
      vi.useRealTimers()
    }
  })

  it('aborts timed-out physical work before starting a saturated queued load', async () => {
    const startedSources: string[] = []
    const abortedSources: string[] = []
    const progress: Array<{ completed: number; total: number }> = []
    let active = 0
    let maxActive = 0
    const firstAsset = { ...imageAsset, id: 'stalled', source: '/assets/stalled.webp' }
    const secondAsset = { ...imageAsset, id: 'queued', source: '/assets/queued.webp' }
    const preloader = createBrowserAssetPreloader({
      concurrency: 1,
      timeoutMs: 5,
      loadSource: (asset, signal) => {
        startedSources.push(asset.source)
        active += 1
        maxActive = Math.max(maxActive, active)

        if (asset.source === firstAsset.source) {
          return new Promise<void>((_, reject) => {
            signal.addEventListener('abort', () => {
              abortedSources.push(asset.source)
              active -= 1
              reject(signal.reason)
            }, { once: true })
          })
        }

        active -= 1
        return Promise.resolve()
      },
    })

    const result = await Promise.race([
      preloader.preload([firstAsset, secondAsset], {
        phase: 'boot',
        onProgress: ({ completed, total }) => progress.push({ completed, total }),
      }),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('preload did not resolve after timeout')), 100)
      }),
    ])

    expect(result).toMatchObject({
      status: 'ready-with-errors',
      completed: 2,
      total: 2,
      failures: [{
        source: firstAsset.source,
        kind: firstAsset.kind,
        message: 'Asset load timed out after 5ms',
      }],
    })
    expect(progress).toEqual([
      { completed: 1, total: 2 },
      { completed: 2, total: 2 },
    ])
    expect(startedSources).toEqual([firstAsset.source, secondAsset.source])
    expect(abortedSources).toEqual([firstAsset.source])
    expect(maxActive).toBe(1)
  })

  it('passes the timeout signal to browser fetch loads', async () => {
    let fetchSignal: AbortSignal | undefined
    const fetchMock = vi.fn((_source: RequestInfo | URL, init?: RequestInit) => {
      fetchSignal = init?.signal ?? undefined
      return new Promise<Response>((_, reject) => {
        fetchSignal?.addEventListener('abort', () => reject(fetchSignal?.reason), { once: true })
      })
    })
    vi.stubGlobal('fetch', fetchMock)
    const audioAsset = { ...imageAsset, id: 'music', source: '/assets/music.mp3', kind: 'audio' as const }
    const preloader = createBrowserAssetPreloader({ timeoutMs: 5 })

    const result = await preloader.preload([audioAsset], { phase: 'boot' })

    expect(result.failures[0]?.message).toBe('Asset load timed out after 5ms')
    expect(fetchSignal?.aborted).toBe(true)
    expect(fetchMock).toHaveBeenCalledWith(audioAsset.source, {
      cache: 'force-cache',
      signal: fetchSignal,
    })
  })

  it('waits for browser fetch response bodies before reporting non-image assets as loaded', async () => {
    let releaseBody!: () => void
    let settled = false
    const bodyRead = vi.fn(() => new Promise<ArrayBuffer>((resolve) => {
      releaseBody = () => resolve(new ArrayBuffer(0))
    }))
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      arrayBuffer: bodyRead,
    } as unknown as Response)))
    const audioAsset = { ...imageAsset, id: 'music', source: '/assets/music.mp3', kind: 'audio' as const }
    const preloader = createBrowserAssetPreloader()

    const preload = preloader.preload([audioAsset], { phase: 'boot' }).then((result) => {
      settled = true
      return result
    })
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(bodyRead).toHaveBeenCalledTimes(1)
    expect(settled).toBe(false)

    releaseBody()

    expect(await preload).toMatchObject({ status: 'ready', failures: [] })
  })

  it('releases queued assets after a logical timeout even when physical work ignores abort', async () => {
    const startedSources: string[] = []
    const firstAsset = { ...imageAsset, id: 'stalled', source: '/assets/stalled.webp' }
    const secondAsset = { ...imageAsset, id: 'queued', source: '/assets/queued.webp' }
    const preloader = createBrowserAssetPreloader({
      concurrency: 1,
      timeoutMs: 5,
      loadSource: (asset) => {
        startedSources.push(asset.source)
        if (asset.source === firstAsset.source) return new Promise<void>(() => undefined)

        return Promise.resolve()
      },
    })

    const result = await Promise.race([
      preloader.preload([firstAsset, secondAsset], { phase: 'boot' }),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('queued asset did not start after logical timeout')), 100)
      }),
    ])

    expect(result).toMatchObject({
      status: 'ready-with-errors',
      completed: 2,
      total: 2,
      failures: [{
        source: firstAsset.source,
        kind: firstAsset.kind,
        message: 'Asset load timed out after 5ms',
      }],
    })
    expect(startedSources).toEqual([firstAsset.source, secondAsset.source])
  })

  it('aborts and clears a stalled browser image before starting queued work', async () => {
    const imageInstances: Array<{ src: string }> = []
    class FakeImage {
      src = ''

      constructor() {
        imageInstances.push(this)
      }

      decode(): Promise<void> {
        return this.src.includes('stalled') ? new Promise<void>(() => undefined) : Promise.resolve()
      }
    }
    vi.stubGlobal('Image', FakeImage)
    const firstAsset = { ...imageAsset, id: 'stalled', source: '/assets/stalled.webp' }
    const secondAsset = { ...imageAsset, id: 'queued', source: '/assets/queued.webp' }
    const preloader = createBrowserAssetPreloader({ concurrency: 1, timeoutMs: 5 })

    const result = await Promise.race([
      preloader.preload([firstAsset, secondAsset], { phase: 'boot' }),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('queued image did not start after abort')), 100)
      }),
    ])

    expect(result).toMatchObject({ status: 'ready-with-errors', completed: 2, total: 2 })
    expect(imageInstances).toHaveLength(2)
    expect(imageInstances[0]?.src).toBe('')
    expect(imageInstances[1]?.src).toBe(secondAsset.source)
  })

  it('limits active loads to the configured concurrency while running in parallel', async () => {
    const assets = [1, 2, 3, 4].map((id) => ({ ...imageAsset, id: `asset-${id}`, source: `/assets/${id}.webp` }))
    let active = 0
    let maxActive = 0
    const preloader = createBrowserAssetPreloader({
      concurrency: 2,
      loadSource: async () => {
        active += 1
        maxActive = Math.max(maxActive, active)
        await new Promise<void>((resolve) => setTimeout(resolve, 5))
        active -= 1
      },
    })

    const result = await preloader.preload(assets, { phase: 'boot' })

    expect(result.status).toBe('ready')
    expect(maxActive).toBe(2)
  })

  it('limits physical loads across overlapping preload calls', async () => {
    const releases: Array<() => void> = []
    let active = 0
    let maxActive = 0
    const preloader = createBrowserAssetPreloader({
      concurrency: 2,
      loadSource: () => new Promise<void>((resolve) => {
        active += 1
        maxActive = Math.max(maxActive, active)
        releases.push(() => {
          active -= 1
          resolve()
        })
      }),
    })
    const firstAssets = [1, 2].map((id) => ({ ...imageAsset, id: `first-${id}`, source: `/assets/first-${id}.webp` }))
    const secondAssets = [1, 2].map((id) => ({ ...imageAsset, id: `second-${id}`, source: `/assets/second-${id}.webp` }))

    const first = preloader.preload(firstAssets, { phase: 'boot' })
    const second = preloader.preload(secondAssets, { phase: 'background' })
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(maxActive).toBe(2)
    releases.splice(0, 2).forEach((release) => release())
    await new Promise((resolve) => setTimeout(resolve, 0))
    releases.splice(0, 2).forEach((release) => release())
    await Promise.all([first, second])

    expect(maxActive).toBe(2)
  })
})
