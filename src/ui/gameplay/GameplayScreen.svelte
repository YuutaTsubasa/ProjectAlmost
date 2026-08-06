<script lang="ts">
  import { onMount } from 'svelte'
  import type { CharacterInfoViewModel } from '../../application/character/characterInfoPresenter'
  import { applySettingsControlIntent } from '../../application/input/settingsControls'
  import type { SettingsScreen } from '../../domain/app/appFlow'
  import {
    advanceAvgPlayback,
    createAvgPlayback,
    isAvgPlaybackActive,
    skipAvgPlayback,
  } from '../../domain/avg/avgPlayback'
  import { getStageIntroSequence } from '../../domain/avg/avgRegistry'
  import type { AvgPlaybackState } from '../../domain/avg/avgTypes'
  import {
    resolveLocalizedText,
    type LocaleCode,
    type LocalizationKey,
    type LocalizeData,
  } from '../../domain/data/localize/localize'
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
  import {
    clearVirtualControlsState,
    emptyGameplayInputSnapshot,
    getVirtualControlsVisibilityDecision,
    mapGamepadGameplayInputSnapshot,
    mergeGameplayInputSnapshots,
    type GameplayInputSnapshot,
    type GameplayInputSource,
    type VirtualControlsState,
  } from '../../domain/input/gameplayInput'
  import type { GameSettings } from '../../domain/settings/settings'
  import type { GameplaySfxAction } from '../../domain/audio/audioPolicy'
  import {
    resolveStageResultActionIntent,
    type StageResultActionType,
    type StageResultControlIntent,
  } from '../../domain/gameplay/stageResult'
  import type { StageClearResult } from '../../domain/progression/stageProgression'
  import GameplayHud from './GameplayHud.svelte'
  import PauseMenu from './PauseMenu.svelte'
  import StageResult from './StageResult.svelte'
  import VirtualControls from './VirtualControls.svelte'
  import { createGameplayRenderer } from './createGameplayRenderer'
  import { getGameplayHudStageDisplay } from './gameplayHudDisplay'
  import type { GameplayMusicState } from './gameplayMusicState'
  import AvgOverlay from '../avg/AvgOverlay.svelte'
  import SettingsPanel from '../settings/SettingsPanel.svelte'

  type Props = {
    stage: GameplayStageMap
    settings: GameSettings
    characterInfo: CharacterInfoViewModel
    localizeData: LocalizeData
    locale: LocaleCode
    localeCodes: readonly LocaleCode[]
    nextStageAvailable: boolean
    onRetry: () => void
    onStageSelect: () => void
    onNextStage: () => void
    onSettingsChange: (settings: GameSettings, fullscreenChanged: boolean) => void
    onConfirmSettingsDelete: () => void
    onStageClear: (result: StageClearResult) => void
    onGameplaySfx: (action: GameplaySfxAction) => void
    onGameplayMusicStateChange: (state: GameplayMusicState) => void
  }

  let {
    stage,
    settings,
    characterInfo,
    localizeData,
    locale,
    localeCodes,
    nextStageAvailable,
    onRetry,
    onStageSelect,
    onNextStage,
    onSettingsChange,
    onConfirmSettingsDelete,
    onStageClear,
    onGameplaySfx,
    onGameplayMusicStateChange,
  }: Props = $props()

  let container: HTMLDivElement
  // App wraps this component in {#key getGameplayScreenKey(...)}, so it is
  // recreated whenever `stage` changes; capturing the initial value is intended.
  // svelte-ignore state_referenced_locally
  let hudState = $state<GameplayHudState | null>(createInitialGameplayHudState(stage))
  let pauseState = $state<GameplayPauseState>({ mode: 'playing' })
  let renderer: ReturnType<typeof createGameplayRenderer> | null = null
  // svelte-ignore state_referenced_locally
  const stageIntroSequence = getStageIntroSequence(stage.id)
  let avgPlayback = $state<AvgPlaybackState | null>(
    stageIntroSequence ? createAvgPlayback(stageIntroSequence) : null,
  )
  let rendererPausedForAvg = false
  let pauseSettingsScreen = $state<SettingsScreen>({
    type: 'settings',
    selectedItemIndex: 0,
    deleteConfirm: null,
  })

  let stageClearRecorded = $state(false)
  let selectedResultAction = $state(0)
  let previousGamepadSnapshot: GamepadControlSnapshot | null = null
  let gamepadGameplayInput = $state<GameplayInputSnapshot>({ ...emptyGameplayInputSnapshot })
  let virtualControlsState = $state<VirtualControlsState>({
    visible: false,
    moveX: 0,
    crouchHeld: false,
  })
  let virtualJumpPressed = false
  let virtualAttackPressed = false
  const stageDisplay = $derived(getGameplayHudStageDisplay(stage.id))

  $effect(() => {
    onGameplayMusicStateChange({
      resultVisible: Boolean(hudState?.result),
      paused: pauseState.mode !== 'playing',
    })
  })

  $effect(() => {
    if (!renderer) return

    if (isAvgPlaybackActive(avgPlayback)) {
      if (!rendererPausedForAvg) {
        renderer.pause()
        rendererPausedForAvg = true
      }
      return
    }

    if (rendererPausedForAvg) {
      renderer.requireGameplayInputRelease()
      renderer.resume()
      renderer.resetTiming()
      rendererPausedForAvg = false
    }
  })

  function handleResultAction(action: StageResultActionType): void {
    if (action === 'retry') {
      onRetry()
      return
    }

    if (action === 'stage-select') {
      onStageSelect()
      return
    }

    if (action === 'next-stage') {
      onNextStage()
    }
  }

  function text(key: LocalizationKey): string {
    return resolveLocalizedText(localizeData, locale, key)
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
    virtualControlsState = clearVirtualControlsState(virtualControlsState)
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

  function isGameplayPlayable(): boolean {
    return pauseState.mode === 'playing' && !hudState?.result && !isAvgPlaybackActive(avgPlayback)
  }

  function finishAvgPlayback(nextPlayback: AvgPlaybackState): void {
    avgPlayback = nextPlayback
  }

  function advanceAvg(): void {
    if (!avgPlayback) return
    finishAvgPlayback(advanceAvgPlayback(avgPlayback))
  }

  function skipAvg(): void {
    if (!avgPlayback) return
    finishAvgPlayback(skipAvgPlayback(avgPlayback))
  }

  function handleAvgControlIntent(intent: ControlIntent): boolean {
    if (!isAvgPlaybackActive(avgPlayback)) return false
    if (intent === 'confirm') {
      advanceAvg()
      return true
    }
    if (intent === 'back') {
      skipAvg()
      return true
    }
    return true
  }

  function applyVirtualControlsVisibility(source: GameplayInputSource): void {
    const decision = getVirtualControlsVisibilityDecision({
      visible: virtualControlsState.visible,
      source,
      playable: isGameplayPlayable(),
    })

    virtualControlsState = decision.resetVirtualState
      ? clearVirtualControlsState(virtualControlsState)
      : { ...virtualControlsState, visible: decision.visible }
  }

  function getVirtualGameplayInputSnapshot(): GameplayInputSnapshot {
    return {
      ...emptyGameplayInputSnapshot,
      leftHeld: virtualControlsState.moveX < 0,
      rightHeld: virtualControlsState.moveX > 0,
      crouchHeld: virtualControlsState.crouchHeld,
      jumpPressed: virtualJumpPressed,
      attackPressed: virtualAttackPressed,
    }
  }

  function getGameplayInputSnapshot(): GameplayInputSnapshot {
    const snapshot = mergeGameplayInputSnapshots([
      getVirtualGameplayInputSnapshot(),
      gamepadGameplayInput,
    ])

    virtualJumpPressed = false
    virtualAttackPressed = false

    return snapshot
  }

  function hasActiveGamepadGameplayInput(input: GameplayInputSnapshot): boolean {
    return (
      input.leftHeld ||
      input.rightHeld ||
      input.crouchHeld ||
      input.jumpPressed ||
      input.jumpHeld ||
      input.attackPressed ||
      input.attackHeld
    )
  }

  function isKeyboardGameplayInput(event: KeyboardEvent): boolean {
    return [
      'ArrowLeft',
      'ArrowRight',
      'ArrowDown',
      'ArrowUp',
      'a',
      'A',
      'd',
      'D',
      's',
      'S',
      'w',
      'W',
      ' ',
      'Spacebar',
      'j',
      'J',
      'z',
      'Z',
    ].includes(event.key)
  }

  function handleVirtualMove(moveX: -1 | 0 | 1, crouchHeld: boolean): void {
    virtualControlsState = {
      ...virtualControlsState,
      visible: true,
      moveX,
      crouchHeld,
    }
  }

  function handleVirtualJump(): void {
    virtualJumpPressed = true
  }

  function handleVirtualAttack(): void {
    virtualAttackPressed = true
  }

  function handleGameplayPointerInteraction(): void {
    applyVirtualControlsVisibility('virtual-pointer')
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
    if (isAvgPlaybackActive(avgPlayback)) {
      const intent = mapKeyboardControlIntent(
        { key: event.key, repeat: event.repeat },
        'stage-select',
      )
      event.preventDefault()
      if (intent) handleAvgControlIntent(intent)
      return
    }

    if (isGameplayPlayable() && isKeyboardGameplayInput(event)) {
      applyVirtualControlsVisibility('keyboard')
    }

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
    const pauseIntent = mapKeyboardControlIntent(
      { key: event.key, repeat: event.repeat },
      context,
    )
    if (!pauseIntent) return

    event.preventDefault()
    handlePauseControlIntent(pauseIntent)
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
      onSfx: onGameplaySfx,
      getInputSnapshot: getGameplayInputSnapshot,
    })

    if (isAvgPlaybackActive(avgPlayback)) {
      renderer.pause()
      rendererPausedForAvg = true
    }

    function pollGamepad() {
      const currentSnapshot = readGamepadSnapshot()
      gamepadGameplayInput = mapGamepadGameplayInputSnapshot(previousGamepadSnapshot, currentSnapshot)
      if (isGameplayPlayable() && hasActiveGamepadGameplayInput(gamepadGameplayInput)) {
        applyVirtualControlsVisibility('gamepad')
      }

      const context = isAvgPlaybackActive(avgPlayback)
        ? 'stage-select'
        : hudState?.result
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
        if (handleAvgControlIntent(intent)) {
          continue
        }
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

<section
  class="gameplay-screen"
  aria-label={`Gameplay ${stage.id}`}
  onpointerdown={handleGameplayPointerInteraction}
>
  <div bind:this={container} class="gameplay-canvas"></div>
  {#if hudState}
    <GameplayHud
      state={hudState}
      stageLabel={stage.id}
      stageDisplay={stageDisplay}
      {characterInfo}
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
        {characterInfo}
        selectedAction={selectedResultAction}
        nextStageAvailable={nextStageAvailable}
        onSelectAction={(index) => (selectedResultAction = index)}
        onAction={handleResultAction}
      />
    {/if}
    {#if stageIntroSequence && avgPlayback && isAvgPlaybackActive(avgPlayback)}
      <AvgOverlay
        sequence={stageIntroSequence}
        playback={avgPlayback}
        {localizeData}
        {locale}
        onAdvance={advanceAvg}
        onSkip={skipAvg}
      />
    {/if}
    {#if virtualControlsState.visible && isGameplayPlayable() && !isAvgPlaybackActive(avgPlayback)}
      <VirtualControls
        {localizeData}
        {locale}
        onMove={handleVirtualMove}
        onJump={handleVirtualJump}
        onAttack={handleVirtualAttack}
        onInteraction={() => applyVirtualControlsVisibility('virtual-pointer')}
      />
      <button
        class="virtual-hud-pause"
        type="button"
        aria-label={text('touch.pause')}
        onpointerdown={(event) => {
          event.preventDefault()
          applyVirtualControlsVisibility('virtual-pointer')
          pauseGameplay()
        }}
      >
        <span>Ⅱ</span>
        <b>{text('touch.pause')}</b>
      </button>
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

  .virtual-hud-pause {
    position: absolute;
    right: 2.25cqw;
    bottom: 4.35cqh;
    z-index: 54;
    display: flex;
    gap: 0.55cqw;
    align-items: center;
    min-width: 8.8cqw;
    min-height: 5.2cqh;
    justify-content: center;
    border: 1.5px solid color-mix(in srgb, #2f6fd0 55%, transparent);
    border-radius: 6px;
    background: linear-gradient(
      180deg,
      color-mix(in srgb, #ffffff 92%, #2f6fd0),
      color-mix(in srgb, #ffffff 76%, #2f6fd0)
    );
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.85) inset,
      0 0 0 1px rgba(255, 255, 255, 0.42),
      0 10px 24px -14px rgba(20, 49, 95, 0.72);
    color: color-mix(in oklab, #2f6fd0 64%, #08152e);
    font-family: Rajdhani, Verdana, Geneva, sans-serif;
    pointer-events: auto;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }

  .virtual-hud-pause span {
    display: grid;
    width: 2.15cqw;
    aspect-ratio: 1;
    place-items: center;
    border-radius: 50%;
    background: linear-gradient(180deg, #fff, color-mix(in srgb, #2f6fd0 16%, #ffffff));
    font-size: 1.05cqw;
    font-weight: 900;
    line-height: 1;
  }

  .virtual-hud-pause b {
    font-size: 0.72cqw;
    font-weight: 800;
    letter-spacing: 0.14em;
    line-height: 1;
    text-transform: uppercase;
  }

  .virtual-hud-pause:active {
    filter: brightness(1.08);
    scale: 0.98;
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
