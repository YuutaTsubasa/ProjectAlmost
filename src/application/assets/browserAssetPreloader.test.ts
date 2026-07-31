import { describe, expect, it } from 'vitest'
import type { PreloadAsset } from '../../domain/assets/preloadManifest'
import { createBrowserAssetPreloader } from './browserAssetPreloader'

const imageAsset: PreloadAsset = {
  id: 'title-background',
  source: '/assets/title/project-almost-title-background.webp',
  kind: 'image',
  group: 'boot',
}

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

  it('reuses pending physical work after a logical timeout', async () => {
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

    expect(calls).toBe(1)
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
