import { describe, expect, it } from 'vitest'
import appSource from '../../App.svelte?raw'

function getFunctionSource(functionName: string): string {
  const functionStart = appSource.indexOf(`function ${functionName}`)
  const asyncFunctionStart = appSource.indexOf(`async function ${functionName}`)
  const start = Math.max(functionStart, asyncFunctionStart)
  if (start === -1) throw new Error(`Function ${functionName} was not found in App.svelte`)

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
  if (transitionStart === -1) throw new Error('enterGameplay transition callback was not found')

  const callbackStart = source.indexOf('() => {', transitionStart)
  if (callbackStart === -1) throw new Error('enterGameplay transition callback was not found')

  const bodyStart = callbackStart + '() => '.length
  let depth = 0

  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1
    if (source[index] === '}') {
      depth -= 1
      if (depth === 0) return source.slice(bodyStart, index + 1)
    }
  }

  throw new Error('enterGameplay transition callback was not found')
}

function expectGameplayPreloadBeforeTransition(handlerName: string) {
  const handlerSource = getFunctionSource(handlerName)
  expect(handlerSource).toContain('await enterGameplay(nextState)')
}

describe('App preload wiring', () => {
  it('fails source extraction helpers clearly when expected wiring is missing', () => {
    expect(() => getFunctionSource('missingFunctionForContract')).toThrow(
      'Function missingFunctionForContract was not found in App.svelte',
    )
    expect(() => getTransitionCallbackBody('async function enterGameplay() {}')).toThrow(
      'enterGameplay transition callback was not found',
    )
  })

  it('renders LoadingScreen before boot is ready', () => {
    expect(appSource).toContain("import LoadingScreen from './ui/loading/LoadingScreen.svelte'")
    expect(appSource).toContain("type LoadingGateState =")
    expect(appSource).toContain("kind: 'boot'")
    expect(appSource).toContain("kind: 'gameplay'")
    expect(appSource).toContain("kind: 'idle'")
    expect(appSource).toContain('const activeLoadingView = $derived(')
    expect(appSource).toContain("loadingGate.kind === 'idle' ? null : loadingGate.view")
    expect(appSource).toContain('const bootPreloadPlan = buildBootPreloadPlan(projectData)')
    expect(appSource).toContain('createInitialPreloadProgress(bootPreloadPlan.length, \'boot\')')
    expect(getOnMountSource()).toMatch(
      /void preloader\.preload\(bootPreloadPlan, \{\s*phase: 'boot',\s*onProgress:/,
    )
    expect(appSource.match(/buildBootPreloadPlan\(projectData\)/g)).toHaveLength(1)
    expect(appSource).toMatch(
      /\{#if activeLoadingView\}\s*<LoadingScreen[\s\S]*?\/>\s*\{:else if appState\.screen\.type === 'title-intro'/,
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

  it('reserves gameplay entry before preload and hides loading during the covered gameplay screen swap', () => {
    const entrySource = getFunctionSource('enterGameplay')
    const reservationCheckIndex = entrySource.indexOf("if (loadingGate.kind === 'gameplay') return")
    const reservationSetIndex = entrySource.search(/loadingGate = \{\s*kind: 'gameplay'/)
    const preloadIndex = entrySource.indexOf('await preloadGameplayEntry(nextState.screen)')
    const transitionIndex = entrySource.indexOf('await transitionToScreen(nextState.screen')
    const transitionCallbackBody = getTransitionCallbackBody(entrySource)
    const hideLoadingIndex = transitionCallbackBody.indexOf("loadingGate = { kind: 'idle' }")
    const applyGameplayIndex = transitionCallbackBody.indexOf('appState = nextState')

    expect(reservationCheckIndex).toBeGreaterThan(-1)
    expect(reservationSetIndex).toBeGreaterThan(reservationCheckIndex)
    expect(preloadIndex).toBeGreaterThan(reservationSetIndex)
    expect(transitionIndex).toBeGreaterThan(preloadIndex)
    expect(hideLoadingIndex).toBeGreaterThan(-1)
    expect(applyGameplayIndex).toBeGreaterThan(hideLoadingIndex)
    expect(appSource).not.toContain('gameplayPreloadActive')
    expect(appSource).not.toContain('gameplayEntryReserved')
    expect(appSource).not.toContain('activeLoadingPhase')
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
      /if \(\s*previousScreen\.type === 'world-select' &&\s*intent === 'confirm' &&\s*nextState\.screen\.type === 'stage-select'\s*\) \{[\s\S]*transitionToScreen\(nextState\.screen/,
    )
    expect(controlIntentSource).toMatch(
      /previousScreen\.type === 'stage-select'[\s\S]*?previousScreen\.selectedStageIndex !== nextState\.screen\.selectedStageIndex[\s\S]*?preloadStageSelectionInBackground\(nextState\.screen\.worldId, nextState\.screen\.selectedStageIndex\)/,
    )
    expect(backgroundPreloadSource).toMatch(
      /void preloader\.preloadInBackground\(buildStagePreloadPlan\(projectData, stage\)\)/,
    )
  })

  it('routes Stage Select control confirmation through the computed gameplay state without recomputing it', () => {
    const controlIntentSource = getFunctionSource('handleControlIntent')
    const delegationIndex = controlIntentSource.indexOf("previousScreen.type === 'stage-select'")
    const genericMutationIndex = controlIntentSource.indexOf('appState = { screen: nextState.screen }')
    const genericTransitionIndex = controlIntentSource.indexOf(
      'void transitionToScreen(nextState.screen, applyNextState)',
    )

    expect(controlIntentSource).toMatch(
      /if \(\s*previousScreen\.type === 'stage-select' &&\s*intent === 'confirm' &&\s*nextState\.screen\.type === 'gameplay'\s*\) \{\s*playUiSfx\('confirm'\)\s*void enterGameplay\(nextState\)\s*return\s*\}/,
    )
    expect(controlIntentSource).not.toContain('void handleConfirmStage()')
    expect(controlIntentSource).not.toContain('handleConfirmWorld()')
    expect(delegationIndex).toBeGreaterThan(-1)
    expect(genericMutationIndex).toBeGreaterThan(delegationIndex)
    expect(genericTransitionIndex).toBeGreaterThan(delegationIndex)
  })
})
