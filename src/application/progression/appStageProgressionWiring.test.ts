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

describe('App stage unlock projection wiring', () => {
  it('loads development debug unlock state on mount', () => {
    expect(source).toContain('resolveDebugUnlockAllStages')
    expect(source).toContain('window.location.search')
    expect(source).toContain('import.meta.env.DEV')
  })

  it('derives stage unlock state from catalog order, records, and debug unlock', () => {
    expect(source).toContain('const stageOrder = $derived(projectData.stages.order)')
    expect(source).toContain('isStageUnlocked(')
    expect(source).toContain('stageProgressionSave.stageRecords')
    expect(source).toContain('debugUnlockAllStages')
  })

  it('guards direct stage confirm and control-intent confirm with unlock state', () => {
    expect(source).toContain('function isGameplayStageUnlocked')
    expect(source).toContain('confirmSelectedStage(appState, { isStageUnlocked: isGameplayStageUnlocked })')
    expect(source).toContain('applyControlIntent({ ...appState, settings, isStageUnlocked: isGameplayStageUnlocked }, intent)')
  })

  it('prepares guarded next-stage navigation for Result HUD integration', () => {
    expect(source).toContain('getNextStageId(stageOrder, appState.screen.stageId)')
    expect(source).toContain('openNextGameplayStage(appState, nextStageId, { isStageUnlocked: isGameplayStageUnlocked })')
  })
})
