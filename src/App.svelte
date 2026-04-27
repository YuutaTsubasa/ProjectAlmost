<script lang="ts">
  import { onMount } from 'svelte'
  import { createPlatformerGame } from './game/createGame'

  let gameHost: HTMLDivElement

  onMount(() => {
    const game = createPlatformerGame(gameHost)

    return () => {
      game.destroy(true)
    }
  })
</script>

<main class="shell">
  <section class="hero-panel">
    <div>
      <p class="eyebrow">Web prototype first</p>
      <h1>ProjectRun</h1>
      <p class="lede">
        A side-scrolling action platformer prototype. The current slice validates movement,
        jumping, camera follow, enemy collision, and a short melee attack before generated
        sprite sheets enter the pipeline.
      </p>
    </div>

    <div class="status-card">
      <span>Current milestone</span>
      <strong>Playable rectangle prototype</strong>
      <small>Tauri and mobile wrappers come after this loop is stable.</small>
    </div>
  </section>

  <section class="game-panel" aria-label="ProjectRun playable prototype">
    <div class="game-frame">
      <div bind:this={gameHost} class="game-host"></div>
    </div>
    <div class="notes">
      <p><strong>Controls:</strong> A/D or arrows to move, W/Space to jump, J/Z to attack.</p>
      <p><strong>Next asset step:</strong> generate `player_idle`, `player_run`, `player_attack`, and `enemy_slime` sheets.</p>
    </div>
  </section>
</main>
