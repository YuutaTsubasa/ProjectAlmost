<script lang="ts">
  import { onMount } from 'svelte'
  import type { GameplayStageMap } from '../../domain/gameplay/gameplayMapTypes'
  import { createGameplayRenderer } from './createGameplayRenderer'

  type Props = {
    stage: GameplayStageMap
  }

  let { stage }: Props = $props()

  let container: HTMLDivElement

  onMount(() => {
    const game = createGameplayRenderer({ parent: container, stage })

    return () => {
      game.destroy(true)
    }
  })
</script>

<section class="gameplay-screen" aria-label={`Gameplay ${stage.id}`}>
  <div bind:this={container} class="gameplay-canvas"></div>
</section>

<style>
  .gameplay-screen {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #05070d;
  }

  .gameplay-canvas {
    width: 100%;
    height: 100%;
  }

  .gameplay-canvas :global(canvas) {
    display: block;
  }
</style>
