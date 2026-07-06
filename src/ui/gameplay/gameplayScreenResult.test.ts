import { describe, expect, it } from 'vitest'
import gameplayScreenSource from './GameplayScreen.svelte?raw'

describe('GameplayScreen result wiring', () => {
  it('renders StageResult from the HUD result snapshot', () => {
    expect(gameplayScreenSource).toContain("import StageResult from './StageResult.svelte'")
    expect(gameplayScreenSource).toContain('{#if hudState.result}')
    expect(gameplayScreenSource).toContain('<StageResult')
    expect(gameplayScreenSource).toContain('result={hudState.result}')
  })

  it('wires result actions to parent callbacks', () => {
    expect(gameplayScreenSource).toContain('onRetry')
    expect(gameplayScreenSource).toContain('onStageSelect')
    expect(gameplayScreenSource).toContain('handleResultAction')
    expect(gameplayScreenSource).toContain("action === 'retry'")
    expect(gameplayScreenSource).toContain("action === 'stage-select'")
  })
})
