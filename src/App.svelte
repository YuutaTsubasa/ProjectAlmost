<script lang="ts">
  import { onMount } from 'svelte'
  import {
    backFromStageSelect,
    backFromWorldSelect,
    cancelDeleteConfirm,
    confirmSelectedStage,
    confirmSelectedWorld,
    createInitialAppState,
    getGameplayScreenKey,
    openNextGameplayStage,
    retryGameplayStage,
    returnFromGameplayToStageSelect,
    selectStage,
    selectTitleMenuItem,
    selectWorld,
  } from './domain/app/appFlow'
  import {
    createMusicCommand,
    createSfxCommand,
    getGameplayMusicContext,
  } from './application/audio/audioCommands'
  import { createBrowserAssetPreloader } from './application/assets/browserAssetPreloader'
  import {
    createInitialPreloadProgress,
    presentPreloadProgress,
    type PreloadProgressSnapshot,
  } from './application/assets/preloadProgress'
  import { getControlIntentSfxAction } from './application/audio/audioEvents'
  import { createCharacterInfoViewModel } from './application/character/characterInfoPresenter'
  import { projectStageSelectInfo, projectWorldSelectInfo } from './application/select/selectInfoPresenter'
  import {
    createBrowserAudioController,
    type BrowserAudioController,
  } from './application/audio/browserAudioController'
  import { applyControlIntent } from './application/input/appControls'
  import {
    createEmptySave,
    deleteStageProgressionSave,
    loadStageProgressionSave,
    recordStageClear,
    resolveDebugUnlockAllStages,
  } from './application/progression/browserStageProgressionStore'
  import {
    getSceneTransitionTiming,
    initialSceneTransitionState,
    resolveSceneTransitionStyle,
    shouldBlockSceneTransitionReentry,
    type SceneTransitionState,
  } from './application/sceneTransition/sceneTransitionPolicy'
  import { resolveShellBackdrop } from './application/shell/shellBackdrop'
  import { PRODUCT_NAME } from './domain/app/projectIdentity'
  import {
    buildBootPreloadPlan,
    buildGameplayEntryPreloadPlan,
    buildStagePreloadPlan,
  } from './domain/assets/preloadManifest'
  import { getCharacterProfile, selectedCharacterId } from './domain/character/characterProfile'
  import { projectData } from './domain/data/projectData'
  import type { GameplaySfxAction } from './domain/audio/audioPolicy'
  import { resolveLocalizedText } from './domain/data/localize/localize'
  import { getGameplayStageMap } from './domain/gameplay/gameplayStageMaps'
  import type { ControlIntent } from './domain/input/controlIntents'
  import type { StageId, WorldId } from './domain/data/worlds/worldTypes'
  import {
    getNextStageId,
    isStageUnlocked,
    projectStageProgressionOptions,
    type StageClearResult,
  } from './domain/progression/stageProgression'
  import {
    adjustSettingsRow,
    parseStoredSettings,
    resetSettings,
    SETTINGS_STORAGE_KEY,
    type GameSettings,
  } from './domain/settings/settings'
  import ResolutionFrame from './ui/layout/ResolutionFrame.svelte'
  import GameplayScreen from './ui/gameplay/GameplayScreen.svelte'
  import { initialGameplayMusicState } from './ui/gameplay/gameplayMusicState'
  import type { GameplayMusicState } from './ui/gameplay/gameplayMusicState'
  import LoadingScreen from './ui/loading/LoadingScreen.svelte'
  import SettingsScreen from './ui/settings/SettingsScreen.svelte'
  import StageSelectScreen from './ui/stage/StageSelectScreen.svelte'
  import TitleScreen from './ui/title/TitleScreen.svelte'
  import SceneTransitionOverlay from './ui/transition/SceneTransitionOverlay.svelte'
  import WorldSelectScreen from './ui/world/WorldSelectScreen.svelte'

  type LoadingGateState =
    | { kind: 'boot'; view: PreloadProgressSnapshot }
    | { kind: 'gameplay'; view: PreloadProgressSnapshot }
    | { kind: 'idle' }

  const initialAppState = createInitialAppState()
  let settings: GameSettings = $state(parseStoredSettings(null, false))
  let appState = $state(initialAppState)
  let stageProgressionSave = $state(createEmptySave())
  let debugUnlockAllStages = $state(false)
  let gameplayMusicState = $state<GameplayMusicState>(initialGameplayMusicState)
  let sceneTransition = $state<SceneTransitionState>(initialSceneTransitionState)
  const shellBackdrop = $derived(
    resolveShellBackdrop({
      screen: appState.screen,
      worlds: projectData.worlds,
      stages: projectData.stages,
    }),
  )
  const preloader = createBrowserAssetPreloader()
  const bootPreloadPlan = buildBootPreloadPlan(projectData)
  let loadingGate = $state<LoadingGateState>({
    kind: 'boot',
    view: presentPreloadProgress(createInitialPreloadProgress(bootPreloadPlan.length, 'boot')),
  })
  let audio = $state<BrowserAudioController | undefined>(undefined)
  const characterInfo = createCharacterInfoViewModel(getCharacterProfile(selectedCharacterId))
  const locale = $derived(settings.language)
  const stageOrder = projectData.stages.order
  const stageProgressionOptions = $derived(
    projectStageProgressionOptions(
      stageOrder,
      stageProgressionSave.stageRecords,
      debugUnlockAllStages,
    ),
  )
  const worldSelectInfo = $derived(
    projectWorldSelectInfo(projectData.worlds, stageProgressionOptions),
  )
  const stageSelectInfo = $derived(
    appState.screen.type === 'stage-select'
      ? projectStageSelectInfo(
          projectData.worlds,
          projectData.stages,
          appState.screen.worldId,
          stageProgressionOptions,
        )
      : undefined,
  )
  const gameplayStageMap = $derived(
    appState.screen.type === 'gameplay' ? getGameplayStageMap(appState.screen.stageId) : undefined,
  )
  const nextGameplayStageId = $derived(
    appState.screen.type === 'gameplay' ? getNextStageId(stageOrder, appState.screen.stageId) : null,
  )
  const nextGameplayStageAvailable = $derived(
    nextGameplayStageId !== null && isGameplayStageUnlocked(nextGameplayStageId),
  )
  const activeLoadingView = $derived(loadingGate.kind === 'idle' ? null : loadingGate.view)
  const loadingPhaseLabel = $derived(
    activeLoadingView
      ? resolveLocalizedText(projectData.localize, locale, `loading.phase.${activeLoadingView.phase}`)
      : '',
  )

  function isGameplayStageUnlocked(stageId: StageId): boolean {
    return isStageUnlocked(
      stageOrder,
      stageProgressionSave.stageRecords,
      stageId,
      debugUnlockAllStages,
    )
  }

  function currentGameplayMusicContext() {
    return getGameplayMusicContext(appState.screen, projectData.stages, gameplayMusicState)
  }

  $effect(() => {
    audio?.execute(createMusicCommand(appState.screen, settings, currentGameplayMusicContext()))
  })

  function playUiSfx(action: 'move' | 'confirm' | 'back') {
    audio?.execute(createSfxCommand(action, settings))
  }

  function playGameplaySfx(action: GameplaySfxAction) {
    audio?.execute(createSfxCommand(action, settings))
  }

  function waitForSceneTransition(durationMs: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, durationMs))
  }

  function preloadStageInBackground(stageId: StageId): void {
    const stage = getGameplayStageMap(stageId)
    if (!stage) return

    void preloader.preloadInBackground(buildStagePreloadPlan(projectData, stage))
  }

  function preloadWorldRepresentativeInBackground(selectedWorldIndex: number): void {
    const worldId = projectData.worlds.order[selectedWorldIndex]
    const stageId = worldId ? projectData.worlds.items[worldId]?.stageIds[0] : undefined
    if (stageId) preloadStageInBackground(stageId)
  }

  function preloadStageSelectionInBackground(worldId: WorldId, selectedStageIndex: number): void {
    const stageId = projectData.worlds.items[worldId]?.stageIds[selectedStageIndex]
    if (stageId) preloadStageInBackground(stageId)
  }

  async function preloadGameplayEntry(nextScreen: typeof appState.screen): Promise<void> {
    if (nextScreen.type !== 'gameplay') return

    const stage = getGameplayStageMap(nextScreen.stageId)
    if (!stage) return

    const plan = buildGameplayEntryPreloadPlan(projectData, stage)
    loadingGate = {
      kind: 'gameplay',
      view: presentPreloadProgress(createInitialPreloadProgress(plan.length, 'gameplay')),
    }
    const result = await preloader.preload(plan, {
      phase: 'gameplay',
      onProgress: (snapshot) => {
        loadingGate = { kind: 'gameplay', view: snapshot }
      },
    })
    loadingGate = { kind: 'gameplay', view: result }
  }

  async function enterGameplay(nextState: typeof appState): Promise<void> {
    if (loadingGate.kind === 'gameplay') return

    loadingGate = {
      kind: 'gameplay',
      view: presentPreloadProgress(createInitialPreloadProgress(0, 'gameplay')),
    }
    await preloadGameplayEntry(nextState.screen)
    const transitioned = await transitionToScreen(nextState.screen, () => {
      loadingGate = { kind: 'idle' }
      appState = nextState
      gameplayMusicState = initialGameplayMusicState
    })
    if (!transitioned && loadingGate.kind === 'gameplay') loadingGate = { kind: 'idle' }
  }

  async function transitionToScreen(
    nextScreen: typeof appState.screen,
    applyScreenChange: () => void,
  ): Promise<boolean> {
    const previousScreen = appState.screen
    const style = resolveSceneTransitionStyle(previousScreen, nextScreen)

    if (shouldBlockSceneTransitionReentry(style, sceneTransition)) {
      return false
    }

    if (!style) {
      applyScreenChange()
      return true
    }

    const timing = getSceneTransitionTiming(style)
    sceneTransition = { phase: 'cover', style }
    await waitForSceneTransition(timing.coverMs)
    applyScreenChange()
    await waitForSceneTransition(timing.holdMs)
    sceneTransition = { phase: 'reveal', style }
    await waitForSceneTransition(timing.revealMs)
    sceneTransition = initialSceneTransitionState
    return true
  }

  function handleGameplayMusicStateChange(state: GameplayMusicState) {
    if (
      gameplayMusicState.resultVisible === state.resultVisible &&
      gameplayMusicState.paused === state.paused
    ) {
      return
    }

    gameplayMusicState = state
  }

  function syncSettings(nextSettings: GameSettings) {
    settings = nextSettings
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  }

  function actualFullscreen() {
    return Boolean(document.fullscreenElement)
  }

  async function setFullscreen(enabled: boolean) {
    try {
      if (enabled && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      } else if (!enabled && document.fullscreenElement) {
        await document.exitFullscreen()
      }
    } catch {
      // Fullscreen request can be rejected (no user gesture, permission denied);
      // settings are re-synced to the actual state in the finally block below.
    } finally {
      syncSettings({ ...settings, fullscreen: actualFullscreen() })
    }
  }

  function handleSelectTitleMenuItem(index: number) {
    const previousIndex = appState.screen.type === 'title-menu' ? appState.screen.selectedItemIndex : null
    appState = selectTitleMenuItem(appState, index)
    if (
      previousIndex !== null &&
      appState.screen.type === 'title-menu' &&
      previousIndex !== appState.screen.selectedItemIndex
    ) {
      playUiSfx('move')
    }
  }

  function handleControlIntent(intent: ControlIntent) {
    const previousScreen = appState.screen
    const previousFullscreen = settings.fullscreen
    const nextState = applyControlIntent({ ...appState, settings, isStageUnlocked: isGameplayStageUnlocked }, intent)

    if (
      previousScreen.type === 'world-select' &&
      intent === 'confirm' &&
      nextState.screen.type === 'stage-select'
    ) {
      const nextScreen = nextState.screen
      playUiSfx('confirm')
      void transitionToScreen(nextState.screen, () => {
        appState = nextState
        preloadStageSelectionInBackground(nextScreen.worldId, nextScreen.selectedStageIndex)
      })
      return
    }

    if (
      previousScreen.type === 'stage-select' &&
      intent === 'confirm' &&
      nextState.screen.type === 'gameplay'
    ) {
      playUiSfx('confirm')
      void enterGameplay(nextState)
      return
    }

    const sfxAction = getControlIntentSfxAction(previousScreen, nextState.screen, intent)

    const applyNextState = () => {
      appState = { screen: nextState.screen }
      const enteredGameplay = previousScreen.type !== 'gameplay' && appState.screen.type === 'gameplay'

      if (enteredGameplay) {
        gameplayMusicState = initialGameplayMusicState
      }

      if (nextState.settings) {
        syncSettings(nextState.settings)
        if (nextState.settings.fullscreen !== previousFullscreen) {
          void setFullscreen(nextState.settings.fullscreen)
        }
      }
    }

    if (sfxAction) playUiSfx(sfxAction)

    if (previousScreen.type === nextState.screen.type && nextState.screen.type !== 'gameplay') {
      applyNextState()
      if (
        previousScreen.type === 'world-select' &&
        nextState.screen.type === 'world-select' &&
        previousScreen.selectedWorldIndex !== nextState.screen.selectedWorldIndex
      ) {
        preloadWorldRepresentativeInBackground(nextState.screen.selectedWorldIndex)
      }
      if (
        previousScreen.type === 'stage-select' &&
        nextState.screen.type === 'stage-select' &&
        previousScreen.selectedStageIndex !== nextState.screen.selectedStageIndex
      ) {
        preloadStageSelectionInBackground(nextState.screen.worldId, nextState.screen.selectedStageIndex)
      }
      return
    }

    void transitionToScreen(nextState.screen, applyNextState)
  }

  function handleSelectWorld(index: number) {
    const previousIndex = appState.screen.type === 'world-select' ? appState.screen.selectedWorldIndex : null
    appState = selectWorld(appState, index)
    if (
      previousIndex !== null &&
      appState.screen.type === 'world-select' &&
      previousIndex !== appState.screen.selectedWorldIndex
    ) {
      playUiSfx('move')
      preloadWorldRepresentativeInBackground(appState.screen.selectedWorldIndex)
    }
  }

  function handleConfirmWorld() {
    playUiSfx('confirm')
    const nextState = confirmSelectedWorld(appState)
    void transitionToScreen(nextState.screen, () => {
      appState = nextState
      if (nextState.screen.type === 'stage-select') {
        preloadStageSelectionInBackground(nextState.screen.worldId, nextState.screen.selectedStageIndex)
      }
    })
  }

  function handleSelectStage(index: number) {
    const previousIndex = appState.screen.type === 'stage-select' ? appState.screen.selectedStageIndex : null
    appState = selectStage(appState, index)
    if (
      previousIndex !== null &&
      appState.screen.type === 'stage-select' &&
      previousIndex !== appState.screen.selectedStageIndex
    ) {
      playUiSfx('move')
      preloadStageSelectionInBackground(appState.screen.worldId, appState.screen.selectedStageIndex)
    }
  }

  async function handleConfirmStage() {
    playUiSfx('confirm')
    const nextState = confirmSelectedStage(appState, { isStageUnlocked: isGameplayStageUnlocked })
    if (nextState.screen === appState.screen) return
    await enterGameplay(nextState)
  }

  async function handleNextGameplayStage() {
    if (appState.screen.type !== 'gameplay') return

    const nextStageId = getNextStageId(stageOrder, appState.screen.stageId)
    const previousScreen = appState.screen
    const nextState = openNextGameplayStage(appState, nextStageId, { isStageUnlocked: isGameplayStageUnlocked })
    if (nextState.screen === previousScreen) return

    playUiSfx('confirm')
    await enterGameplay(nextState)
  }

  async function handleRetryGameplayStage() {
    playUiSfx('confirm')
    const nextState = retryGameplayStage(appState)
    await enterGameplay(nextState)
  }

  function handleStageClear(result: StageClearResult) {
    if (appState.screen.type !== 'gameplay') return

    stageProgressionSave = recordStageClear(
      localStorage,
      stageProgressionSave,
      appState.screen.stageId,
      result,
    )
  }

  function handleGameplaySettingsChange(nextSettings: GameSettings, fullscreenChanged: boolean): void {
    syncSettings(nextSettings)
    if (fullscreenChanged) void setFullscreen(nextSettings.fullscreen)
  }

  function handleReturnFromGameplayToStageSelect() {
    playUiSfx('back')
    const nextState = returnFromGameplayToStageSelect(appState)
    void transitionToScreen(nextState.screen, () => {
      appState = nextState
    })
  }

  function handleBackFromStageSelect() {
    playUiSfx('back')
    const nextState = backFromStageSelect(appState)
    void transitionToScreen(nextState.screen, () => {
      appState = nextState
    })
  }

  function handleBackFromWorldSelect() {
    playUiSfx('back')
    const nextState = backFromWorldSelect(appState)
    void transitionToScreen(nextState.screen, () => {
      appState = nextState
    })
  }

  function handleSelectSettingsItem(index: number) {
    if (appState.screen.type !== 'settings' || appState.screen.deleteConfirm) return
    const previousIndex = appState.screen.selectedItemIndex
    appState = { screen: { ...appState.screen, selectedItemIndex: index } }
    if (previousIndex !== index) playUiSfx('move')
  }

  function handleAdjustSettingsItem(index: number, direction: -1 | 1) {
    const nextSettings = adjustSettingsRow(
      settings,
      index,
      direction,
      projectData.localize.languages.map((language) => language.code),
    )

    syncSettings(nextSettings)
    playUiSfx('move')
    if (index === 4) void setFullscreen(nextSettings.fullscreen)
  }

  function handleActivateSettingsItem(index: number) {
    if (index <= 6) {
      playUiSfx('confirm')
      handleAdjustSettingsItem(index, 1)
      return
    }
    if (index === 7) {
      syncSettings(resetSettings(actualFullscreen()))
      playUiSfx('confirm')
      return
    }
    if (index === 8 && appState.screen.type === 'settings') {
      appState = { screen: { ...appState.screen, deleteConfirm: { selectedActionIndex: 0 } } }
      playUiSfx('confirm')
      return
    }
    if (index === 9) {
      playUiSfx('back')
      const nextScreen = { type: 'title-menu', selectedItemIndex: 1 } as const
      void transitionToScreen(nextScreen, () => {
        appState = { screen: nextScreen }
      })
    }
  }

  function handleCancelDelete() {
    playUiSfx('back')
    appState = cancelDeleteConfirm(appState)
  }

  function handleConfirmDelete() {
    playUiSfx('confirm')
    stageProgressionSave = deleteStageProgressionSave(localStorage)
    appState = cancelDeleteConfirm(appState)
  }

  onMount(() => {
    debugUnlockAllStages = resolveDebugUnlockAllStages({
      storage: localStorage,
      search: window.location.search,
      dev: import.meta.env.DEV,
    })
    stageProgressionSave = loadStageProgressionSave(localStorage)
    audio = createBrowserAudioController()
    void preloader.preload(bootPreloadPlan, {
      phase: 'boot',
      onProgress: (snapshot) => {
        loadingGate = { kind: 'boot', view: snapshot }
      },
    }).then(() => {
      loadingGate = { kind: 'idle' }
    })
    syncSettings(parseStoredSettings(localStorage.getItem(SETTINGS_STORAGE_KEY), actualFullscreen()))
    const initialMusicCommand = createMusicCommand(appState.screen, settings)
    if (initialMusicCommand) {
      void audio.attemptAutoplay(initialMusicCommand.volume)
    }

    const unlockAudio = () => {
      audio?.unlock()
    }

    const handleFullscreenChange = () => {
      syncSettings({ ...settings, fullscreen: actualFullscreen() })
    }

    window.addEventListener('keydown', unlockAudio)
    window.addEventListener('pointerdown', unlockAudio)
    window.addEventListener('touchstart', unlockAudio)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      window.removeEventListener('keydown', unlockAudio)
      window.removeEventListener('pointerdown', unlockAudio)
      window.removeEventListener('touchstart', unlockAudio)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      audio?.destroy()
      audio = undefined
    }
  })
