<script lang="ts">
  import {
    backFromWorldSelect,
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
  import ResolutionFrame from './ui/layout/ResolutionFrame.svelte'
  import TitleScreen from './ui/title/TitleScreen.svelte'
  import WorldSelectScreen from './ui/world/WorldSelectScreen.svelte'

  let appState = $state(createInitialAppState())
  const identity = createProjectIdentity()
  const locale: LocaleCode = 'en'

  function handleSelectTitleMenuItem(index: number) {
    appState = selectTitleMenuItem(appState, index)
  }

  function handleControlIntent(intent: ControlIntent) {
    appState = applyControlIntent(appState, intent)
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
    {/if}
  </ResolutionFrame>
</main>
