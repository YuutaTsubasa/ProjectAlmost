import { describe, expect, it } from 'vitest'
import gameplayScreenSource from './GameplayScreen.svelte?raw'

describe('GameplayScreen pause integration contract', () => {
  it('owns gameplay pause state and renders PauseMenu before result-only handling', () => {
    expect(gameplayScreenSource).toContain('GameplayPauseState')
    expect(gameplayScreenSource).toContain("let pauseState = $state<GameplayPauseState>({ mode: 'playing' })")
    expect(gameplayScreenSource).toContain('<PauseMenu')
    expect(gameplayScreenSource).toContain("{#if pauseState.mode === 'paused' && !hudState?.result}")
  })

  it('gives Stage Result input precedence over Pause Menu input', () => {
    expect(gameplayScreenSource.indexOf('if (hudState?.result)')).toBeLessThan(
      gameplayScreenSource.indexOf("const context = pauseState.mode === 'paused'"),
    )
  })

  it('uses gameplay-specific control contexts', () => {
    expect(gameplayScreenSource).toContain("'gameplay-active'")
    expect(gameplayScreenSource).toContain("'gameplay-pause-menu'")
  })

  it('coordinates renderer pause resume and timing reset through explicit controller methods', () => {
    expect(gameplayScreenSource).toContain('renderer.pause()')
    expect(gameplayScreenSource).toContain('renderer.resume()')
    expect(gameplayScreenSource).toContain('renderer.resetTiming()')
    expect(gameplayScreenSource).toContain('renderer.destroy()')
  })

  it('renders pause-origin settings over gameplay with a pause back label', () => {
    expect(gameplayScreenSource).toContain('<SettingsPanel')
    expect(gameplayScreenSource).toContain('onBackLabel="pause.resume"')
    expect(gameplayScreenSource).toContain('backFromPauseSettings')
  })
})
