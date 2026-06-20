import { describe, expect, it } from 'vitest'
import stageSelectSource from './StageSelectScreen.svelte?raw'

describe('Stage Select localization contract', () => {
  it('avoids hard-coded visible text in placeholders, node labels, and control hints', () => {
    expect(stageSelectSource).toContain('<b>{text(stageSelectRefs.recordUnavailable)}</b>')
    expect(stageSelectSource).not.toContain('--:--.--')

    expect(stageSelectSource).toContain('<b>{stage.number}</b>')
    expect(stageSelectSource).toContain('<span><strong>{stageTitle(stage)}</strong>{stageSubtitle(stage)}</span>')
    expect(stageSelectSource).not.toContain('<b>{stage.id}</b>')
    expect(stageSelectSource).not.toContain('<span><strong>{stage.id}</strong>{stageSubtitle(stage)}</span>')

    expect(stageSelectSource).toContain("<span><kbd>␣</kbd> {text('common.confirm')}</span>")
    expect(stageSelectSource).toContain("<span><kbd>⎋</kbd> {text('common.back')}</span>")
    expect(stageSelectSource).not.toContain('<kbd>Space</kbd>')
    expect(stageSelectSource).not.toContain('<kbd>Esc</kbd>')
  })
})
