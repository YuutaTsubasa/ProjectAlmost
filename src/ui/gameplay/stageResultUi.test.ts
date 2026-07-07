import { describe, expect, it } from 'vitest'
import stageResultSource from './StageResult.svelte?raw'

describe('StageResult UI contract', () => {
  it('isolates visible copy in a local stageResultCopy map', () => {
    expect(stageResultSource).toContain('stageResultCopy')
    expect(stageResultSource).toContain('resultTitle')
    expect(stageResultSource).toContain('hero')
    expect(stageResultSource).toContain('clearTime')
    expect(stageResultSource).toContain('coins')
    expect(stageResultSource).toContain('damageTaken')
    expect(stageResultSource).toContain('falls')
    expect(stageResultSource).toContain('enemiesDefeated')
    expect(stageResultSource).toContain('checkpoints')
    expect(stageResultSource).toContain('perfect')
    expect(stageResultSource).toContain('newRecord')
    expect(stageResultSource).toContain('label')
    expect(stageResultSource).toContain('retry')
    expect(stageResultSource).toContain('stageSelect')
    expect(stageResultSource).toContain('nextStage')
    expect(stageResultSource).not.toContain('Clear Time</span>')
    expect(stageResultSource).not.toContain('Coins</span>')
    expect(stageResultSource).not.toContain('Damage Taken</span>')
    expect(stageResultSource).not.toContain('Falls</span>')
    expect(stageResultSource).not.toContain('Enemies Defeated</span>')
    expect(stageResultSource).not.toContain('Checkpoints</span>')
    expect(stageResultSource).not.toContain('Retry</button>')
    expect(stageResultSource).not.toContain('Stage Select</button>')
    expect(stageResultSource).not.toContain('Next Stage</button>')
  })

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

  it('selects an action before activating it on click', () => {
    expect(stageResultSource).toContain('handleActionClick')
    expect(stageResultSource).toContain('onSelectAction(index)')
    expect(stageResultSource).toContain('activateAction(type, disabled)')
    expect(stageResultSource.indexOf('onSelectAction(index)')).toBeLessThan(
      stageResultSource.indexOf('activateAction(type, disabled)'),
    )
  })

  it('sizes the result overlay against the resolution frame container', () => {
    expect(stageResultSource).toContain('cqw')
    expect(stageResultSource).toContain('cqh')
    expect(stageResultSource).not.toContain('100vw')
    expect(stageResultSource).not.toContain('100vh')
  })

  it('renders prototype-style banner and stage title ornamentation', () => {
    expect(stageResultSource).toContain('class="result-banner-star"')
    expect(stageResultSource).toContain('class="result-stage-separator"')
  })

  it('renders target counts and locked action sublabel in prototype-style nested elements', () => {
    expect(stageResultSource).toContain('<em>/ {result.coinTarget}</em>')
    expect(stageResultSource).toContain('<em>/ {result.enemyTarget}</em>')
    expect(stageResultSource).toContain('<em>/ {result.checkpointTarget}</em>')
    expect(stageResultSource).toContain("locked: 'Locked'")
    expect(stageResultSource).toContain(
      '{#if action.disabled}<span>{stageResultCopy.actions.locked}</span>{/if}',
    )
  })

  it('renders the rank as a right-column badge with a single rank label', () => {
    expect(stageResultSource).toContain('class="result-rank-badge"')
    expect(stageResultSource).toContain("label: 'Rank'")
    expect(stageResultSource).not.toContain('class="result-rank-sublabel"')
    expect(stageResultSource).not.toContain('Final Evaluation')
    expect(stageResultSource).toContain("class:rank-s={result.rank === 'S'}")
    expect(stageResultSource).toContain("class:rank-d={result.rank === 'D'}")
  })

  it('keeps the rank badge circle away from the evaluation labels', () => {
    const badgeStyle = stageResultSource.match(/\.result-rank-badge \{[^}]+\}/)?.[0] ?? ''

    expect(badgeStyle).toContain('margin: 2.2cqh 0;')
  })

  it('uses the approved bright prototype-style result HUD surface', () => {
    expect(stageResultSource).toContain('--accent: #2f6fd0')
    expect(stageResultSource).toContain('--accent-bright:')
    expect(stageResultSource).toContain('--hud-panel:')
    expect(stageResultSource).toContain('rgba(234, 247, 255')
    expect(stageResultSource).toContain('color-mix(in srgb, var(--hud-panel) 92%, white)')
    expect(stageResultSource).toContain('border-left: 1px solid var(--hud-line-soft)')
    expect(stageResultSource).not.toContain('background: rgba(8, 20, 46, 0.78)')
    expect(stageResultSource).not.toContain('background: rgba(255, 255, 255, 0.075)')
  })

  it('inherits the shared gameplay HUD font stack instead of resetting to system UI', () => {
    expect(stageResultSource).toContain('font-family: var(--body')
    expect(stageResultSource).not.toContain('font-family: system-ui, sans-serif')
  })

  it('centers the stage name row against the result content area', () => {
    const stageNameStyle = stageResultSource.match(/\.result-stage-name \{[^}]+\}/)?.[0] ?? ''

    expect(stageNameStyle).toContain('right: 0;')
    expect(stageNameStyle).toContain('left: 0;')
    expect(stageNameStyle).toContain('justify-content: center;')
    expect(stageNameStyle).not.toContain('transform: translateX(-50%);')
  })
})
