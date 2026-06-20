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
    expect(appCss).toContain('transition:')
    expect(appCss).toContain('opacity 420ms ease')
    expect(appCss).toContain('@keyframes crossfade-image-previous-out')
  })
})
