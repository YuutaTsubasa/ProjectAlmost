<script lang="ts">
  import { createProjectIdentity } from './domain/app/projectIdentity'

  const identity = createProjectIdentity()
</script>

<main class="shell" aria-labelledby="app-title">
  <section class="panel">
    <p class="eyebrow">{identity.shell}</p>
    <h1 id="app-title">{identity.productName}</h1>
    <p class="summary">
      Empty rebuild shell: Svelte UI, Tauri v2 desktop wrapper, and a pure domain
      core ready for test-driven slices.
    </p>
  </section>
</main>
