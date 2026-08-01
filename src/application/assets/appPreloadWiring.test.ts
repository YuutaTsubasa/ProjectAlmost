import { describe, expect, it } from 'vitest'
import appSource from '../../App.svelte?raw'

describe('App preload wiring', () => {
  it('renders LoadingScreen before boot is ready', () => {
    expect(appSource).toContain("import LoadingScreen from './ui/loading/LoadingScreen.svelte'")
    expect(appSource).toContain('bootPreloadView')
    expect(appSource).toContain('LoadingScreen')
  })

  it('routes gameplay entry through preload gate before mutating to gameplay', () => {
    expect(appSource).toContain('async function preloadGameplayEntry')
    expect(appSource).toContain('buildStagePreloadPlan(projectData, stage)')
    expect(appSource).toContain('buildSharedGameplayPreloadPlan()')
    expect(appSource).toContain('await preloadGameplayEntry(nextState.screen)')
    expect(appSource).toContain('handleConfirmStage')
    expect(appSource).toContain('handleRetryGameplayStage')
    expect(appSource).toContain('handleNextGameplayStage')
  })
})
