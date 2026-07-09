import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = readFileSync('src/App.svelte', 'utf8')

describe('App stage progression record wiring', () => {
  it('loads stage progression save state on mount', () => {
    expect(source).toContain('loadStageProgressionSave')
    expect(source).toContain('let stageProgressionSave = $state(createEmptySave())')
    expect(source).toContain('stageProgressionSave = loadStageProgressionSave(localStorage)')
  })

  it('records stage clear results for the active gameplay stage', () => {
    expect(source).toContain('function handleStageClear(result: StageClearResult)')
    expect(source).toContain("if (appState.screen.type !== 'gameplay') return")
    expect(source).toContain('recordStageClear(')
    expect(source).toContain('appState.screen.stageId')
    expect(source).toContain('onStageClear={handleStageClear}')
  })

  it('deletes progression save when settings delete is confirmed', () => {
    expect(source).toContain('deleteStageProgressionSave(localStorage)')
    expect(source).toContain('stageProgressionSave = deleteStageProgressionSave(localStorage)')
  })
})
