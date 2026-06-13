<script lang="ts">
  import { onMount } from 'svelte'
  import type { SaveData } from './game/save/saveData'
  import { translator, type TranslationKey } from './i18n'

  export let saveData: SaveData
  export let onEnter: (worldIndex: number) => void
  export let onSelect: (worldIndex: number) => void
  export let onBack: () => void
  export let initialWorldIndex = 1

  type WorldOption = {
    id: string
    name: TranslationKey
    subtitle: TranslationKey
    symbol: string
    theme: string
    unlocked: boolean
    stageCount: number
  }

  const worlds: WorldOption[] = [
    { id: '01', name: 'world.1.name', subtitle: 'world.1.subtitle', symbol: '♜', theme: 'palace', unlocked: true, stageCount: 6 },
    { id: '02', name: 'world.2.name', subtitle: 'world.2.subtitle', symbol: '♧', theme: 'forest', unlocked: true, stageCount: 6 },
    { id: '03', name: 'world.3.name', subtitle: 'world.3.subtitle', symbol: '≈', theme: 'ocean', unlocked: true, stageCount: 6 },
    { id: '04', name: 'world.4.name', subtitle: 'world.4.subtitle', symbol: '△', theme: 'snow', unlocked: true, stageCount: 6 },
    { id: '05', name: 'world.5.name', subtitle: 'world.5.subtitle', symbol: '◇', theme: 'volcano', unlocked: true, stageCount: 6 },
    { id: '06', name: 'world.6.name', subtitle: 'world.6.subtitle', symbol: '✦', theme: 'abyss', unlocked: true, stageCount: 6 },
  ]

  let selectedIndex = Math.max(0, Math.min(worlds.length - 1, initialWorldIndex - 1))
  let inputReady = false
  let confirming = false
  $: selected = worlds[selectedIndex]
  $: clearedStages = Object.values(saveData.stageRecords).filter((record) => record?.cleared).length
  $: selectedClearedStages = selected.id === '01' ? clearedStages : 0
  $: selectedProgress = `${Math.min(100, (selectedClearedStages / selected.stageCount) * 100)}%`

  function selectWorld(index: number) {
    const next = (index + worlds.length) % worlds.length
    if (next !== selectedIndex) window.dispatchEvent(new CustomEvent('projectrun:sfx', { detail: 'ui-move' }))
    selectedIndex = next
    onSelect(next + 1)
  }

  function confirmWorld(index = selectedIndex) {
    const world = worlds[index]
    if (!inputReady || !world.unlocked || confirming) return
    selectedIndex = index
    window.dispatchEvent(new CustomEvent('projectrun:sfx', { detail: 'ui-confirm' }))
    confirming = true
    window.setTimeout(() => onEnter(index + 1), 260)
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!inputReady) return
    if (event.key === 'ArrowLeft' || event.code === 'KeyA') {
      event.preventDefault()
      selectWorld(selectedIndex - 1)
    } else if (event.key === 'ArrowRight' || event.code === 'KeyD') {
      event.preventDefault()
      selectWorld(selectedIndex + 1)
    } else if (event.key === 'ArrowUp' || event.code === 'KeyW') {
      event.preventDefault()
      selectWorld(selectedIndex - 1)
    } else if (event.key === 'ArrowDown' || event.code === 'KeyS') {
      event.preventDefault()
      selectWorld(selectedIndex + 1)
    } else if (event.code === 'Space' || event.key === 'Enter') {
      event.preventDefault()
      confirmWorld()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      window.dispatchEvent(new CustomEvent('projectrun:sfx', { detail: 'ui-back' }))
      onBack()
    }
  }

  onMount(() => {
    const readyTimer = window.setTimeout(() => inputReady = true, 360)
    window.addEventListener('keydown', handleKeydown)
    return () => {
      window.clearTimeout(readyTimer)
      window.removeEventListener('keydown', handleKeydown)
    }
  })
</script>

<section class:confirming class={`world-select theme-${selected.theme}`} aria-label={$translator('worldSelect.title')}>
  <div class="world-backdrop" aria-hidden="true"></div>

  <header class="world-cinematic-head">
    <span aria-hidden="true"></span>
    <strong>{$translator('worldSelect.title')}</strong>
  </header>

  <div class="world-cinematic-copy">
    <span class="world-number">WORLD {selected.id}</span>
    <strong class="world-cinematic-name">{$translator(selected.name)}</strong>
    <p>{$translator(selected.subtitle)}</p>

    <div class="world-cinematic-progress">
      <div>
        <span>{$translator('worldSelect.progress')}</span>
        <b>{selectedClearedStages}<small> / {selected.stageCount}</small></b>
      </div>
      <div class="world-progress-track" aria-hidden="true">
        <span style={`width: ${selectedProgress}`}></span>
      </div>
    </div>

    <button class="world-enter" disabled={!selected.unlocked || confirming} onclick={() => confirmWorld()}>
      <span>{selected.unlocked ? $translator('worldSelect.enter') : $translator('common.locked')}</span>
      <b>›</b>
    </button>
  </div>

  <nav class="world-rail" aria-label={$translator('worldSelect.title')}>
    {#each worlds as world, index}
      <button
        class:active={index === selectedIndex}
        class:locked={!world.unlocked}
        class={`world-thumb theme-${world.theme}`}
        aria-label={`${$translator(world.name)}${world.unlocked ? '' : `, ${$translator('common.locked')}`}`}
        onclick={() => selectWorld(index)}
        ondblclick={() => {
          selectWorld(index)
          confirmWorld(index)
        }}
      >
        <span class="world-thumb-art" aria-hidden="true">{world.symbol}</span>
        <span class="world-thumb-copy">
          <strong>{$translator(world.name)}</strong>
          <small>{world.unlocked ? `WORLD ${world.id}` : $translator('common.locked')}</small>
        </span>
        <span class="world-thumb-number">{world.id}</span>
        {#if !world.unlocked}<i>◆</i>{/if}
      </button>
    {/each}
  </nav>

  <div class="select-controls world-controls">
    <span><kbd>←</kbd><kbd>→</kbd><kbd>↑</kbd><kbd>↓</kbd> {$translator('common.select')}</span>
    <span><kbd>Space</kbd> {$translator('common.confirm')}</span>
    <span><kbd>Esc</kbd> {$translator('common.back')}</span>
  </div>
</section>
