<script lang="ts">
  import { applyTitleControlIntent, selectTitleMenuItemFromPointer } from './application/input/titleControls'
  import { createInitialAppState } from './domain/app/appFlow'
  import { createProjectIdentity } from './domain/app/projectIdentity'
  import type { ControlIntent } from './domain/input/controlIntents'
  import ResolutionFrame from './ui/layout/ResolutionFrame.svelte'
  import TitleScreen from './ui/title/TitleScreen.svelte'

  let appState = $state(createInitialAppState())
  const identity = createProjectIdentity()

  function handleControlIntent(intent: ControlIntent) {
    appState = applyTitleControlIntent(appState, intent)
  }

  function handlePointerMenuSelection(selectedItemIndex: number) {
    appState = selectTitleMenuItemFromPointer(appState, selectedItemIndex)
  }
</script>

<main class="shell">
  <ResolutionFrame>
    {#if appState.screen.type === 'title-intro' || appState.screen.type === 'title-menu'}
      <TitleScreen
        screen={appState.screen}
        productName={identity.productName}
        onControlIntent={handleControlIntent}
        onPointerMenuSelection={handlePointerMenuSelection}
      />
    {/if}
  </ResolutionFrame>
</main>
