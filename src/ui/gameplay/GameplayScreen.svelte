<script lang="ts">
  import { onMount } from 'svelte'
  import {
    applyGameplayHudPatch,
    createInitialGameplayHudState,
    type GameplayHudState,
  } from '../../domain/gameplay/gameplayHud'
  import type { GameplayStageMap } from '../../domain/gameplay/gameplayMapTypes'
  import {
    mapGamepadControlIntents,
    mapKeyboardControlIntent,
    type ControlIntent,
    type GamepadControlSnapshot,
  } from '../../domain/input/controlIntents'
  import {
    resolveStageResultActionIntent,
    type StageResultActionType,
    type StageResultControlIntent,
  } from '../../domain/gameplay/stageResult'
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
  let previousGamepadSnapshot: GamepadControlSnapshot | null = null
  const stageDisplay = $derived(getGameplayHudStageDisplay(stage.id))
  const nextStageAvailable = false

  $effect(() => {
    hudState = createInitialGameplayHudState(stage)
  })

  function handleResultAction(action: StageResultActionType): void {
    if (action === 'retry') {
      onRetry()
      return
    }

    if (action === 'stage-select') {
      onStageSelect()
    }
  }

  function isStageResultControlIntent(intent: ControlIntent): intent is StageResultControlIntent {
    return (
      intent === 'move-up' ||
      intent === 'move-down' ||
      intent === 'move-left' ||
      intent === 'move-right' ||
      intent === 'confirm'
    )
  }

  function handleResultControlIntent(intent: ControlIntent): void {
    if (!hudState?.result || !isStageResultControlIntent(intent)) return

    const resolution = resolveStageResultActionIntent(
      {
        selectedAction: selectedResultAction,
        nextStageAvailable,
      },
      intent,
    )

    selectedResultAction = resolution.selectedAction

    if (resolution.action) {
      handleResultAction(resolution.action)
    }
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (!hudState?.result) return

    const intent = mapKeyboardControlIntent(
      { key: event.key, repeat: event.repeat },
      'stage-select',
    )

    if (!intent || !isStageResultControlIntent(intent)) return

    event.preventDefault()
    handleResultControlIntent(intent)
  }

  function readGamepadSnapshot(): GamepadControlSnapshot | null {
    const gamepads = navigator.getGamepads?.()
    const gamepad = Array.from(gamepads ?? []).find((candidate): candidate is Gamepad => Boolean(candidate))
    if (!gamepad) return null

    return {
      mapping: gamepad.mapping,
      buttons: gamepad.buttons.map((button) => button.pressed),
      axes: [...gamepad.axes],
    }
  }

  onMount(() => {
    let frameId = 0
    const game = createGameplayRenderer({
      parent: container,
      stage,
      onHudUpdate: (patch) => {
        hudState = applyGameplayHudPatch(hudState ?? createInitialGameplayHudState(stage), patch)
      },
    })

    function pollGamepad() {
      const currentSnapshot = readGamepadSnapshot()
      const intents = mapGamepadControlIntents(
        previousGamepadSnapshot,
        currentSnapshot,
        'stage-select',
      )

      for (const intent of intents) {
        handleResultControlIntent(intent)
      }

      previousGamepadSnapshot = currentSnapshot
      frameId = requestAnimationFrame(pollGamepad)
    }

    frameId = requestAnimationFrame(pollGamepad)

    return () => {
      cancelAnimationFrame(frameId)
      game.destroy()
    }
  })
</script>

<svelte:window onkeydown={handleKeydown} />

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
        {nextStageAvailable}
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
