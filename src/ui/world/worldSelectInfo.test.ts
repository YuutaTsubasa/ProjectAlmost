import { describe, expect, it } from 'vitest'
import source from './WorldSelectScreen.svelte?raw'

describe('World Select info rendering', () => {
  it('receives projected world select info', () => {
    expect(source).toContain("import type { WorldSelectInfoViewModel } from '../../application/select/selectInfoPresenter'")
    expect(source).toContain('selectInfo: WorldSelectInfoViewModel')
    expect(source).toContain('const selectedWorldInfo = $derived(')
  })

  it('renders chapter progress from select info instead of hard-coded zeroes', () => {
    expect(source).toContain('selectedWorldInfo.clearedStageCount')
    expect(source).toContain('selectedWorldInfo.stageCount')
    expect(source).toContain('selectedWorldInfo.progressPercent')
    expect(source).not.toContain('<b>0<small> / {selectedWorld.stageCount}</small></b>')
    expect(source).not.toContain('style="width: 0%"')
  })
})
