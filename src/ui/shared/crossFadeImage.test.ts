import { describe, expect, it } from 'vitest'
import crossFadeSource from './CrossFadeImage.svelte?raw'

describe('CrossFadeImage', () => {
  it('keeps outgoing and keyed incoming image layers for a visible crossfade', () => {
    expect(crossFadeSource).toContain('src')
    expect(crossFadeSource).toContain('durationMs')
    expect(crossFadeSource).toContain('previousSrc')
    expect(crossFadeSource).toContain('currentSrc')
    expect(crossFadeSource).toContain('previousOpacity')
    expect(crossFadeSource).toContain('startPreviousFade')
    expect(crossFadeSource).toContain('effectiveDurationMs')
    expect(crossFadeSource).toContain('prefers-reduced-motion: reduce')
    expect(crossFadeSource).toContain('preloadImage')
    expect(crossFadeSource).toContain('decode')
    expect(crossFadeSource).toContain('requestAnimationFrame')
    expect(crossFadeSource).toContain('cancelAnimationFrame')
    expect(crossFadeSource).toContain('{#key currentSrc}')
    expect(crossFadeSource).toContain('crossfade-image-layer previous')
    expect(crossFadeSource).toContain('opacity: ${previousOpacity}')
    expect(crossFadeSource).toContain('crossfade-image-layer current')
  })
})
