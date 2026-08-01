import { describe, expect, it } from 'vitest'
import appCss from '../../app.css?raw'
import stageSelectSource from './StageSelectScreen.svelte?raw'

describe('Stage Select localization contract', () => {
  it('keeps prototype-aligned visible text density and localized placeholders', () => {
    expect(stageSelectSource).toContain('function worldTitle(world: WorldData): string')
    expect(stageSelectSource).toContain('return text(world.titleRef)')
    expect(stageSelectSource).not.toContain('function worldSubtitle(world: WorldData): string')
    expect(stageSelectSource).not.toContain('class="stage-world-title"')
    expect(stageSelectSource).not.toContain('class="stage-world-subtitle"')
    expect(stageSelectSource).toContain(
      '<strong class="stage-title">{worldTitle(selectedWorld)} {selectedStage.id}</strong>',
    )

    expect(stageSelectSource).toContain('stageSelectRefs.recordUnavailable')
    expect(stageSelectSource).not.toContain('--:--.--')

    expect(stageSelectSource).toContain("{stageProgression(stage.id).unlocked ? stage.id : '◆'}")
    expect(stageSelectSource).toContain('<span><strong>{stage.id}</strong>{stageSubtitle(stage)}</span>')
    expect(stageSelectSource).not.toContain('<b>{stage.number}</b>')
    expect(stageSelectSource).not.toContain('<span><strong>{stageTitle(stage)}</strong>{stageSubtitle(stage)}</span>')

    expect(stageSelectSource).toContain('ControlHints')
    expect(stageSelectSource).not.toContain('<kbd>')
  })

  it('renders the prototype-style layered stage preview scene', () => {
    expect(stageSelectSource).toContain('class="stage-preview-scene"')
    expect(stageSelectSource).toContain('class="stage-preview-background"')
    expect(stageSelectSource).toContain('src={stagePreviewBackground(selectedStage)}')
    expect(stageSelectSource).toContain('class="stage-preview-foreground"')
    expect(stageSelectSource).toContain('src={selectedStage.previewAssetRef}')
  })
})

describe('Stage Select progression UI contract', () => {
  it('receives stage progression option states from App', () => {
    expect(stageSelectSource).toContain('stageProgressionOptions')
    expect(stageSelectSource).toContain('progressionByStageId')
    expect(stageSelectSource).toContain('selectedStageProgression')
    expect(stageSelectSource).toContain('unlocked: false')
  })

  it('renders localized locked state without hiding the selected preview', () => {
    expect(stageSelectSource).toContain("text('common.locked')")
    expect(stageSelectSource).toContain('class="stage-preview-lock"')
    expect(stageSelectSource).toContain('{#if !selectedStageProgression.unlocked}')
    expect(stageSelectSource).toContain('stageObjective(selectedStage)')
  })

  it('renders locked and cleared markers and animates every route segment', () => {
    expect(stageSelectSource).toContain('class:locked={!stageProgression(stage.id).unlocked}')
    expect(stageSelectSource).toContain('class:cleared={stageProgression(stage.id).cleared}')
    expect(stageSelectSource).toContain('<line')
    expect(stageSelectSource).toContain('style={`--path-index:${index}`}')
    // Route lines animate uniformly regardless of unlock state, so there is no
    // per-segment live gating anymore.
    expect(stageSelectSource).not.toContain('class:live')
    expect(stageSelectSource).not.toContain('isLiveStage')
    expect(stageSelectSource).not.toContain(
      '<button\n        class:active={index === selectedStageIndex}\n        class:boss={stage.isBoss}\n        class:locked={!stageProgression(stage.id).unlocked}\n        class:cleared={stageProgression(stage.id).cleared}\n        class:live={isLiveStage(index)}\n        class="stage-node"',
    )
    expect(stageSelectSource).toContain(
      '<button\n        class:active={index === selectedStageIndex}\n        class:boss={stage.isBoss}\n        class:locked={!stageProgression(stage.id).unlocked}\n        class:cleared={stageProgression(stage.id).cleared}\n        class="stage-node"',
    )
    expect(stageSelectSource).not.toContain(
      '<!-- class:live={stageProgression(stage.id).unlocked && stageProgression(stageOptions[index + 1].id).unlocked} -->',
    )
    expect(stageSelectSource).toContain("{stageProgression(stage.id).unlocked ? stage.id : '◆'}")
  })

  it('keeps deploy and double-click inert for locked stages', () => {
    expect(stageSelectSource).toContain('if (!stageProgressionState.unlocked) return')
    expect(stageSelectSource).toContain('disabled={!selectedStageProgression.unlocked || confirming}')
    expect(stageSelectSource).toContain('onSelectStage(index)')
    expect(stageSelectSource).toContain('handleConfirmStage(selectedStageProgression)')
    expect(stageSelectSource).toContain('handleConfirmStage(stageProgression(stage.id))')
  })

  it('renders cleared records from the progression option state', () => {
    expect(stageSelectSource).toContain('selectedStageProgression.record?.maxCoins ?? 0')
    expect(stageSelectSource).toContain(
      'selectedStageProgression.record?.bestTime ?? text(stageSelectRefs.recordUnavailable)',
    )
    expect(stageSelectSource).toContain(
      'selectedStageProgression.record?.bestRank ?? text(stageSelectRefs.recordUnavailable)',
    )
  })
})

describe('Stage Select progression visual styles', () => {
  it('defines locked preview, disabled deploy, animated path, locked node, and cleared node classes', () => {
    expect(appCss).toContain('.stage-preview-lock')
    expect(appCss).toContain('.stage-deploy:disabled')
    expect(appCss).toContain('.stage-paths line {')
    expect(appCss).not.toContain('.stage-paths line.live')
    expect(appCss).toContain('stroke: rgba(255, 255, 255, 0.92);')
    expect(appCss).toContain('drop-shadow(0 0 4px rgba(142, 201, 255, 0.42))')
    expect(appCss).toContain('animation: stage-path-live-draw')
    expect(appCss).toContain('calc(240ms + var(--path-index) * 90ms)')
    expect(appCss).toContain('@keyframes stage-path-live-draw')
    expect(appCss).toContain('@media (prefers-reduced-motion: reduce)')
    expect(appCss).toContain('animation: none;')
    expect(appCss).toContain('.stage-node.locked')
    expect(appCss).toContain('.stage-node.cleared')
  })
})
