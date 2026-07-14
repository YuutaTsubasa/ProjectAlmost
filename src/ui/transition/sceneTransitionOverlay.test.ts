import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import source from './SceneTransitionOverlay.svelte?raw'

const appCss = readFileSync(fileURLToPath(new URL('../../app.css', import.meta.url)), 'utf8')

describe('SceneTransitionOverlay', () => {
  it('renders prototype-style transition classes without app-flow logic', () => {
    expect(source).toContain("import type { SceneTransitionPhase, SceneTransitionStyle }")
    expect(source).toContain('phase: SceneTransitionPhase')
    expect(source).toContain('style: SceneTransitionStyle')
    expect(source).toContain('scene-transition')
    expect(source).toContain('class:reveal={phase === \'reveal\'}')
    expect(source).toContain("class:world-shift={style === 'world-stage-forward' || style === 'world-stage-back'}")
    expect(source).toContain("class:reverse={style === 'world-stage-back'}")
    expect(source).toContain('transition-emblem')
    expect(source).not.toContain('appState')
    expect(source).not.toContain('setTimeout')
  })

  it('defines blocking page and world-shift transition CSS', () => {
    expect(appCss).toContain('.scene-transition')
    expect(appCss).toContain('pointer-events: all')
    expect(appCss).toContain('animation: scene-page-cover 280ms ease-out forwards')
    expect(appCss).toContain('.scene-transition.reveal')
    expect(appCss).toContain('scene-page-reveal')
    expect(appCss).toContain('.scene-transition.world-shift')
    expect(appCss).toContain('scene-world-shift-cover')
    expect(appCss).toContain('.scene-transition.world-shift.reverse::before')
    expect(appCss).toContain('scene-world-shift-light-reverse')
    expect(appCss).toContain('.transition-emblem')
  })
})
