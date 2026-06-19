<script lang="ts">
  import {
    resolveLocalizedText,
    type LocaleCode,
    type LocalizeData,
  } from '../../domain/data/localize/localize'
  import type { WorldCatalog, WorldData } from '../../domain/data/worlds/worldTypes'

  type Props = {
    catalog: WorldCatalog
    localizeData: LocalizeData
    locale?: LocaleCode
    selectedWorldIndex: number
    onMoveSelection: (direction: -1 | 1) => void
    onSelectWorld: (index: number) => void
    onConfirmWorld: () => void
    onBack: () => void
  }

  let {
    catalog,
    localizeData,
    locale = 'en',
    selectedWorldIndex,
    onMoveSelection,
    onSelectWorld,
    onConfirmWorld,
    onBack,
  }: Props = $props()

  const orderedWorlds = $derived(catalog.order.map((worldId) => catalog.items[worldId]))
  const selectedWorld = $derived(orderedWorlds[selectedWorldIndex] ?? orderedWorlds[0])

  function worldTitle(world: WorldData): string {
    return resolveLocalizedText(localizeData, locale, world.titleRef)
  }

  function worldSubtitle(world: WorldData): string {
    return resolveLocalizedText(localizeData, locale, world.subtitleRef)
  }

  function worldNumber(world: WorldData): string {
    return String(world.number).padStart(2, '0')
  }

  function handleKeydown(event: KeyboardEvent) {
    if (
      event.key === 'ArrowDown' ||
      event.key === 'ArrowRight' ||
      event.key.toLowerCase() === 's' ||
      event.key.toLowerCase() === 'd'
    ) {
      event.preventDefault()
      onMoveSelection(1)
      return
    }

    if (
      event.key === 'ArrowUp' ||
      event.key === 'ArrowLeft' ||
      event.key.toLowerCase() === 'w' ||
      event.key.toLowerCase() === 'a'
    ) {
      event.preventDefault()
      onMoveSelection(-1)
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onConfirmWorld()
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      onBack()
    }
  }
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
        <b>0<small> / {selectedWorld.stageCount}</small></b>
      </div>
      <div class="world-progress-track" aria-hidden="true">
        <span style="width: 0%"></span>
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

  <div class="select-controls world-controls">
    <span><kbd>←</kbd><kbd>→</kbd><kbd>↑</kbd><kbd>↓</kbd> Select</span>
    <span><kbd>Space</kbd> Confirm</span>
    <span><kbd>Esc</kbd> Back</span>
  </div>
</section>
