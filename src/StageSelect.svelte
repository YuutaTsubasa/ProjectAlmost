<script lang="ts">
  import { onMount } from 'svelte'
  import { IMAGE_ASSETS } from './game/assets/assetManifest'
  import { stages as stageData, type StageId } from './game/stages/stageRegistry'
  import { isStageUnlocked, type SaveData } from './game/save/saveData'
  import { translator, type TranslationKey } from './i18n'

  export let onEnter: (stageId: StageId) => void
  export let onBack: () => void
  export let saveData: SaveData
  export let initialStageId: StageId

  type StageOption = {
    id: string
    subtitle: string
    objective: string
    coins: number
    x: number
    y: number
    unlocked: boolean
    cleared: boolean
  }

  const stageOptions: StageOption[] = [
    { id: '1-1', subtitle: stageData['1-1'].subtitle, objective: stageData['1-1'].objective, coins: stageData['1-1'].coins.length, x: 35, y: 70, unlocked: isStageUnlocked(saveData, '1-1'), cleared: Boolean(saveData.stageRecords['1-1']?.cleared) },
    { id: '1-2', subtitle: stageData['1-2'].subtitle, objective: isStageUnlocked(saveData, '1-2') ? stageData['1-2'].objective : 'Locked', coins: stageData['1-2'].coins.length, x: 49, y: 59, unlocked: isStageUnlocked(saveData, '1-2'), cleared: Boolean(saveData.stageRecords['1-2']?.cleared) },
    { id: '1-3', subtitle: 'Sky Terrace', objective: 'Locked', coins: 24, x: 61, y: 42, unlocked: false, cleared: false },
    { id: '1-4', subtitle: 'The Arch Bridge', objective: 'Locked', coins: 28, x: 73, y: 54, unlocked: false, cleared: false },
    { id: '1-5', subtitle: 'Hanging Garden', objective: 'Locked', coins: 30, x: 83, y: 34, unlocked: false, cleared: false },
    { id: '1-6', subtitle: 'The High Spire', objective: 'Locked', coins: 35, x: 91, y: 17, unlocked: false, cleared: false },
  ]

  let selectedIndex = Math.max(0, stageOptions.findIndex((stage) => stage.id === initialStageId))
  let selected = stageOptions[selectedIndex]
  let confirming = false
  let inputReady = false

  function stageSubtitleKey(id: string): TranslationKey {
    return `stage.${id}.subtitle` as TranslationKey
  }

  function selectStage(index: number) {
    if ((index + stageOptions.length) % stageOptions.length !== selectedIndex) {
      window.dispatchEvent(new CustomEvent('projectrun:sfx', { detail: 'ui-move' }))
    }
    selectedIndex = (index + stageOptions.length) % stageOptions.length
    selected = stageOptions[selectedIndex]
  }

  function confirmStage() {
    if (!inputReady || !selected.unlocked || confirming) return
    window.dispatchEvent(new CustomEvent('projectrun:sfx', { detail: 'ui-confirm' }))
    window.dispatchEvent(new CustomEvent('projectrun:prepare-music', { detail: 'stage' }))
    confirming = true
    window.setTimeout(() => onEnter(selected.id as StageId), 280)
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!inputReady) return
    if (event.key === 'ArrowLeft' || event.code === 'KeyA') {
      event.preventDefault()
      selectStage(selectedIndex - 1)
    } else if (event.key === 'ArrowRight' || event.code === 'KeyD') {
      event.preventDefault()
      selectStage(selectedIndex + 1)
    } else if (event.code === 'Space' || event.key === 'Enter') {
      event.preventDefault()
      confirmStage()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      window.dispatchEvent(new CustomEvent('projectrun:sfx', { detail: 'ui-back' }))
      onBack()
    }
  }

  onMount(() => {
    const readyTimer = window.setTimeout(() => {
      inputReady = true
    }, 360)
    window.addEventListener('keydown', handleKeydown)
    return () => {
      window.clearTimeout(readyTimer)
      window.removeEventListener('keydown', handleKeydown)
    }
  })
