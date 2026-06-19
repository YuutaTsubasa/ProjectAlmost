<script lang="ts">
  import { onMount } from 'svelte'
  import {
    backFromWorldSelect,
    cancelDeleteConfirm,
    confirmSelectedWorld,
    createInitialAppState,
    selectTitleMenuItem,
    selectWorld,
  } from './domain/app/appFlow'
  import { applyControlIntent } from './application/input/appControls'
  import { createProjectIdentity } from './domain/app/projectIdentity'
  import { projectData } from './domain/data/projectData'
  import type { LocaleCode } from './domain/data/localize/localize'
  import type { ControlIntent } from './domain/input/controlIntents'
  import {
    adjustSettingsRow,
    parseStoredSettings,
    resetSettings,
    SETTINGS_STORAGE_KEY,
    type GameSettings,
  } from './domain/settings/settings'
  import ResolutionFrame from './ui/layout/ResolutionFrame.svelte'
  import SettingsScreen from './ui/settings/SettingsScreen.svelte'
  import TitleScreen from './ui/title/TitleScreen.svelte'
  import WorldSelectScreen from './ui/world/WorldSelectScreen.svelte'

  let settings: GameSettings = $state(parseStoredSettings(null, false))
  let appState = $state(createInitialAppState())
  const identity = createProjectIdentity()
  const locale: LocaleCode = $derived(settings.language)

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
    } finally {
      syncSettings({ ...settings, fullscreen: actualFullscreen() })
    }
  }

  function handleSelectTitleMenuItem(index: number) {
    appState = selectTitleMenuItem(appState, index)
  }

  function handleControlIntent(intent: ControlIntent) {
    const previousFullscreen = settings.fullscreen
    const nextState = applyControlIntent({ ...appState, settings }, intent)
    appState = { screen: nextState.screen }

    if (nextState.settings) {
      syncSettings(nextState.settings)
      if (nextState.settings.fullscreen !== previousFullscreen) {
        void setFullscreen(nextState.settings.fullscreen)
      }
    }
  }

  function handleSelectWorld(index: number) {
    appState = selectWorld(appState, index)
  }

  function handleConfirmWorld() {
    appState = confirmSelectedWorld(appState)
  }

  function handleBackFromWorldSelect() {
    appState = backFromWorldSelect(appState)
  }

  function handleSelectSettingsItem(index: number) {
    if (appState.screen.type !== 'settings' || appState.screen.deleteConfirm) return
    appState = { screen: { ...appState.screen, selectedItemIndex: index } }
  }

  function handleAdjustSettingsItem(index: number, direction: -1 | 1) {
    const nextSettings = adjustSettingsRow(
      settings,
      index,
      direction,
      projectData.localize.languages.map((language) => language.code),
    )

    syncSettings(nextSettings)
    if (index === 4) void setFullscreen(nextSettings.fullscreen)
  }

  function handleActivateSettingsItem(index: number) {
    if (index <= 6) {
      handleAdjustSettingsItem(index, 1)
      return
    }
    if (index === 7) {
      syncSettings(resetSettings(actualFullscreen()))
      return
    }
    if (index === 8 && appState.screen.type === 'settings') {
      appState = { screen: { ...appState.screen, deleteConfirm: { selectedActionIndex: 0 } } }
      return
    }
    if (index === 9) {
      appState = { screen: { type: 'title-menu', selectedItemIndex: 1 } }
    }
  }

  function handleCancelDelete() {
    appState = cancelDeleteConfirm(appState)
  }

  function handleConfirmDelete() {
    appState = cancelDeleteConfirm(appState)
  }

  onMount(() => {
    syncSettings(parseStoredSettings(localStorage.getItem(SETTINGS_STORAGE_KEY), actualFullscreen()))

    const handleFullscreenChange = () => {
      syncSettings({ ...settings, fullscreen: actualFullscreen() })
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
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
