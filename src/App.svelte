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
  import { createMusicCommand, createSfxCommand } from './application/audio/audioCommands'
  import { getControlIntentSfxAction } from './application/audio/audioEvents'
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
  import { createProjectIdentity } from './domain/app/projectIdentity'
  import { projectData } from './domain/data/projectData'
  import type { LocaleCode } from './domain/data/localize/localize'
  import { getGameplayStageMap } from './domain/gameplay/gameplayStageMaps'
  import type { ControlIntent } from './domain/input/controlIntents'
  import type { StageId } from './domain/data/worlds/worldTypes'
  import {
    getNextStageId,
    isStageUnlocked,
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
  import SettingsScreen from './ui/settings/SettingsScreen.svelte'
  import StageSelectScreen from './ui/stage/StageSelectScreen.svelte'
  import TitleScreen from './ui/title/TitleScreen.svelte'
  import WorldSelectScreen from './ui/world/WorldSelectScreen.svelte'

  let settings: GameSettings = $state(parseStoredSettings(null, false))
  let appState = $state(createInitialAppState())
  let stageProgressionSave = $state(createEmptySave())
  let debugUnlockAllStages = $state(false)
  let audio: BrowserAudioController | undefined
  const identity = createProjectIdentity()
  const locale: LocaleCode = $derived(settings.language)
  const stageOrder = $derived(projectData.stages.order)
  const gameplayStageMap = $derived(
    appState.screen.type === 'gameplay' ? getGameplayStageMap(appState.screen.stageId) : undefined,
  )
  const nextGameplayStageId = $derived(
    appState.screen.type === 'gameplay' ? getNextStageId(stageOrder, appState.screen.stageId) : null,
  )
  const nextGameplayStageAvailable = $derived(
    nextGameplayStageId !== null && isGameplayStageUnlocked(nextGameplayStageId),
  )

  function isGameplayStageUnlocked(stageId: StageId): boolean {
    return isStageUnlocked(
      stageOrder,
      stageProgressionSave.stageRecords,
      stageId,
      debugUnlockAllStages,
    )
  }

  function syncMusicForCurrentState() {
    audio?.execute(createMusicCommand(appState.screen, settings))
  }

  function playUiSfx(action: 'move' | 'confirm' | 'back') {
    audio?.execute(createSfxCommand(action, settings))
  }

  function syncSettings(nextSettings: GameSettings) {
    settings = nextSettings
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
    syncMusicForCurrentState()
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
    appState = { screen: nextState.screen }

    if (nextState.settings) {
      syncSettings(nextState.settings)
      if (nextState.settings.fullscreen !== previousFullscreen) {
        void setFullscreen(nextState.settings.fullscreen)
      }
    }

    const sfxAction = getControlIntentSfxAction(previousScreen, appState.screen, intent)
    if (sfxAction) playUiSfx(sfxAction)
    syncMusicForCurrentState()
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
    }
    syncMusicForCurrentState()
  }

  function handleConfirmWorld() {
    playUiSfx('confirm')
    appState = confirmSelectedWorld(appState)
    syncMusicForCurrentState()
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
    }
    syncMusicForCurrentState()
  }

  function handleConfirmStage() {
    playUiSfx('confirm')
    appState = confirmSelectedStage(appState, { isStageUnlocked: isGameplayStageUnlocked })
    syncMusicForCurrentState()
  }

  function handleNextGameplayStage() {
    if (appState.screen.type !== 'gameplay') return

    const nextStageId = getNextStageId(stageOrder, appState.screen.stageId)
    const previousScreen = appState.screen
    appState = openNextGameplayStage(appState, nextStageId, { isStageUnlocked: isGameplayStageUnlocked })
    if (appState.screen !== previousScreen) {
      playUiSfx('confirm')
      syncMusicForCurrentState()
    }
  }

  function handleRetryGameplayStage() {
    playUiSfx('confirm')
    appState = retryGameplayStage(appState)
    syncMusicForCurrentState()
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
    appState = returnFromGameplayToStageSelect(appState)
    syncMusicForCurrentState()
  }

  function handleBackFromStageSelect() {
    playUiSfx('back')
    appState = backFromStageSelect(appState)
    syncMusicForCurrentState()
  }

  function handleBackFromWorldSelect() {
    playUiSfx('back')
    appState = backFromWorldSelect(appState)
    syncMusicForCurrentState()
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
      appState = { screen: { type: 'title-menu', selectedItemIndex: 1 } }
      playUiSfx('back')
      syncMusicForCurrentState()
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
    syncSettings(parseStoredSettings(localStorage.getItem(SETTINGS_STORAGE_KEY), actualFullscreen()))
    const initialMusicCommand = createMusicCommand(appState.screen, settings)
    if (initialMusicCommand) {
      void audio.attemptAutoplay(initialMusicCommand.volume)
    }

    const unlockAudio = () => {
      audio?.unlock()
      syncMusicForCurrentState()
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

<main class="shell">
  <ResolutionFrame>
    {#if appState.screen.type === 'title-intro' || appState.screen.type === 'title-menu'}
      <TitleScreen
        screen={appState.screen}
        productName={identity.productName}
        localizeData={projectData.localize}
        locale={locale}
        onControlIntent={handleControlIntent}
        onSelectItem={handleSelectTitleMenuItem}
      />
    {:else if appState.screen.type === 'world-select'}
      <WorldSelectScreen
        catalog={projectData.worlds}
        localizeData={projectData.localize}
        locale={locale}
        selectedWorldIndex={appState.screen.selectedWorldIndex}
        onControlIntent={handleControlIntent}
        onSelectWorld={handleSelectWorld}
        onConfirmWorld={handleConfirmWorld}
        onBack={handleBackFromWorldSelect}
      />
    {:else if appState.screen.type === 'stage-select'}
      <StageSelectScreen
        worlds={projectData.worlds}
        stages={projectData.stages}
        localizeData={projectData.localize}
        locale={locale}
        selectedWorldIndex={appState.screen.selectedWorldIndex}
        selectedStageIndex={appState.screen.selectedStageIndex}
        onControlIntent={handleControlIntent}
        onSelectStage={handleSelectStage}
        onConfirmStage={handleConfirmStage}
        onBack={handleBackFromStageSelect}
      />
    {:else if appState.screen.type === 'gameplay' && gameplayStageMap}
      {#key getGameplayScreenKey(appState.screen)}
        <GameplayScreen
          stage={gameplayStageMap}
          {settings}
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
