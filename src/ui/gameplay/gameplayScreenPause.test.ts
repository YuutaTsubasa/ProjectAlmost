import { describe, expect, it } from 'vitest'
import gameplayScreenSource from './GameplayScreen.svelte?raw'

describe('GameplayScreen pause integration contract', () => {
  it('owns gameplay pause state and renders PauseMenu before result-only handling', () => {
    expect(gameplayScreenSource).toContain('GameplayPauseState')
    expect(gameplayScreenSource).toContain("let pauseState = $state<GameplayPauseState>({ mode: 'playing' })")
    expect(gameplayScreenSource).toContain('<PauseMenu')
    expect(gameplayScreenSource).toContain("{#if pauseState.mode === 'paused' && !hudState?.result}")
  })

  it('branches keyboard and gamepad input on Stage Result before pause and settings handling', () => {
    const keyboardBlockMatch = gameplayScreenSource.match(
      /function handleKeydown\(event: KeyboardEvent\): void \{[\s\S]*?\n  \}/,
    )
    const gamepadBlockMatch = gameplayScreenSource.match(/function pollGamepad\(\) \{[\s\S]*?\n    \}/)

    expect(keyboardBlockMatch).not.toBeNull()
    expect(gamepadBlockMatch).not.toBeNull()

    const keyboardBlock = keyboardBlockMatch ?? ['']
    const gamepadBlock = gamepadBlockMatch ?? ['']
    const resolverBlockMatch = gameplayScreenSource.match(
      /function resolveGameplayControlContext\(\): ControlContext \{[\s\S]*?\n  \}/,
    )
    const resolverBlock = resolverBlockMatch ?? ['']

    const keyboardStageResultIndex = keyboardBlock[0].indexOf('if (hudState?.result) {')
    const keyboardSettingsIndex = keyboardBlock[0].indexOf("if (pauseState.mode === 'settings') {")
    const keyboardPauseContextIndex = keyboardBlock[0].indexOf('const context = resolveGameplayControlContext()')
    const gamepadContextIndex = gamepadBlock[0].indexOf('const context = resolveGameplayControlContext()')
    const resolverAvgContextIndex = resolverBlock[0].indexOf("if (isAvgPlaybackActive(avgPlayback)) return 'avg'")
    const resolverStageResultContextIndex = resolverBlock[0].indexOf("if (hudState?.result) return 'stage-select'")
    const resolverPausedContextIndex = resolverBlock[0].indexOf(
      "if (pauseState.mode === 'paused') return 'gameplay-pause-menu'",
    )
    const resolverSettingsContextIndex = resolverBlock[0].indexOf(
      "if (pauseState.mode === 'settings') return pauseSettingsControlContext()",
    )

    expect(keyboardStageResultIndex).toBeGreaterThan(-1)
    expect(keyboardStageResultIndex).toBeLessThan(keyboardSettingsIndex)
    expect(keyboardStageResultIndex).toBeLessThan(keyboardPauseContextIndex)
    expect(gamepadContextIndex).toBeGreaterThan(-1)
    expect(resolverAvgContextIndex).toBeGreaterThan(-1)
    expect(resolverStageResultContextIndex).toBeGreaterThan(-1)
    expect(resolverAvgContextIndex).toBeLessThan(resolverStageResultContextIndex)
    expect(resolverStageResultContextIndex).toBeLessThan(resolverPausedContextIndex)
    expect(resolverStageResultContextIndex).toBeLessThan(resolverSettingsContextIndex)
  })

  it('prioritizes stage result, pause menu, pause settings, and gameplay-active control contexts in order', () => {
    const resolverBlockMatch = gameplayScreenSource.match(
      /function resolveGameplayControlContext\(\): ControlContext \{[\s\S]*?\n  \}/,
    )

    expect(resolverBlockMatch).not.toBeNull()

    const resolverBlock = resolverBlockMatch ?? ['']
    const stageSelectIndex = resolverBlock[0].indexOf("if (hudState?.result) return 'stage-select'")
    const pauseMenuIndex = resolverBlock[0].indexOf("if (pauseState.mode === 'paused') return 'gameplay-pause-menu'")
    const pauseSettingsContextIndex = resolverBlock[0].indexOf('pauseSettingsControlContext()')
    const gameplayActiveIndex = resolverBlock[0].indexOf("return 'gameplay-active'")

    expect(stageSelectIndex).toBeGreaterThan(-1)
    expect(stageSelectIndex).toBeLessThan(pauseMenuIndex)
    expect(pauseMenuIndex).toBeLessThan(pauseSettingsContextIndex)
    expect(pauseSettingsContextIndex).toBeLessThan(gameplayActiveIndex)
    expect(gameplayScreenSource).toContain("'gameplay-active'")
    expect(gameplayScreenSource).toContain("'gameplay-pause-menu'")
  })

  it('mirrors title settings delete-confirm context for pause-origin keyboard and gamepad input', () => {
    expect(gameplayScreenSource).toContain('function pauseSettingsControlContext():')
    expect(gameplayScreenSource).toContain(
      "return pauseSettingsScreen.deleteConfirm ? 'settings-delete-confirm' : 'settings'",
    )
    expect(gameplayScreenSource).toContain('mapKeyboardControlIntent(')
    expect(gameplayScreenSource).toContain('pauseSettingsControlContext(),')
    expect(gameplayScreenSource).toContain('mapGamepadControlIntents(')
  })

  it('consumes pause settings control intents through the pause settings boundary', () => {
    expect(gameplayScreenSource).toContain('function handlePauseSettingsControlIntent(intent: ControlIntent): void {')
    expect(gameplayScreenSource).toContain('const result = applySettingsControlIntent(')
    expect(gameplayScreenSource).toContain('if (result.deleteConfirmed) onConfirmSettingsDelete()')
    expect(gameplayScreenSource).toContain(
      'if (result.exitRequested) pauseState = backFromPauseSettings(pauseState)',
    )
  })

  it('keeps the pause activation state and action coupled before dispatching pause actions', () => {
    expect(gameplayScreenSource).toContain('const activation = activatePauseMenuItem(pauseState)')
    expect(gameplayScreenSource).toContain('pauseState = activation.state')
    expect(gameplayScreenSource).toContain('if (activation.action) handlePauseAction(activation.action)')
  })

  it('returns gameplay to playing mode before restart and stage-select callbacks remount it', () => {
    expect(gameplayScreenSource).toContain("if (action === 'restart-stage') {")
    expect(gameplayScreenSource).toContain("if (action === 'stage-select') {")
    expect(gameplayScreenSource).toContain("pauseState = { mode: 'playing' }\n      onRetry()")
    expect(gameplayScreenSource).toContain("pauseState = { mode: 'playing' }\n      onStageSelect()")
  })

  it('coordinates renderer pause resume and timing reset through explicit controller methods', () => {
    expect(gameplayScreenSource).toContain('renderer.pause()')
    expect(gameplayScreenSource).toContain('renderer.resume()')
    expect(gameplayScreenSource).toContain('renderer.resetTiming()')
    expect(gameplayScreenSource).toContain('if (renderer) renderer.destroy()')
  })

  it('renders pause-origin settings over gameplay with a pause back label', () => {
    expect(gameplayScreenSource).toContain('<SettingsPanel')
    expect(gameplayScreenSource).toContain('onBackLabel="pause.resume"')
    expect(gameplayScreenSource).toContain('backFromPauseSettings')
  })
})
