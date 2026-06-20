<script lang="ts">
  import { onMount } from 'svelte'
  import {
    resolveLocalizedText,
    type LocaleCode,
    type LocalizationKey,
    type LocalizeData,
  } from '../../domain/data/localize/localize'
  import type { StageCatalog, StageData } from '../../domain/data/stages/stageTypes'
  import type { WorldCatalog, WorldData } from '../../domain/data/worlds/worldTypes'
  import {
    mapGamepadControlIntents,
    mapKeyboardControlIntent,
    type ControlIntent,
    type GamepadControlSnapshot,
  } from '../../domain/input/controlIntents'

  type Props = {
    worlds: WorldCatalog
    stages: StageCatalog
    localizeData: LocalizeData
    locale?: LocaleCode
    selectedWorldIndex: number
    selectedStageIndex: number
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
    onControlIntent,
    onSelectStage,
    onConfirmStage,
    onBack,
  }: Props = $props()

  let previousGamepadSnapshot: GamepadControlSnapshot | null = null
  let confirming = $state(false)
  let confirmResetTimer: ReturnType<typeof window.setTimeout> | undefined

  const activeCharacterName = 'Yuuta Tsubasa'

  const orderedWorlds = $derived(worlds.order.map((worldId) => worlds.items[worldId]))
  const stageSelectRefs = $derived(localizeData.references.stageSelect)
  const selectedWorld = $derived((orderedWorlds[selectedWorldIndex] ?? orderedWorlds[0]) as WorldData)
  const stageOptions = $derived(selectedWorld.stageIds.map((stageId) => stages.items[stageId]))
  const selectedStage = $derived((stageOptions[selectedStageIndex] ?? stageOptions[0]) as StageData)

  function text(key: LocalizationKey): string {
    return resolveLocalizedText(localizeData, locale, key)
  }

  function stageTitle(stage: StageData): string {
    return text(stage.titleRef)
  }

  function worldTitle(world: WorldData): string {
    return text(world.titleRef)
  }

  function worldSubtitle(world: WorldData): string {
    return text(world.subtitleRef)
  }

  function stageSubtitle(stage: StageData): string {
    return text(stage.subtitleRef)
  }

  function stageObjective(stage: StageData): string {
    return text(stage.objectiveRef)
  }

  function handleConfirmStage() {
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
    <div
      class="stage-preview"
      style={`background-image: url("${selectedStage.previewAssetRef}")`}
      aria-hidden="true"
    ></div>
    <span class="stage-world-title">{worldTitle(selectedWorld)}</span>
    <span class="stage-world-subtitle">{worldSubtitle(selectedWorld)}</span>
    <strong class="stage-title">{stageTitle(selectedStage)}</strong>
    <span class="stage-subtitle">{stageSubtitle(selectedStage)}</span>

    <div class="stage-rule"></div>

    <span class="stage-label">{text(stageSelectRefs.objective)}</span>
    <p class="stage-objective">{stageObjective(selectedStage)}</p>

    <span class="stage-label">{text(stageSelectRefs.collectibles)}</span>
    <div class="stage-collectible">
      <span class="coin-mark" aria-hidden="true">I</span>
      <b>0 <small>/ {selectedStage.collectibleCount}</small></b>
    </div>

    <div class="stage-stats">
      <div>
        <span class="stage-label">{text(stageSelectRefs.bestTime)}</span>
        <b>{text(stageSelectRefs.recordUnavailable)}</b>
      </div>
      <div>
        <span class="stage-label">{text(stageSelectRefs.rank)}</span>
        <b>{text(stageSelectRefs.recordUnavailable)}</b>
      </div>
    </div>

    <div class="stage-roster">
      <div class="stage-roster-portrait" aria-hidden="true"></div>
      <div>
        <span>{text(stageSelectRefs.activeCharacter)}</span>
        <strong>{activeCharacterName}</strong>
      </div>
    </div>

    <button class="stage-deploy" type="button" onclick={handleConfirmStage}>
      <span>{text(stageSelectRefs.deploy)}</span>
      <b aria-hidden="true">›</b>
    </button>
  </aside>

  <div class="stage-map" aria-label={text(stageSelectRefs.ariaMap)}>
    <svg class="stage-paths" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {#each stageOptions.slice(0, -1) as stage, index}
        <line
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
        class="stage-node"
        style={`left:${stage.nodePosition.x}%;top:${stage.nodePosition.y}%;--node-index:${index}`}
        type="button"
        aria-label={`${stageTitle(stage)}, ${stageSubtitle(stage)}`}
        onclick={() => onSelectStage(index)}
        ondblclick={() => {
          onSelectStage(index)
          handleConfirmStage()
        }}
      >
        <i aria-hidden="true"></i>
        <b>{stage.number}</b>
        <span><strong>{stageTitle(stage)}</strong>{stageSubtitle(stage)}</span>
      </button>
    {/each}
  </div>

  <div class="select-controls stage-controls">
    <span><kbd>←</kbd><kbd>→</kbd><kbd>↑</kbd><kbd>↓</kbd> {text('common.select')}</span>
    <span><kbd>␣</kbd> {text('common.confirm')}</span>
    <span><kbd>⎋</kbd> {text('common.back')}</span>
  </div>
</section>
