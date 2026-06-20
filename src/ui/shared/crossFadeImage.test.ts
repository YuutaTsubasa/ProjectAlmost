import { describe, expect, it } from 'vitest'
import crossFadeSource from './CrossFadeImage.svelte?raw'

describe('CrossFadeImage', () => {
  it('keeps outgoing and keyed incoming image layers for a visible crossfade', () => {
    expect(crossFadeSource).toContain('src')
    expect(crossFadeSource).toContain('durationMs')
    expect(crossFadeSource).toContain('previousSrc')
    expect(crossFadeSource).toContain('currentSrc')
    expect(crossFadeSource).toContain('{#key currentSrc}')
    expect(crossFadeSource).toContain('crossfade-image-layer previous')
    expect(crossFadeSource).toContain('crossfade-image-layer current')
    expect(crossFadeSource).toContain('setTimeout')
  })
})
