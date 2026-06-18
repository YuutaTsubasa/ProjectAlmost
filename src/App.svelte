<script lang="ts">
  import { createInitialAppState } from './domain/app/appFlow'
  import { createProjectIdentity } from './domain/app/projectIdentity'
  import TitleScreen from './ui/title/TitleScreen.svelte'

  const appState = createInitialAppState()
  const identity = createProjectIdentity()
</script>

<main class="shell">
  {#if appState.screen.type === 'title'}
    <TitleScreen
      productName={identity.productName}
      subtitle="A new rebuild begins"
      buildLabel="Tauri v2 + Svelte"
    />
  {/if}
</main>
