<script lang="ts">
  import { onMount } from 'svelte'
  import {
    resolveLocalizedText,
    type LocaleCode,
    type LocalizationKey,
    type LocalizeData,
  } from '../../domain/data/localize/localize'
  import type { StageCatalog, StageData } from '../../domain/data/stages/stageTypes'
  import type { StageId, WorldCatalog, WorldData } from '../../domain/data/worlds/worldTypes'
  import type { StageProgressionOptionState } from '../../domain/progression/stageProgression'
  import type { CharacterInfoViewModel } from '../../application/character/characterInfoPresenter'
  import {
    mapGamepadControlIntents,
    mapKeyboardControlIntent,
    type ControlIntent,
    type GamepadControlSnapshot,
  } from '../../domain/input/controlIntents'
  import ControlHints from '../controls/ControlHints.svelte'

  type Props = {
    worlds: WorldCatalog
    stages: StageCatalog
    localizeData: LocalizeData
    locale?: LocaleCode
    selectedWorldIndex: number
    selectedStageIndex: number
    characterInfo: CharacterInfoViewModel
    stageProgressionOptions?: readonly StageProgressionOptionState<StageId>[]
    onControlIntent: (intent: ControlIntent) => void
    onSelectStage: (index: number) => void
    onConfirmStage: () => void
    onBack: () => void
  }

  let {
    worlds,
    stages,
    localizeData,
    locale = 'en',
    selectedWorldIndex,
    selectedStageIndex,
    characterInfo,
    stageProgressionOptions: receivedStageProgressionOptions = [],
    onControlIntent,
    onSelectStage,
    onConfirmStage,
    onBack,
  }: Props = $props()

  let previousGamepadSnapshot: GamepadControlSnapshot | null = null
  let confirming = $state(false)
  let confirmResetTimer: ReturnType<typeof window.setTimeout> | undefined

  const orderedWorlds = $derived(worlds.order.map((worldId) => worlds.items[worldId]))
  const stageSelectRefs = $derived(localizeData.references.stageSelect)
  const selectedWorld = $derived((orderedWorlds[selectedWorldIndex] ?? orderedWorlds[0]) as WorldData)
  const stageOptions = $derived(selectedWorld.stageIds.map((stageId) => stages.items[stageId]))
  const selectedStage = $derived((stageOptions[selectedStageIndex] ?? stageOptions[0]) as StageData)
  const progressionByStageId = $derived(
    new Map(receivedStageProgressionOptions.map((option) => [option.stageId, option])),
  )
  const selectedStageProgression = $derived(stageProgression(selectedStage.id))

  function text(key: LocalizationKey): string {
    return resolveLocalizedText(localizeData, locale, key)
  }

  function worldTitle(world: WorldData): string {
    return text(world.titleRef)
  }

  function stageSubtitle(stage: StageData): string {
    return text(stage.subtitleRef)
  }

  function stageObjective(stage: StageData): string {
    return text(stage.objectiveRef)
  }

  function stagePreviewBackground(stage: StageData): string {
    return stage.previewBackgroundAssetRef ?? stage.previewAssetRef
  }

  function stageProgression(stageId: StageId): StageProgressionOptionState<StageId> {
    return progressionByStageId.get(stageId) ?? {
      stageId,
      unlocked: false,
      cleared: false,
      record: undefined,
    }
  }

  function handleConfirmStage(stageProgressionState: StageProgressionOptionState<StageId>) {
    if (!stageProgressionState.unlocked) return
    confirming = true
    onConfirmStage()
    if (confirmResetTimer) window.clearTimeout(confirmResetTimer)
    confirmResetTimer = window.setTimeout(() => {
      confirming = false
      confirmResetTimer = undefined
    }, 220)
  }

  function handleKeydown(event: KeyboardEvent) {
    const intent = mapKeyboardControlIntent(
      { key: event.key, repeat: event.repeat },
      'stage-select',
    )

    if (intent) {
      event.preventDefault()
      onControlIntent(intent)
    }
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

    function pollGamepad() {
      const currentSnapshot = readGamepadSnapshot()
      const intents = mapGamepadControlIntents(previousGamepadSnapshot, currentSnapshot, 'stage-select')

      for (const intent of intents) {
        onControlIntent(intent)
      }

      previousGamepadSnapshot = currentSnapshot
      frameId = requestAnimationFrame(pollGamepad)
    }

    frameId = requestAnimationFrame(pollGamepad)

    return () => {
      cancelAnimationFrame(frameId)
      if (confirmResetTimer) window.clearTimeout(confirmResetTimer)
    }
  })
</script>

<svelte:window onkeydown={handleKeydown} />

<section
  class:confirming
  class={`stage-select theme-${selectedWorld.theme}`}
  aria-label={text(stageSelectRefs.ariaScreen)}