</script>

<main
  class={`shell theme-${shellBackdrop.theme}`}
  style:--shell-backdrop={`url("${shellBackdrop.assetRef}")`}
>
  <ResolutionFrame>
    {#if activeLoadingView}
      <LoadingScreen
        progress={activeLoadingView}
        phaseLabel={loadingPhaseLabel}
        titleLabel={resolveLocalizedText(projectData.localize, locale, 'loading.title')}
        warningLabel={resolveLocalizedText(projectData.localize, locale, 'loading.warning')}
      />
    {:else if appState.screen.type === 'title-intro' || appState.screen.type === 'title-menu'}
      <TitleScreen
        screen={appState.screen}
        productName={PRODUCT_NAME}
        localizeData={projectData.localize}
        locale={locale}
        onControlIntent={handleControlIntent}
        onSelectItem={handleSelectTitleMenuItem}
      />
    {:else if appState.screen.type === 'world-select'}
      <WorldSelectScreen
        localizeData={projectData.localize}
        locale={locale}
        selectedWorldIndex={appState.screen.selectedWorldIndex}
        selectInfo={worldSelectInfo}
        onControlIntent={handleControlIntent}
        onSelectWorld={handleSelectWorld}
        onConfirmWorld={handleConfirmWorld}
        onBack={handleBackFromWorldSelect}
      />
    {:else if appState.screen.type === 'stage-select'}
      {#if stageSelectInfo}
        <StageSelectScreen
          localizeData={projectData.localize}
          locale={locale}
          selectedStageIndex={appState.screen.selectedStageIndex}
          {characterInfo}
          selectInfo={stageSelectInfo}
          onControlIntent={handleControlIntent}
          onSelectStage={handleSelectStage}
          onConfirmStage={handleConfirmStage}
          onBack={handleBackFromStageSelect}
        />
      {/if}
    {:else if appState.screen.type === 'gameplay' && gameplayStageMap}
      {#key getGameplayScreenKey(appState.screen)}
        <GameplayScreen
          stage={gameplayStageMap}
          {settings}
          {characterInfo}
          localizeData={projectData.localize}
          {locale}
          localeCodes={projectData.localize.languages.map((language) => language.code)}
          nextStageAvailable={nextGameplayStageAvailable}
          onRetry={handleRetryGameplayStage}
          onStageSelect={handleReturnFromGameplayToStageSelect}
          onNextStage={handleNextGameplayStage}
          onSettingsChange={handleGameplaySettingsChange}
          onConfirmSettingsDelete={handleConfirmDelete}
          onStageClear={handleStageClear}
          onGameplaySfx={playGameplaySfx}
          onGameplayMusicStateChange={handleGameplayMusicStateChange}
        />
      {/key}
    {:else if appState.screen.type === 'gameplay'}
      <div class="gameplay-unavailable" role="status">
        Gameplay map unavailable for this stage.
      </div>
    {:else if appState.screen.type === 'settings'}
      <SettingsScreen
        screen={appState.screen}
        {settings}
        localizeData={projectData.localize}
        locale={locale}
        onControlIntent={handleControlIntent}
        onSelectItem={handleSelectSettingsItem}
        onAdjustItem={handleAdjustSettingsItem}
        onActivateItem={handleActivateSettingsItem}
        onCancelDelete={handleCancelDelete}
        onConfirmDelete={handleConfirmDelete}
      />
    {/if}
    <SceneTransitionOverlay phase={sceneTransition.phase} style={sceneTransition.style} />
  </ResolutionFrame>
</main>

<style>
  .gameplay-unavailable {
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
    padding: 24px;
    color: #f4f7fb;
    font-size: 1.125rem;
    text-align: center;
  }
</style>
