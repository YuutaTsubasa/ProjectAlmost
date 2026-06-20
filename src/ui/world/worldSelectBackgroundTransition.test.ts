import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import worldSelectSource from './WorldSelectScreen.svelte?raw'

const appCss = readFileSync(fileURLToPath(new URL('../../app.css', import.meta.url)), 'utf8')
const worldBackdropCss = appCss.match(/\.world-backdrop \{[\s\S]*?\n\}/)?.[0] ?? ''

describe('World Select background transition', () => {
  it('matches the prototype single backdrop layer driven by world theme variables', () => {
    expect(worldSelectSource).not.toContain("import CrossFadeImage from '../shared/CrossFadeImage.svelte'")
    expect(worldSelectSource).toContain('world-backdrop')
    expect(worldSelectSource).not.toContain('assetRefs.stageSelectBackground')
    expect(worldSelectSource).not.toContain('<CrossFadeImage')
    expect(worldSelectSource).not.toContain('previousBackdropTimer')

    expect(appCss).toContain('.world-backdrop')
    expect(worldBackdropCss).toContain('background: var(--world-background) center / cover no-repeat')
    expect(worldBackdropCss).toContain('transition:')
    expect(worldBackdropCss).toContain('background-image 300ms ease')
    expect(worldBackdropCss).toContain('filter 300ms ease')
    expect(appCss).toContain('.world-backdrop::before')
    expect(appCss).toContain('.world-select.theme-palace')
    expect(appCss).not.toContain('.world-backdrop-stack')
    expect(appCss).not.toContain('.crossfade-image')
    expect(appCss).not.toContain('.crossfade-image-layer')
    expect(appCss).not.toContain('@keyframes crossfade-image-previous-out')
    expect(appCss).not.toContain('@keyframes crossfade-image-current-in')
  })
})
