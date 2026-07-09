<script lang="ts">
  import { onMount } from 'svelte'
  import { applySettingsControlIntent } from '../../application/input/settingsControls'
  import type { SettingsScreen } from '../../domain/app/appFlow'
  import type { LocaleCode, LocalizeData } from '../../domain/data/localize/localize'
  import {
    applyGameplayHudPatch,
    createInitialGameplayHudState,
    type GameplayHudState,
  } from '../../domain/gameplay/gameplayHud'
  import type { GameplayStageMap } from '../../domain/gameplay/gameplayMapTypes'
  import {
    activatePauseMenuItem,
    backFromPauseSettings,
    movePauseMenuSelection,
    openPauseMenu,
    resumePauseMenu,
    selectPauseMenuItem,
    type GameplayPauseState,
    type PauseAction,
  } from '../../domain/gameplay/gameplayPause'
  import {
    mapGamepadControlIntents,
    mapKeyboardControlIntent,
    type ControlIntent,
    type ControlContext,
    type GamepadControlSnapshot,
  } from '../../domain/input/controlIntents'
  import type { GameSettings } from '../../domain/settings/settings'
import {
  resolveStageResultActionIntent,
  type StageResultActionType,
  type StageResultControlIntent,
} from '../../domain/gameplay/stageResult'
import type { StageClearResult } from '../../domain/progression/stageProgression'
import GameplayHud from './GameplayHud.svelte'
import PauseMenu from './PauseMenu.svelte'
import StageResult from './StageResult.svelte'
import { createGameplayRenderer } from './createGameplayRenderer'
import { getGameplayHudStageDisplay } from './gameplayHudDisplay'
  import SettingsPanel from '../settings/SettingsPanel.svelte'

  type Props = {
    stage: GameplayStageMap
    settings: GameSettings
    localizeData: LocalizeData
    locale: LocaleCode
    localeCodes: readonly LocaleCode[]
    onRetry: () => void
    onStageSelect: () => void
    onSettingsChange: (settings: GameSettings, fullscreenChanged: boolean) => void
    onConfirmSettingsDelete: () => void
    onStageClear: (result: StageClearResult) => void
  }

  let {
    stage,
    settings,
    localizeData,
    locale,
    localeCodes,
    onRetry,
    onStageSelect,
    onSettingsChange,
    onConfirmSettingsDelete,
    onStageClear,
  }: Props = $props()

  let container: HTMLDivElement
  let hudState = $state<GameplayHudState | null>(null)
  let pauseState = $state<GameplayPauseState>({ mode: 'playing' })
  let renderer: ReturnType<typeof createGameplayRenderer> | null = null
  let pauseSettingsScreen = $state<SettingsScreen>({
    type: 'settings',
    selectedItemIndex: 0,
    deleteConfirm: null,
  })

  let stageClearRecorded = $state(false)
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

  $effect(() => {
    if (!hudState?.result || stageClearRecorded) return

    stageClearRecorded = true
    onStageClear({
      time: hudState.result.time,
      rank: hudState.result.rank,
      coins: hudState.result.coins,
    })
  })

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

  function pauseGameplay(): void {
    if (hudState?.result || pauseState.mode !== 'playing' || !renderer) return
    pauseState = openPauseMenu(pauseState)
    renderer.pause()
  }

  function resumeGameplay(): void {
    if (!renderer) return
    pauseState = resumePauseMenu(pauseState)
    renderer.resume()
    renderer.resetTiming()
  }

  function handlePauseAction(action: PauseAction): void {
    if (action === 'resume') {
      resumeGameplay()
      return
    }

    if (action === 'restart-stage') {
      pauseState = { mode: 'playing' }
      onRetry()
      return
    }

    if (action === 'open-settings') {
      pauseState = { mode: 'settings', selectedItemIndex: 2 }
      pauseSettingsScreen = {
        type: 'settings',
        selectedItemIndex: 0,
        deleteConfirm: null,
      }
      return
    }

    if (action === 'stage-select') {
      pauseState = { mode: 'playing' }
      onStageSelect()
    }
  }

  function activateSelectedPauseItem(): void {
    const activation = activatePauseMenuItem(pauseState)
    pauseState = activation.state
    if (activation.action) handlePauseAction(activation.action)
  }

  function handlePauseSettingsControlIntent(intent: ControlIntent): void {
    const result = applySettingsControlIntent(
      { screen: pauseSettingsScreen, settings },
      intent,
      localeCodes,
    )

    pauseSettingsScreen = result.screen
    if (result.settings !== settings) onSettingsChange(result.settings, result.fullscreenChanged)
    if (result.deleteConfirmed) onConfirmSettingsDelete()
    if (result.exitRequested) pauseState = backFromPauseSettings(pauseState)
  }

  function pauseSettingsControlContext(): ControlContext {
    return pauseSettingsScreen.deleteConfirm ? 'settings-delete-confirm' : 'settings'
  }

  function handlePauseControlIntent(intent: ControlIntent): void {
    if (pauseState.mode === 'playing') {
      if (intent === 'back') pauseGameplay()
      return
    }

    if (pauseState.mode !== 'paused') return

    if (intent === 'move-up') {
      pauseState = movePauseMenuSelection(pauseState, -1)
      return
    }
    if (intent === 'move-down') {
      pauseState = movePauseMenuSelection(pauseState, 1)
      return
    }
    if (intent === 'back') {
      resumeGameplay()
      return
    }
    if (intent === 'confirm') activateSelectedPauseItem()
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (hudState?.result) {
      const intent = mapKeyboardControlIntent(
        { key: event.key, repeat: event.repeat },
        'stage-select',
      )

      if (!intent || !isStageResultControlIntent(intent)) return

      event.preventDefault()
      handleResultControlIntent(intent)
      return
    }

    if (pauseState.mode === 'settings') {
      const intent = mapKeyboardControlIntent(
        { key: event.key, repeat: event.repeat },
        pauseSettingsControlContext(),
      )
      if (!intent) return
      event.preventDefault()
      handlePauseSettingsControlIntent(intent)
      return
    }

    const context = pauseState.mode === 'paused' ? 'gameplay-pause-menu' : 'gameplay-active'
    const intent = mapKeyboardControlIntent(
      { key: event.key, repeat: event.repeat },
      context,
    )
    if (!intent) return

    event.preventDefault()
    handlePauseControlIntent(intent)
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
    renderer = createGameplayRenderer({
      parent: container,
      stage,
      onHudUpdate: (patch) => {
        hudState = applyGameplayHudPatch(hudState ?? createInitialGameplayHudState(stage), patch)
      },
    })

    function pollGamepad() {
      const currentSnapshot = readGamepadSnapshot()
      const context = hudState?.result
        ? 'stage-select'
        : pauseState.mode === 'paused'
          ? 'gameplay-pause-menu'
          : pauseState.mode === 'settings'
            ? pauseSettingsControlContext()
            : 'gameplay-active'
      const intents = mapGamepadControlIntents(
        previousGamepadSnapshot,
        currentSnapshot,
        context,
      )

      for (const intent of intents) {
        if (hudState?.result) {
          handleResultControlIntent(intent)
        } else if (pauseState.mode === 'settings') {
          handlePauseSettingsControlIntent(intent)
        } else {
          handlePauseControlIntent(intent)
        }
      }

      previousGamepadSnapshot = currentSnapshot
      frameId = requestAnimationFrame(pollGamepad)
    }

    frameId = requestAnimationFrame(pollGamepad)

    return () => {
      cancelAnimationFrame(frameId)
      if (renderer) renderer.destroy()
      renderer = null
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
      locale={locale}
    />
    {#if pauseState.mode === 'paused' && !hudState?.result}
      <PauseMenu
        selectedItemIndex={pauseState.selectedItemIndex}
        {localizeData}
        {locale}
        onSelectItem={(index) => {
          pauseState = selectPauseMenuItem(pauseState, index)
        }}
        onAction={handlePauseAction}
      />
    {:else if pauseState.mode === 'settings' && !hudState?.result}
      <div class="pause-overlay settings-pause-overlay">
        <SettingsPanel
          screen={pauseSettingsScreen}
          {settings}
          {localizeData}
          {locale}
          onSelectItem={(index) => {
            pauseSettingsScreen = { ...pauseSettingsScreen, selectedItemIndex: index }
          }}
          onAdjustItem={(index, direction) => {
            pauseSettingsScreen = { ...pauseSettingsScreen, selectedItemIndex: index }
            handlePauseSettingsControlIntent(direction === -1 ? 'move-left' : 'move-right')
          }}
          onActivateItem={(index) => {
            pauseSettingsScreen = { ...pauseSettingsScreen, selectedItemIndex: index }
            handlePauseSettingsControlIntent('confirm')
          }}
          onCancelDelete={() => {
            pauseSettingsScreen = { ...pauseSettingsScreen, deleteConfirm: null }
          }}
          onConfirmDelete={() => {
            pauseSettingsScreen = { ...pauseSettingsScreen, deleteConfirm: null }
            onConfirmSettingsDelete()
          }}
          onBackLabel="pause.resume"
        />
      </div>
    {/if}
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

  .settings-pause-overlay {
    position: absolute;
    inset: 0;
    z-index: 22;
    display: grid;
    place-items: center;
    container-type: size;
    background:
      linear-gradient(90deg, rgba(7, 22, 48, 0.2), rgba(7, 22, 48, 0.62), rgba(7, 22, 48, 0.2)),
      rgba(12, 42, 82, 0.2);
    pointer-events: auto;
    backdrop-filter: blur(4px) saturate(78%);
    animation: pause-backdrop-in 220ms ease-out both;
  }

  @keyframes pause-backdrop-in {
    from {
      opacity: 0;
      backdrop-filter: blur(0) saturate(100%);
    }
    to {
      opacity: 1;
      backdrop-filter: blur(4px) saturate(78%);
    }
  }
</style>