>
  <div
    class="stage-world"
    style={`background-image: url("${selectedWorld.assetRefs.stageSelectBackground}")`}
    aria-hidden="true"
  ></div>

  <header class="stage-banner">
    <span aria-hidden="true">✦</span>
    <strong>{text(stageSelectRefs.title)}</strong>
    <span aria-hidden="true">✦</span>
  </header>

  <button
    class="menu-back-button stage-back-button"
    type="button"
    onclick={onBack}
    aria-label={text('common.back')}
  >
    <span aria-hidden="true">‹</span>
    <b>{text('common.back')}</b>
  </button>

  <aside class="stage-detail" aria-live="polite">
    <div class="stage-preview" aria-hidden="true">
      <div class="stage-preview-scene">
        <img
          class="stage-preview-background"
          src={stagePreviewBackground(selectedStage)}
          alt=""
          draggable="false"
        />
        <img
          class="stage-preview-foreground"
          src={selectedStage.previewAssetRef}
          alt=""
          draggable="false"
        />
        {#if !selectedStageProgression.unlocked}
          <div class="stage-preview-lock">{text('common.locked')}</div>
        {/if}
      </div>
    </div>
    <strong class="stage-title">{worldTitle(selectedWorld)} {selectedStage.id}</strong>
    <span class="stage-subtitle">{stageSubtitle(selectedStage)}</span>

    <div class="stage-rule"></div>

    <span class="stage-label">{text(stageSelectRefs.objective)}</span>
    <p class="stage-objective">
      {selectedStageProgression.unlocked ? stageObjective(selectedStage) : text('common.locked')}
    </p>

    <span class="stage-label">{text(stageSelectRefs.collectibles)}</span>
    <div class="stage-collectible">
      <span class="coin-mark" aria-hidden="true">I</span>
      <b>{selectedStageProgression.record?.maxCoins ?? 0} <small>/ {selectedStage.collectibleCount}</small></b>
    </div>

    <div class="stage-stats">
      <div>
        <span class="stage-label">{text(stageSelectRefs.bestTime)}</span>
        <b>{selectedStageProgression.record?.bestTime ?? text(stageSelectRefs.recordUnavailable)}</b>
      </div>
      <div>
        <span class="stage-label">{text(stageSelectRefs.rank)}</span>
        <b>{selectedStageProgression.record?.bestRank ?? text(stageSelectRefs.recordUnavailable)}</b>
      </div>
    </div>

    <div class="stage-roster">
      <img
        class="stage-roster-portrait"
        src={characterInfo.stageSelect.portraitAssetRef}
        alt={characterInfo.stageSelect.portraitAlt}
        draggable="false"
      />
      <div>
        <span>{text(stageSelectRefs.activeCharacter)}</span>
        <strong>{characterInfo.stageSelect.name}</strong>
      </div>
    </div>

    <button
      class="stage-deploy"
      type="button"
      disabled={!selectedStageProgression.unlocked || confirming}
      onclick={() => handleConfirmStage(selectedStageProgression)}
    >
      <span>{selectedStageProgression.unlocked ? text(stageSelectRefs.deploy) : text('common.locked')}</span>
      <b aria-hidden="true">›</b>
    </button>
  </aside>

  <div class="stage-map" aria-label={text(stageSelectRefs.ariaMap)}>
    <svg class="stage-paths" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {#each stageOptions.slice(0, -1) as stage, index}
        <line
          style={`--path-index:${index}`}
          pathLength="1"
          x1={stage.nodePosition.x}
          y1={stage.nodePosition.y}
          x2={stageOptions[index + 1].nodePosition.x}
          y2={stageOptions[index + 1].nodePosition.y}
        ></line>
      {/each}
    </svg>

    {#each stageOptions as stage, index}
      <button
        class:active={index === selectedStageIndex}
        class:boss={stage.isBoss}
        class:locked={!stageProgression(stage.id).unlocked}
        class:cleared={stageProgression(stage.id).cleared}
        class="stage-node"
        style={`left:${stage.nodePosition.x}%;top:${stage.nodePosition.y}%;--node-index:${index}`}
        type="button"
        aria-label={`${stage.id}, ${stageSubtitle(stage)}`}
        onclick={() => onSelectStage(index)}
        ondblclick={() => {
          onSelectStage(index)
          handleConfirmStage(stageProgression(stage.id))
        }}
        >
        <i aria-hidden="true"></i>
        <b>{stageProgression(stage.id).unlocked ? stage.id : '◆'}</b>
        <span><strong>{stage.id}</strong>{stageSubtitle(stage)}</span>
      </button>
    {/each}
  </div>

  <ControlHints
    className="stage-controls"
    hints={[
      { keys: ['←', '→', '↑', '↓'], label: text('common.select') },
      { keys: ['Space'], label: text('common.confirm') },
      { keys: ['Esc'], label: text('common.back') },
    ]}
  />
</section>
