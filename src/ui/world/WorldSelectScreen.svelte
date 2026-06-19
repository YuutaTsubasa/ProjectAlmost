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
  <img class="world-select-bg" src={selectedWorld.assetRefs.stageSelectBackground} alt="" />
  <div class="world-select-shade" aria-hidden="true"></div>
  <div class="world-select-motif" aria-hidden="true">{selectedWorld.symbol}</div>

  <header class="world-select-head">
    <span aria-hidden="true"></span>
    <b>World Select</b>
  </header>

  <button class="world-back" type="button" onclick={onBack}>
    <span aria-hidden="true">‹</span>
    <b>Back</b>
  </button>

  <article class="world-hero" aria-live="polite">
    <small>World {worldNumber(selectedWorld)}</small>
    <h2>{worldTitle(selectedWorld)}</h2>
    <p>{worldSubtitle(selectedWorld)}</p>
    <dl>
      <div>
        <dt>Stages</dt>
        <dd>{selectedWorld.stageCount}</dd>
      </div>
      <div>
        <dt>Theme</dt>
        <dd>{selectedWorld.theme}</dd>
      </div>
    </dl>
    <button class="world-enter" type="button" onclick={onConfirmWorld}>
      <span>Enter World</span>
      <b aria-hidden="true">›</b>
    </button>
  </article>

  <nav class="world-rail" aria-label="World list">
    {#each orderedWorlds as world, index}
      <button
        class:active={index === selectedWorldIndex}
        type="button"
        aria-label={`World ${worldNumber(world)} ${worldTitle(world)}`}
        onclick={() => onSelectWorld(index)}
        ondblclick={() => {
          onSelectWorld(index)
          onConfirmWorld()
        }}
      >
        <span class="world-rail-symbol" aria-hidden="true">{world.symbol}</span>
        <span class="world-rail-copy">
          <strong>{worldTitle(world)}</strong>
          <small>World {worldNumber(world)}</small>
        </span>
        <i>{worldNumber(world)}</i>
      </button>
    {/each}
  </nav>

  <p class="world-controls">
    <kbd>←</kbd><kbd>→</kbd><kbd>↑</kbd><kbd>↓</kbd> Select <kbd>Enter</kbd> Confirm
    <kbd>Esc</kbd> Back
  </p>
</section>
