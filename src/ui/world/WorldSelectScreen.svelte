<script lang="ts">
  import { onMount } from 'svelte'
  import {
    resolveLocalizedText,
    type LocaleCode,
    type LocalizationKey,
    type LocalizeData,
  } from '../../domain/data/localize/localize'
  import type { WorldCatalog, WorldData } from '../../domain/data/worlds/worldTypes'
  import type { WorldSelectInfoViewModel } from '../../application/select/selectInfoPresenter'
  import {
    mapGamepadControlIntents,
    mapKeyboardControlIntent,
    type ControlIntent,
    type GamepadControlSnapshot,
  } from '../../domain/input/controlIntents'
  import ControlHints from '../controls/ControlHints.svelte'

  type Props = {
    catalog: WorldCatalog
    localizeData: LocalizeData
    locale?: LocaleCode
    selectedWorldIndex: number
    selectInfo: WorldSelectInfoViewModel
    onControlIntent: (intent: ControlIntent) => void
    onSelectWorld: (index: number) => void
    onConfirmWorld: () => void
    onBack: () => void
  }

  let {
    catalog,
    localizeData,
    locale = 'en',
    selectedWorldIndex,
    selectInfo,
    onControlIntent,
    onSelectWorld,
    onConfirmWorld,
    onBack,
  }: Props = $props()

  let previousGamepadSnapshot: GamepadControlSnapshot | null = null

  const orderedWorlds = $derived(catalog.order.map((worldId) => catalog.items[worldId]))
  const selectedWorld = $derived(orderedWorlds[selectedWorldIndex] ?? orderedWorlds[0])
  const selectedWorldInfo = $derived(selectInfo.worlds[selectedWorldIndex] ?? selectInfo.worlds[0])

  function text(key: LocalizationKey): string {
    return resolveLocalizedText(localizeData, locale, key)
  }

  function worldTitle(world: WorldData): string {
    return text(world.titleRef)
  }

  function worldSubtitle(world: WorldData): string {
    return text(world.subtitleRef)
  }

  function worldNumber(world: WorldData): string {
    return String(world.number).padStart(2, '0')
  }

  function handleKeydown(event: KeyboardEvent) {
    const intent = mapKeyboardControlIntent(
      { key: event.key, repeat: event.repeat },
      'world-select',
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
      const intents = mapGamepadControlIntents(previousGamepadSnapshot, currentSnapshot, 'world-select')

      for (const intent of intents) {
        onControlIntent(intent)
      }

      previousGamepadSnapshot = currentSnapshot
      frameId = requestAnimationFrame(pollGamepad)
    }

    frameId = requestAnimationFrame(pollGamepad)

    return () => cancelAnimationFrame(frameId)
  })
</script>

<svelte:window onkeydown={handleKeydown} />

<section class={`world-select theme-${selectedWorld.theme}`} aria-label="World Select">
  <div class="world-backdrop" aria-hidden="true"></div>

  <header class="world-cinematic-head">
    <span aria-hidden="true"></span>
    <strong>World Select</strong>
  </header>

  <button class="menu-back-button dark world-back-button" type="button" onclick={onBack} aria-label="Back">
    <span aria-hidden="true">‹</span>
    <b>Back</b>
  </button>

  <div class="world-cinematic-copy" aria-live="polite">
    <span class="world-number">WORLD {worldNumber(selectedWorld)}</span>
    <strong class="world-cinematic-name">{worldTitle(selectedWorld)}</strong>
    <p>{worldSubtitle(selectedWorld)}</p>

    <div class="world-cinematic-progress">
      <div>
        <span>Progress</span>
        <b>{selectedWorldInfo.clearedStageCount}<small> / {selectedWorldInfo.stageCount}</small></b>
      </div>
      <div class="world-progress-track" aria-hidden="true">
        <span style={`width: ${selectedWorldInfo.progressPercent}%`}></span>
      </div>
    </div>

    <button class="world-enter" type="button" onclick={onConfirmWorld}>
      <span>Enter World</span>
      <b aria-hidden="true">›</b>
    </button>
  </div>

  <nav class="world-rail" aria-label="World Select">
    {#each orderedWorlds as world, index}
      <button
        class:active={index === selectedWorldIndex}
        class={`world-thumb theme-${world.theme}`}
        type="button"
        aria-label={`World ${worldNumber(world)} ${worldTitle(world)}`}
        onclick={() => onSelectWorld(index)}
        ondblclick={() => {
          onSelectWorld(index)
          onConfirmWorld()
        }}
      >
        <span class="world-thumb-art" aria-hidden="true">{world.symbol}</span>
        <span class="world-thumb-copy">
          <strong>{worldTitle(world)}</strong>
          <small>World {worldNumber(world)}</small>
        </span>
        <span class="world-thumb-number">{worldNumber(world)}</span>
      </button>
    {/each}
  </nav>

  <ControlHints
    className="world-controls"
    hints={[
      { keys: ['←', '→', '↑', '↓'], label: text('common.select') },
      { keys: ['Space'], label: text('common.confirm') },
      { keys: ['Esc'], label: text('common.back') },
    ]}
  />
</section>
