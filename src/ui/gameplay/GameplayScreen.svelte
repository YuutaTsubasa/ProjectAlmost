<script lang="ts">
  import { onMount } from 'svelte'
  import {
    applyGameplayHudPatch,
    createInitialGameplayHudState,
    type GameplayHudState,
  } from '../../domain/gameplay/gameplayHud'
  import { applyGameplayResultAction } from '../../domain/app/appFlow'
  import type { GameplayStageMap } from '../../domain/gameplay/gameplayMapTypes'
  import type { StageResultActionType } from '../../domain/gameplay/stageResult'
  import GameplayHud from './GameplayHud.svelte'
  import StageResult from './StageResult.svelte'
  import { createGameplayRenderer } from './createGameplayRenderer'
  import { getGameplayHudStageDisplay } from './gameplayHudDisplay'

  type Props = {
    stage: GameplayStageMap
    onRetry: () => void
    onStageSelect: () => void
  }

  let { stage, onRetry, onStageSelect }: Props = $props()

  let container: HTMLDivElement
  let hudState = $state<GameplayHudState | null>(null)
  let selectedResultAction = $state(0)
  const stageDisplay = $derived(getGameplayHudStageDisplay(stage.id))

  $effect(() => {
    hudState = createInitialGameplayHudState(stage)
  })

  function handleResultAction(action: StageResultActionType): void {
    applyGameplayResultAction(action, { onRetry, onStageSelect })
  }

  onMount(() => {
    const game = createGameplayRenderer({
      parent: container,
      stage,
      onHudUpdate: (patch) => {
        hudState = applyGameplayHudPatch(hudState ?? createInitialGameplayHudState(stage), patch)
      },
    })

    return () => {
      game.destroy(true)
    }
  })
</script>

<section class="gameplay-screen" aria-label={`Gameplay ${stage.id}`}>
  <div bind:this={container} class="gameplay-canvas"></div>
  {#if hudState}
    <GameplayHud
      state={hudState}
      stageLabel={stage.id}
      stageDisplay={stageDisplay}
    />
    {#if hudState.result}
      <StageResult
        result={hudState.result}
        {stageDisplay}
        selectedAction={selectedResultAction}
        nextStageAvailable={false}
        onSelectAction={(index) => (selectedResultAction = index)}
        onAction={handleResultAction}
      />
    {/if}
  {/if}
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
