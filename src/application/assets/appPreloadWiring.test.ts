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

function getTransitionCallbackBody(source: string): string {
  const transitionStart = source.indexOf('await transitionToScreen(nextState.screen')
  const callbackStart = source.indexOf('() => {', transitionStart)
  const bodyStart = callbackStart + '() => '.length
  let depth = 0

  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1
    if (source[index] === '}') {
      depth -= 1
      if (depth === 0) return source.slice(bodyStart, index + 1)
    }
  }

  return ''
}

function expectGameplayPreloadBeforeTransition(handlerName: string) {
  const handlerSource = getFunctionSource(handlerName)
  expect(handlerSource).toContain('await enterGameplay(nextState)')
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

  it('routes each gameplay entry handler through the shared preload gate', () => {
    expect(appSource).toContain('async function preloadGameplayEntry')
    expect(appSource).toContain('buildStagePreloadPlan(projectData, stage)')
    expect(appSource).toContain('buildSharedGameplayPreloadPlan()')

    expectGameplayPreloadBeforeTransition('handleConfirmStage')
    expectGameplayPreloadBeforeTransition('handleRetryGameplayStage')
    expectGameplayPreloadBeforeTransition('handleNextGameplayStage')
  })

  it('reserves gameplay entry before preload and releases it only after the transition completes', () => {
    const entrySource = getFunctionSource('enterGameplay')
    const reservationCheckIndex = entrySource.indexOf('if (gameplayEntryReserved) return')
    const reservationSetIndex = entrySource.indexOf('gameplayEntryReserved = true')
    const transitionBlockCheckIndex = entrySource.indexOf(
      'if (shouldBlockGameplayEntryTransition(nextState.screen)) return',
    )
    const preloadIndex = entrySource.indexOf('await preloadGameplayEntry(nextState.screen)')
    const transitionIndex = entrySource.indexOf('await transitionToScreen(nextState.screen')
    const releaseIndex = entrySource.lastIndexOf('gameplayEntryReserved = false')
    const transitionBlockSource = getFunctionSource('shouldBlockGameplayEntryTransition')

    expect(reservationCheckIndex).toBeGreaterThan(-1)
    expect(reservationSetIndex).toBeGreaterThan(reservationCheckIndex)
    expect(transitionBlockCheckIndex).toBeGreaterThan(reservationSetIndex)
    expect(preloadIndex).toBeGreaterThan(transitionBlockCheckIndex)
    expect(transitionIndex).toBeGreaterThan(preloadIndex)
    expect(getTransitionCallbackBody(entrySource)).toContain('appState = nextState')
    expect(transitionBlockSource).toContain('resolveSceneTransitionStyle(appState.screen, nextScreen)')
    expect(transitionBlockSource).toContain('shouldBlockSceneTransitionReentry(style, sceneTransition)')
    expect(entrySource).toMatch(
      /finally \{\s*gameplayPreloadActive = false\s*gameplayEntryReserved = false\s*\}/,
    )
    expect(releaseIndex).toBeGreaterThan(transitionIndex)
  })

  it('preloads highlighted World Select and Stage Select content in the background', () => {
    const worldSelectionSource = getFunctionSource('handleSelectWorld')
    const stageSelectionSource = getFunctionSource('handleSelectStage')
    const worldConfirmationSource = getFunctionSource('handleConfirmWorld')
    const controlIntentSource = getFunctionSource('handleControlIntent')
    const backgroundPreloadSource = getFunctionSource('preloadStageInBackground')

    expect(worldSelectionSource).toContain(
      'preloadWorldRepresentativeInBackground(appState.screen.selectedWorldIndex)',
    )
    expect(stageSelectionSource).toContain(
      'preloadStageSelectionInBackground(appState.screen.worldId, appState.screen.selectedStageIndex)',
    )
    expect(worldConfirmationSource).toMatch(
      /appState = nextState[\s\S]*?preloadStageSelectionInBackground\(nextState\.screen\.worldId, nextState\.screen\.selectedStageIndex\)/,
    )
    expect(controlIntentSource).toMatch(
      /previousScreen\.type === 'stage-select'[\s\S]*?previousScreen\.selectedStageIndex !== nextState\.screen\.selectedStageIndex[\s\S]*?preloadStageSelectionInBackground\(nextState\.screen\.worldId, nextState\.screen\.selectedStageIndex\)/,
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
