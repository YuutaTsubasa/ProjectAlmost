import { describe, expect, it } from 'vitest'
import stageResultSource from './StageResult.svelte?raw'

describe('StageResult UI contract', () => {
  it('renders the prototype-equivalent result overlay structure', () => {
    expect(stageResultSource).toContain('class="stage-result"')
    expect(stageResultSource).toContain('class="result-veil"')
    expect(stageResultSource).toContain('class="result-hero"')
    expect(stageResultSource).toContain('/assets/results/yuuta-stage-result-standee.webp')
    expect(stageResultSource).toContain('class="result-banner"')
    expect(stageResultSource).toContain('class="result-board"')
    expect(stageResultSource).toContain('class="result-rank"')
    expect(stageResultSource).toContain('class="result-actions"')
  })

  it('renders all result stats and perfect markers from state', () => {
    expect(stageResultSource).toContain('Clear Time')
    expect(stageResultSource).toContain('Coins')
    expect(stageResultSource).toContain('Damage Taken')
    expect(stageResultSource).toContain('Falls')
    expect(stageResultSource).toContain('Enemies Defeated')
    expect(stageResultSource).toContain('Checkpoints')
    expect(stageResultSource).toContain('Perfect')
    expect(stageResultSource).toContain('getStageResultRowStates')
  })

  it('renders retry, stage select, and locked next stage actions', () => {
    expect(stageResultSource).toContain('Retry')
    expect(stageResultSource).toContain('Stage Select')
    expect(stageResultSource).toContain('Next Stage')
    expect(stageResultSource).toContain('getResultActionStates')
    expect(stageResultSource).toContain('disabled={action.disabled}')
  })

  it('sizes the result overlay against the resolution frame container', () => {
    expect(stageResultSource).toContain('cqw')
    expect(stageResultSource).toContain('cqh')
    expect(stageResultSource).not.toContain('100vw')
    expect(stageResultSource).not.toContain('100vh')
  })
})
