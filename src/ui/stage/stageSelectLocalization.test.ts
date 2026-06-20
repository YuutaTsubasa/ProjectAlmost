import { describe, expect, it } from 'vitest'
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

    expect(stageSelectSource).toContain('<b>{text(stageSelectRefs.recordUnavailable)}</b>')
    expect(stageSelectSource).not.toContain('--:--.--')

    expect(stageSelectSource).toContain('<b>{stage.id}</b>')
    expect(stageSelectSource).toContain('<span><strong>{stage.id}</strong>{stageSubtitle(stage)}</span>')
    expect(stageSelectSource).not.toContain('<b>{stage.number}</b>')
    expect(stageSelectSource).not.toContain('<span><strong>{stageTitle(stage)}</strong>{stageSubtitle(stage)}</span>')

    expect(stageSelectSource).toContain('ControlHints')
    expect(stageSelectSource).not.toContain('<kbd>')
  })
})
