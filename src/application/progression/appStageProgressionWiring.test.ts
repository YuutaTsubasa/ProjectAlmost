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

  it('routes gameplay sfx actions through the existing audio command path', () => {
    expect(source).toContain("import type { GameplaySfxAction } from './domain/audio/audioPolicy'")
    expect(source).toContain('function playGameplaySfx(action: GameplaySfxAction)')
    expect(source).toContain('audio?.execute(createSfxCommand(action, settings))')
    expect(source).toContain('onGameplaySfx={playGameplaySfx}')
  })

  it('routes gameplay, result, and pause music through the audio command path', () => {
    expect(source).toContain("import type { GameplayMusicState } from './ui/gameplay/gameplayMusicState'")
    expect(source).toContain('let gameplayMusicState = $state<GameplayMusicState>')
    expect(source).toContain('function currentGameplayMusicContext()')
    expect(source).toContain('createMusicCommand(appState.screen, settings, currentGameplayMusicContext())')
    expect(source).toContain('function handleGameplayMusicStateChange(state: GameplayMusicState)')
    expect(source).toContain('onGameplayMusicStateChange={handleGameplayMusicStateChange}')
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
    expect(source).toContain('onNextStage={handleNextGameplayStage}')
  })

  it('projects next-stage availability from progression state into GameplayScreen', () => {
    expect(source).toContain("appState.screen.type === 'gameplay' ? getNextStageId(stageOrder, appState.screen.stageId) : null")
    expect(source).toContain('isGameplayStageUnlocked(nextGameplayStageId)')
    expect(source).toContain('nextStageAvailable={nextGameplayStageAvailable}')
  })
})

describe('App stage select progression UI wiring', () => {
  it('projects stage progression options for Stage Select from records and debug unlock', () => {
    expect(source).toContain('projectStageProgressionOptions(')
    expect(source).toContain('stageProgressionSave.stageRecords')
    expect(source).toContain('debugUnlockAllStages')
    expect(source).toContain('const stageProgressionOptions = $derived(')
  })

  it('passes projected stage progression options into StageSelectScreen', () => {
    expect(source).toContain('stageProgressionOptions={stageProgressionOptions}')
  })
})
