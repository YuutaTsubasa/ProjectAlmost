import { describe, expect, it } from 'vitest'
import gameplayScreenSource from './GameplayScreen.svelte?raw'

describe('GameplayScreen result wiring', () => {
  it('renders StageResult from hudState.result with selection state and callbacks', () => {
    expect(gameplayScreenSource).toContain('{#if hudState.result}')
    expect(gameplayScreenSource).toContain('<StageResult')
    expect(gameplayScreenSource).toContain('result={hudState.result}')
    expect(gameplayScreenSource).toContain('selectedAction={selectedResultAction}')
    expect(gameplayScreenSource).toContain('{nextStageAvailable}')
    expect(gameplayScreenSource).toContain('onSelectAction={(index) => (selectedResultAction = index)}')
    expect(gameplayScreenSource).toContain('onAction={handleResultAction}')
  })

  it('accepts nextStageAvailable from the parent instead of hard-coding result navigation off', () => {
    expect(gameplayScreenSource).toContain('nextStageAvailable: boolean')
    expect(gameplayScreenSource).toContain('nextStageAvailable,')
    expect(gameplayScreenSource).not.toContain('const nextStageAvailable = false')
  })

  it('keeps result callback dispatch in GameplayScreen instead of the domain app flow', () => {
    expect(gameplayScreenSource).toContain('onNextStage: () => void')
    expect(gameplayScreenSource).toContain('onNextStage,')
    expect(gameplayScreenSource).toContain('mapKeyboardControlIntent')
    expect(gameplayScreenSource).toContain('mapGamepadControlIntents')
    expect(gameplayScreenSource).toContain('<svelte:window onkeydown={handleKeydown} />')
    expect(gameplayScreenSource).toContain('handleResultControlIntent')
    expect(gameplayScreenSource).toContain('resolveStageResultActionIntent')
    expect(gameplayScreenSource).toContain("if (action === 'retry')")
    expect(gameplayScreenSource).toContain("if (action === 'stage-select')")
    expect(gameplayScreenSource).toContain("if (action === 'next-stage')")
    expect(gameplayScreenSource).toContain('onNextStage()')
    expect(gameplayScreenSource).not.toContain('applyGameplayResultAction')
  })
})

it('keeps Result HUD next-stage lock treatment driven by nextStageAvailable', () => {
  expect(gameplayScreenSource).toContain('{nextStageAvailable}')
  expect(gameplayScreenSource).toContain('resolveStageResultActionIntent')
  expect(gameplayScreenSource).toContain('{nextStageAvailable}')
})
