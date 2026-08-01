import { describe, expect, it } from 'vitest'
import appSource from '../../App.svelte?raw'

function getFunctionSource(functionName: string): string {
  const functionStart = appSource.indexOf(`function ${functionName}`)
  const asyncFunctionStart = appSource.indexOf(`async function ${functionName}`)
  const start = Math.max(functionStart, asyncFunctionStart)
  const nextFunctionStart = appSource.indexOf('\n  function ', start + 1)
  const nextAsyncFunctionStart = appSource.indexOf('\n  async function ', start + 1)
  const end = Math.min(
    ...[nextFunctionStart, nextAsyncFunctionStart].filter((index) => index !== -1),
  )

  return appSource.slice(start, end === Infinity ? undefined : end)
}

function expectGameplayPreloadBeforeScreenMutation(handlerName: string) {
  const handlerSource = getFunctionSource(handlerName)
  const preloadIndex = handlerSource.indexOf('await preloadGameplayEntry(nextState.screen)')
  const mutationIndex = handlerSource.indexOf('appState = nextState')

  expect(preloadIndex).toBeGreaterThan(-1)
  expect(mutationIndex).toBeGreaterThan(preloadIndex)
}

describe('App preload wiring', () => {
  it('renders LoadingScreen before boot is ready', () => {
    expect(appSource).toContain("import LoadingScreen from './ui/loading/LoadingScreen.svelte'")
    expect(appSource).toContain('bootPreloadView')
    expect(appSource).toContain('LoadingScreen')
  })

  it('awaits the preload gate before each gameplay entry handler mutates screens', () => {
    expect(appSource).toContain('async function preloadGameplayEntry')
    expect(appSource).toContain('buildStagePreloadPlan(projectData, stage)')
    expect(appSource).toContain('buildSharedGameplayPreloadPlan()')

    expectGameplayPreloadBeforeScreenMutation('handleConfirmStage')
    expectGameplayPreloadBeforeScreenMutation('handleRetryGameplayStage')
    expectGameplayPreloadBeforeScreenMutation('handleNextGameplayStage')
  })

  it('delegates Stage Select control confirmation to the gated stage confirmation handler', () => {
    const controlIntentSource = getFunctionSource('handleControlIntent')
    const delegationIndex = controlIntentSource.indexOf("previousScreen.type === 'stage-select'")
    const genericMutationIndex = controlIntentSource.indexOf('appState = { screen: nextState.screen }')
    const genericTransitionIndex = controlIntentSource.indexOf(
      'void transitionToScreen(nextState.screen, applyNextState)',
    )

    expect(controlIntentSource).toMatch(
      /if \(\s*previousScreen\.type === 'stage-select' &&\s*intent === 'confirm' &&\s*nextState\.screen\.type === 'gameplay'\s*\) \{\s*void handleConfirmStage\(\)\s*return\s*\}/,
    )
    expect(delegationIndex).toBeGreaterThan(-1)
    expect(genericMutationIndex).toBeGreaterThan(delegationIndex)
    expect(genericTransitionIndex).toBeGreaterThan(delegationIndex)
  })
})