</script>

<section class:confirming class="stage-select" aria-label={$translator('stageSelect.title')}>
  <div class="select-world" aria-hidden="true">
    <div class="select-sky"></div>
    <div class="select-palace far"></div>
    <div class="select-palace near"></div>
    <div class="select-cloud cloud-a"></div>
    <div class="select-cloud cloud-b"></div>
  </div>

  <header class="select-banner">
    <span>✦</span>
    <strong>{$translator('stageSelect.title')}</strong>
    <span>✦</span>
  </header>

  <aside class="select-detail">
    <div class="select-preview">
      <div class="preview-scene"></div>
      {#if !selected.unlocked}<div class="preview-lock">{$translator('common.locked')}</div>{/if}
    </div>
    <strong class="select-title">White Palace {selected.id}</strong>
    <span class="select-subtitle">{$translator(stageSubtitleKey(selected.id))}</span>

    <div class="select-rule"></div>
    <span class="select-label">{$translator('stageSelect.objective')}</span>
    <p class="select-objective">{selected.unlocked ? $translator('stage.objective.reachGoal') : $translator('common.locked')}</p>

    <span class="select-label">{$translator('stageSelect.collectibles')}</span>
    <div class="select-collectible">
      <span class="coin-mark">I</span>
      <b>{saveData.stageRecords[selected.id as StageId]?.maxCoins ?? 0} <small>/ {selected.coins}</small></b>
    </div>

    <div class="select-stats">
      <div><span class="select-label">{$translator('stageSelect.bestTime')}</span><b>{saveData.stageRecords[selected.id as StageId]?.bestTime ?? (selected.unlocked ? '--:--.--' : '--:--.--')}</b></div>
      <div><span class="select-label">{$translator('stageSelect.rank')}</span><b class="select-rank">{saveData.stageRecords[selected.id as StageId]?.bestRank ?? '--'}</b></div>
    </div>

    <div class="select-roster">
      <img src={IMAGE_ASSETS.playerPortrait} alt="Yuuta Tsubasa" />
      <div><span>{$translator('stageSelect.activeCharacter')}</span><strong>Yuuta Tsubasa</strong></div>
    </div>
    <button class="stage-deploy" disabled={!selected.unlocked || confirming} onclick={confirmStage}>
      <span>{selected.unlocked ? $translator('stageSelect.deploy') : $translator('common.locked')}</span>
      <b>›</b>
    </button>
  </aside>

  <div class="select-map">
    <svg class="select-paths" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {#each stageOptions.slice(0, -1) as stage, index}
        <line class:live={stage.unlocked && stageOptions[index + 1].unlocked} x1={stage.x} y1={stage.y} x2={stageOptions[index + 1].x} y2={stageOptions[index + 1].y}></line>
      {/each}
    </svg>

    {#each stageOptions as stage, index}
      <button
        class:active={index === selectedIndex}
        class:locked={!stage.unlocked}
        class:cleared={stage.cleared}
        class="stage-node"
        style={`left:${stage.x}%;top:${stage.y}%;--node-index:${index}`}
        aria-label={`White Palace ${stage.id}, ${$translator(stageSubtitleKey(stage.id))}${stage.unlocked ? '' : `, ${$translator('common.locked')}`}`}
        onclick={() => selectStage(index)}
        ondblclick={() => {
          selectStage(index)
          confirmStage()
        }}
      >
        <i></i>
        <b>{stage.unlocked ? stage.id : '◆'}</b>
        <span><strong>{stage.id}</strong>{$translator(stageSubtitleKey(stage.id))}</span>
      </button>
    {/each}

  </div>

  <div class="select-controls">
    <span><kbd>←</kbd><kbd>→</kbd> {$translator('common.select')}</span>
    <span><kbd>Space</kbd> {$translator('common.confirm')}</span>
    <span><kbd>Esc</kbd> {$translator('common.back')}</span>
  </div>

</section>
