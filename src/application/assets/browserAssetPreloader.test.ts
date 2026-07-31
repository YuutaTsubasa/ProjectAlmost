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
})
