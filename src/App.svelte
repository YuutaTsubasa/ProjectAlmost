<script lang="ts">
  import {
    activateTitleMenuItem,
    backFromWorldSelect,
    confirmSelectedWorld,
    createInitialAppState,
    moveTitleMenuSelection,
    moveWorldSelection,
    openTitleMenu,
    selectTitleMenuItem,
    selectWorld,
  } from './domain/app/appFlow'
  import { createProjectIdentity } from './domain/app/projectIdentity'
  import { projectData } from './domain/data/projectData'
  import ResolutionFrame from './ui/layout/ResolutionFrame.svelte'
  import TitleScreen from './ui/title/TitleScreen.svelte'
  import WorldSelectScreen from './ui/world/WorldSelectScreen.svelte'

  let appState = $state(createInitialAppState())
  const identity = createProjectIdentity()

  function handleOpenMenu() {
    appState = openTitleMenu(appState)
  }

  function handleMoveTitleMenu(direction: -1 | 1) {
    appState = moveTitleMenuSelection(appState, direction)
  }

  function handleActivateTitleMenuItem() {
    appState = activateTitleMenuItem(appState)
  }

  function handleSelectTitleMenuItem(index: number) {
    appState = selectTitleMenuItem(appState, index)
  }

  function handleMoveWorldSelection(direction: -1 | 1) {
    appState = moveWorldSelection(appState, direction)
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
        onOpenMenu={handleOpenMenu}
        onMoveSelection={handleMoveTitleMenu}
        onActivateSelection={handleActivateTitleMenuItem}
        onSelectItem={handleSelectTitleMenuItem}
      />
    {:else if appState.screen.type === 'world-select'}
      <WorldSelectScreen
        catalog={projectData.worlds}
        localizeData={projectData.localize}
        selectedWorldIndex={appState.screen.selectedWorldIndex}
        onMoveSelection={handleMoveWorldSelection}
        onSelectWorld={handleSelectWorld}
        onConfirmWorld={handleConfirmWorld}
        onBack={handleBackFromWorldSelect}
      />
    {/if}
  </ResolutionFrame>
</main>
