import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import worldSelectSource from './WorldSelectScreen.svelte?raw'

const appCss = readFileSync(fileURLToPath(new URL('../../app.css', import.meta.url)), 'utf8')

describe('World Select background transition', () => {
  it('keeps previous and current backdrop layers for a crossfade', () => {
    expect(worldSelectSource).toContain('world-backdrop-stack')
    expect(worldSelectSource).toContain('world-backdrop-layer previous')
    expect(worldSelectSource).toContain('world-backdrop-layer current')
    expect(worldSelectSource).toContain('assetRefs.stageSelectBackground')
    expect(worldSelectSource).toContain('{#key previousBackdropImage}')

    expect(appCss).toContain('.world-backdrop-stack')
    expect(appCss).toContain('.world-backdrop-layer')
    expect(appCss).toContain('transition:')
    expect(appCss).toContain('opacity 420ms ease')
    expect(appCss).toContain('@keyframes world-backdrop-previous-out')
  })
})
