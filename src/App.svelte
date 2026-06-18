<script lang="ts">
  import {
    activateTitleMenuItem,
    createInitialAppState,
    moveTitleMenuSelection,
    openTitleMenu,
    selectTitleMenuItem,
  } from './domain/app/appFlow'
  import { createProjectIdentity } from './domain/app/projectIdentity'
  import TitleScreen from './ui/title/TitleScreen.svelte'

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
</script>

<main class="shell">
  {#if appState.screen.type === 'title-intro' || appState.screen.type === 'title-menu'}
    <TitleScreen
      screen={appState.screen}
      productName={identity.productName}
      onOpenMenu={handleOpenMenu}
      onMoveSelection={handleMoveTitleMenu}
      onActivateSelection={handleActivateTitleMenuItem}
      onSelectItem={handleSelectTitleMenuItem}
    />
  {/if}
</main>
