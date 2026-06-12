<script lang="ts">
  import { onMount } from 'svelte'
  import type { SaveData } from './game/save/saveData'
  import { translator, type TranslationKey } from './i18n'

  export let saveData: SaveData
  export let onEnter: () => void
  export let onBack: () => void

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
    { id: '02', name: 'world.2.name', subtitle: 'world.2.subtitle', symbol: '♧', theme: 'forest', unlocked: false, stageCount: 6 },
    { id: '03', name: 'world.3.name', subtitle: 'world.3.subtitle', symbol: '≈', theme: 'ocean', unlocked: false, stageCount: 6 },
    { id: '04', name: 'world.4.name', subtitle: 'world.4.subtitle', symbol: '△', theme: 'snow', unlocked: false, stageCount: 6 },
    { id: '05', name: 'world.5.name', subtitle: 'world.5.subtitle', symbol: '◇', theme: 'volcano', unlocked: false, stageCount: 6 },
    { id: '06', name: 'world.6.name', subtitle: 'world.6.subtitle', symbol: '✦', theme: 'abyss', unlocked: false, stageCount: 6 },
  ]

  let selectedIndex = 0
  let inputReady = false
  let confirming = false
  $: selected = worlds[selectedIndex]
  $: clearedStages = Object.values(saveData.stageRecords).filter((record) => record?.cleared).length

  function selectWorld(index: number) {
    const next = (index + worlds.length) % worlds.length
    if (next !== selectedIndex) window.dispatchEvent(new CustomEvent('projectrun:sfx', { detail: 'ui-move' }))
    selectedIndex = next
  }

  function confirmWorld(index = selectedIndex) {
    const world = worlds[index]
    if (!inputReady || !world.unlocked || confirming) return
    selectedIndex = index
    window.dispatchEvent(new CustomEvent('projectrun:sfx', { detail: 'ui-confirm' }))
    confirming = true
    window.setTimeout(onEnter, 260)
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
      selectWorld(selectedIndex - 3)
    } else if (event.key === 'ArrowDown' || event.code === 'KeyS') {
      event.preventDefault()
      selectWorld(selectedIndex + 3)
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

  <header class="world-banner">
    <span>✦</span>
    <strong>{$translator('worldSelect.title')}</strong>
    <span>✦</span>
  </header>

  <aside class="world-detail">
    <div class={`world-preview theme-${selected.theme}`}>
      <span>{selected.symbol}</span>
      {#if !selected.unlocked}<b>{$translator('common.locked')}</b>{/if}
    </div>
    <span class="world-number">WORLD {selected.id}</span>
    <strong>{$translator(selected.name)}</strong>
    <p>{$translator(selected.subtitle)}</p>
    <div class="world-rule"></div>
    <div class="world-progress">
      <span>{$translator('worldSelect.progress')}</span>
      <b>{selected.id === '01' ? clearedStages : 0} <small>/ {selected.stageCount}</small></b>
    </div>
    <button disabled={!selected.unlocked || confirming} onclick={() => confirmWorld()}>
      <span>{selected.unlocked ? $translator('worldSelect.enter') : $translator('common.locked')}</span>
      <b>›</b>
    </button>
  </aside>

  <div class="world-grid">
    {#each worlds as world, index}
      <button
        class:active={index === selectedIndex}
        class:locked={!world.unlocked}
        class={`world-card theme-${world.theme}`}
        aria-label={`${$translator(world.name)}${world.unlocked ? '' : `, ${$translator('common.locked')}`}`}
        onclick={() => selectWorld(index)}
        ondblclick={() => {
          selectWorld(index)
          confirmWorld(index)
        }}
      >
        <span class="world-card-number">{world.id}</span>
        <span class="world-card-symbol">{world.symbol}</span>
        <span class="world-card-copy">
          <strong>{$translator(world.name)}</strong>
          <small>{world.unlocked ? $translator(world.subtitle) : $translator('common.locked')}</small>
        </span>
        {#if !world.unlocked}<i>◆</i>{/if}
      </button>
    {/each}
  </div>

  <div class="select-controls world-controls">
    <span><kbd>←</kbd><kbd>→</kbd><kbd>↑</kbd><kbd>↓</kbd> {$translator('common.select')}</span>
    <span><kbd>Space</kbd> {$translator('common.confirm')}</span>
    <span><kbd>Esc</kbd> {$translator('common.back')}</span>
  </div>
</section>
