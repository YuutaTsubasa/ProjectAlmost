import { describe, expect, it } from 'vitest'
import gameplayScreenSource from './GameplayScreen.svelte?raw'

describe('GameplayScreen virtual controls integration contract', () => {
  it('renders localized virtual controls only through gameplay screen state', () => {
    expect(gameplayScreenSource).toContain("import VirtualControls from './VirtualControls.svelte'")
    expect(gameplayScreenSource).toContain('let virtualControlsState = $state<VirtualControlsState>')
    expect(gameplayScreenSource).toContain('{#if virtualControlsState.visible && isGameplayPlayable()}')
    expect(gameplayScreenSource).toContain('<VirtualControls')
    expect(gameplayScreenSource).toContain('{localizeData}')
    expect(gameplayScreenSource).toContain('{locale}')
  })

  it('renders virtual pause as a bottom HUD side slot instead of a virtual action button', () => {
    expect(gameplayScreenSource).toContain('class="virtual-hud-pause"')
    expect(gameplayScreenSource).toContain("aria-label={text('touch.pause')}")
    expect(gameplayScreenSource).toContain('onpointerdown={(event) => {')
    expect(gameplayScreenSource).toContain('pauseGameplay()')

    const styleStart = gameplayScreenSource.indexOf('.virtual-hud-pause {')
    const styleEnd = gameplayScreenSource.indexOf('\n  }', styleStart)
    expect(styleStart).toBeGreaterThan(-1)
    expect(styleEnd).toBeGreaterThan(styleStart)

    const styleBlock = gameplayScreenSource.slice(styleStart, styleEnd)
    expect(styleBlock).toContain('bottom:')
    expect(styleBlock).toContain('right:')
    expect(styleBlock).toContain('pointer-events: auto')
    expect(styleBlock).toContain('z-index:')
  })

  it('passes a merged gameplay snapshot into the Phaser renderer', () => {
    expect(gameplayScreenSource).toContain('getInputSnapshot: getGameplayInputSnapshot')
    expect(gameplayScreenSource).toContain('function getGameplayInputSnapshot(): GameplayInputSnapshot')
    expect(gameplayScreenSource).toContain('mergeGameplayInputSnapshots([')
    expect(gameplayScreenSource).toContain('getVirtualGameplayInputSnapshot()')
    expect(gameplayScreenSource).toContain('gamepadGameplayInput')
  })

  it('shows virtual controls from pointer interaction and hides them from keyboard or gamepad gameplay input', () => {
    expect(gameplayScreenSource).toContain('function applyVirtualControlsVisibility(source: GameplayInputSource): void')
    expect(gameplayScreenSource).toContain("applyVirtualControlsVisibility('virtual-pointer')")
    expect(gameplayScreenSource).toContain("applyVirtualControlsVisibility('keyboard')")
    expect(gameplayScreenSource).toContain("applyVirtualControlsVisibility('gamepad')")
    expect(gameplayScreenSource).toContain('clearVirtualControlsState(virtualControlsState)')
  })

  it('maps virtual stick and action buttons to gameplay input edges without global custom events', () => {
    expect(gameplayScreenSource).toContain('function handleVirtualMove(moveX: -1 | 0 | 1, crouchHeld: boolean): void')
    expect(gameplayScreenSource).toContain('function handleVirtualJump(): void')
    expect(gameplayScreenSource).toContain('function handleVirtualAttack(): void')
    expect(gameplayScreenSource).toContain('virtualJumpPressed')
    expect(gameplayScreenSource).toContain('virtualAttackPressed')
    expect(gameplayScreenSource).not.toContain('projectrun:virtual-input')
  })

  it('consumes virtual action edges only when the renderer reads the gameplay snapshot', () => {
    const gameplayInputBlockMatch = gameplayScreenSource.match(
      /function getGameplayInputSnapshot\(\): GameplayInputSnapshot \{[\s\S]*?\n  \}/,
    )
    const pollGamepadBlockMatch = gameplayScreenSource.match(/function pollGamepad\(\) \{[\s\S]*?\n    \}/)

    expect(gameplayInputBlockMatch).not.toBeNull()
    expect(pollGamepadBlockMatch).not.toBeNull()

    const gameplayInputBlock = gameplayInputBlockMatch?.[0] ?? ''
    const pollGamepadBlock = pollGamepadBlockMatch?.[0] ?? ''

    expect(gameplayInputBlock).toContain('virtualJumpPressed = false')
    expect(gameplayInputBlock).toContain('virtualAttackPressed = false')
    expect(pollGamepadBlock).not.toContain('clearVirtualActionEdges()')
  })
})
