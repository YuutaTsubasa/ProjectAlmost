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

function getOnMountSource(): string {
  const start = appSource.indexOf('onMount(() => {')
  const end = appSource.indexOf('\n  })', start)

  return appSource.slice(start, end === -1 ? undefined : end)
}

function getAcceptedTransitionCallbackBody(handlerSource: string): string {
  const transitionStart = handlerSource.indexOf(
    'const transitionAccepted = await transitionToScreen(nextState.screen',
  )
  const callbackStart = handlerSource.indexOf('() => {', transitionStart)
  const bodyStart = callbackStart + '() => '.length
  let depth = 0

  for (let index = bodyStart; index < handlerSource.length; index += 1) {
    if (handlerSource[index] === '{') depth += 1
    if (handlerSource[index] === '}') {
      depth -= 1
      if (depth === 0) return handlerSource.slice(bodyStart, index + 1)
    }
  }

  return ''
}

function expectGameplayPreloadBeforeTransition(handlerName: string) {
  const handlerSource = getFunctionSource(handlerName)
  const preloadIndex = handlerSource.indexOf('await preloadGameplayEntry(nextState.screen)')
  const transitionIndex = handlerSource.indexOf(
    'const transitionAccepted = await transitionToScreen(nextState.screen',
  )
  const mutationIndex = handlerSource.indexOf('appState = nextState')

  expect(preloadIndex).toBeGreaterThan(-1)
  expect(transitionIndex).toBeGreaterThan(preloadIndex)
  expect(mutationIndex).toBeGreaterThan(transitionIndex)
  expect(getAcceptedTransitionCallbackBody(handlerSource)).toContain('appState = nextState')
  expect(handlerSource).toContain('const transitionAccepted = await transitionToScreen')
  expect(handlerSource).toMatch(
    /if \(!transitionAccepted\) \{\s*gameplayPreloadActive = false\s*\}/,
  )
}

describe('App preload wiring', () => {
  it('renders LoadingScreen before boot is ready', () => {
    expect(appSource).toContain("import LoadingScreen from './ui/loading/LoadingScreen.svelte'")
    expect(appSource).toContain('bootPreloadView')
    expect(appSource).toMatch(
      /const bootPreloadReady = \$derived\(\s*bootPreloadView\.status === 'ready' \|\|\s*bootPreloadView\.status === 'ready-with-errors'/,
    )
    expect(getOnMountSource()).toMatch(
      /void preloader\.preload\(buildBootPreloadPlan\(projectData\), \{\s*phase: 'boot',\s*onProgress:/,
    )
    expect(appSource).toMatch(
      /\{#if !bootPreloadReady \|\| gameplayPreloadActive\}\s*<LoadingScreen[\s\S]*?\/>\s*\{:else if appState\.screen\.type === 'title-intro'/,
    )
  })

  it('awaits the preload gate before each gameplay entry handler mutates screens', () => {
    expect(appSource).toContain('async function preloadGameplayEntry')
    expect(appSource).toContain('buildStagePreloadPlan(projectData, stage)')
    expect(appSource).toContain('buildSharedGameplayPreloadPlan()')

    expectGameplayPreloadBeforeTransition('handleConfirmStage')
    expectGameplayPreloadBeforeTransition('handleRetryGameplayStage')
    expectGameplayPreloadBeforeTransition('handleNextGameplayStage')
  })

  it('preloads highlighted World Select and Stage Select content in the background', () => {
    const worldSelectionSource = getFunctionSource('handleSelectWorld')
    const stageSelectionSource = getFunctionSource('handleSelectStage')
    const backgroundPreloadSource = getFunctionSource('preloadStageInBackground')

    expect(worldSelectionSource).toContain(
      'preloadWorldRepresentativeInBackground(appState.screen.selectedWorldIndex)',
    )
    expect(stageSelectionSource).toContain(
      'preloadStageSelectionInBackground(appState.screen.worldId, appState.screen.selectedStageIndex)',
    )
    expect(backgroundPreloadSource).toMatch(
      /void preloader\.preloadInBackground\(buildStagePreloadPlan\(projectData, stage\)\)/,
    )
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
