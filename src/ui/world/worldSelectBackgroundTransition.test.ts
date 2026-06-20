import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import worldSelectSource from './WorldSelectScreen.svelte?raw'

const appCss = readFileSync(fileURLToPath(new URL('../../app.css', import.meta.url)), 'utf8')

describe('World Select background transition', () => {
  it('delegates selected background transitions to CrossFadeImage', () => {
    expect(worldSelectSource).toContain("import CrossFadeImage from '../shared/CrossFadeImage.svelte'")
    expect(worldSelectSource).toContain('world-backdrop-stack')
    expect(worldSelectSource).toContain('assetRefs.stageSelectBackground')
    expect(worldSelectSource).toContain('<CrossFadeImage')
    expect(worldSelectSource).not.toContain('previousBackdropTimer')

    expect(appCss).toContain('.world-backdrop-stack')
    expect(appCss).toContain('.crossfade-image-layer')
    expect(appCss).toContain('transition: none;')
    expect(appCss).toContain('.crossfade-image-layer.previous')
    expect(appCss).not.toContain('opacity 420ms ease')
    expect(appCss).not.toContain('.crossfade-image-layer.previous.fading')
    expect(appCss).not.toContain('@keyframes crossfade-image-previous-out')
    expect(appCss).not.toContain('@keyframes crossfade-image-current-in')
    expect(appCss).not.toContain('filter 420ms ease')
    expect(appCss).not.toContain('filter: saturate(0.86)')
  })
})
