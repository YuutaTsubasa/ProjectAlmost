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
  export let worldIndex = 1

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

  const placeholderPositions = [{ x: 35, y: 70 }, { x: 49, y: 59 }, { x: 61, y: 42 }, { x: 73, y: 54 }, { x: 83, y: 34 }, { x: 91, y: 17 }]
  const worldOnePositions: Record<string, { x: number; y: number }> = {
    '1-1': { x: 34, y: 82 },
    '1-2': { x: 81, y: 86 },
    '1-3': { x: 74, y: 50 },
    '1-4': { x: 55, y: 39 },
    '1-5': { x: 70, y: 27 },
    '1-6': { x: 73, y: 6 },
  }
  const worldTwoPositions: Record<string, { x: number; y: number }> = {
    '2-1': { x: 31, y: 67 },
    '2-2': { x: 45, y: 58 },
    '2-3': { x: 58, y: 42 },
    '2-4': { x: 70, y: 50 },
    '2-5': { x: 82, y: 32 },
    '2-6': { x: 91, y: 18 },
  }
  const worldThreePositions: Record<string, { x: number; y: number }> = {
    '3-1': { x: 30, y: 72 },
    '3-2': { x: 44, y: 56 },
    '3-3': { x: 58, y: 66 },
    '3-4': { x: 70, y: 42 },
    '3-5': { x: 82, y: 28 },
    '3-6': { x: 91, y: 16 },
  }
  const worldFourPositions: Record<string, { x: number; y: number }> = {
    '4-1': { x: 29, y: 70 },
    '4-2': { x: 42, y: 58 },
    '4-3': { x: 56, y: 44 },
    '4-4': { x: 70, y: 55 },
    '4-5': { x: 83, y: 34 },
    '4-6': { x: 91, y: 18 },
  }
  const worldFivePositions: Record<string, { x: number; y: number }> = {
    '5-1': { x: 28, y: 72 },
    '5-2': { x: 43, y: 57 },
    '5-3': { x: 58, y: 67 },
    '5-4': { x: 71, y: 45 },
    '5-5': { x: 82, y: 30 },
    '5-6': { x: 91, y: 16 },
  }
  const worldSixPositions: Record<string, { x: number; y: number }> = {
    '6-1': { x: 30, y: 74 },
    '6-2': { x: 45, y: 60 },
    '6-3': { x: 58, y: 43 },
    '6-4': { x: 72, y: 56 },
    '6-5': { x: 83, y: 32 },
    '6-6': { x: 91, y: 15 },
  }
  const stagePositions = worldIndex === 1 ? worldOnePositions : worldIndex === 2 ? worldTwoPositions : worldIndex === 3 ? worldThreePositions : worldIndex === 4 ? worldFourPositions : worldIndex === 5 ? worldFivePositions : worldIndex === 6 ? worldSixPositions : {}
  const registeredStages = (Object.keys(stageData) as StageId[])
    .filter((id) => id.startsWith(`${worldIndex}-`))
    .sort((a, b) => Number(a.split('-')[1]) - Number(b.split('-')[1]))

  const stageOptions: StageOption[] = registeredStages.length > 0
    ? registeredStages.map((id, index) => {
        const stage = stageData[id]
        const position = stagePositions[id] ?? placeholderPositions[index] ?? placeholderPositions[placeholderPositions.length - 1]
        const unlocked = isStageUnlocked(saveData, id)
        return {
          id,
          subtitle: stage.subtitle,
          objective: unlocked ? stage.objective : 'Locked',
          coins: stage.coins.length,
          ...position,
          unlocked,
          cleared: Boolean(saveData.stageRecords[id]?.cleared),
        }
      })
    : placeholderPositions.map((position, index) => ({
        id: `${worldIndex}-${index + 1}`,
        subtitle: 'Locked',
        objective: 'Locked',
        coins: 0,
        ...position,
        unlocked: false,
        cleared: false,
      }))

  let selectedIndex = Math.max(0, stageOptions.findIndex((stage) => stage.id === initialStageId))
  let selected = stageOptions[selectedIndex]
  let confirming = false
  let inputReady = false

  function stageSubtitleKey(id: string): TranslationKey {
    return selected.unlocked || stageData[id as StageId] ? `stage.${id}.subtitle` as TranslationKey : 'common.locked'
  }

  function worldNameKey(): TranslationKey {
    return `world.${worldIndex}.name` as TranslationKey
  }

  function isBossStageId(id: string): boolean {
    return id.endsWith('-6')
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
    confirming = true
    window.setTimeout(() => onEnter(selected.id as StageId), 280)
  }

  function goBack() {
    if (!inputReady || confirming) return
    window.dispatchEvent(new CustomEvent('projectrun:sfx', { detail: 'ui-back' }))
    onBack()
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
      goBack()
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
    <div class={`select-world world-${worldIndex}`} aria-hidden="true">
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

  <button class="menu-back-button stage-back-button" onclick={goBack} aria-label={$translator('common.back')}>
    <span aria-hidden="true">‹</span>
    <b>{$translator('common.back')}</b>
  </button>

  <aside class="select-detail">
    <div class="select-preview">
      <div class="preview-scene"></div>
      {#if !selected.unlocked}<div class="preview-lock">{$translator('common.locked')}</div>{/if}
    </div>
    <strong class="select-title">{$translator(worldNameKey())} {selected.id}</strong>
    <span class="select-subtitle">{$translator(stageSubtitleKey(selected.id))}</span>

    <div class="select-rule"></div>
    <span class="select-label">{$translator('stageSelect.objective')}</span>
    <p class="select-objective">{selected.unlocked ? $translator(isBossStageId(selected.id) ? 'stage.objective.defeatBoss' : 'stage.objective.reachGoal') : $translator('common.locked')}</p>

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
        aria-label={`${$translator(worldNameKey())} ${stage.id}, ${$translator(stageSubtitleKey(stage.id))}${stage.unlocked ? '' : `, ${$translator('common.locked')}`}`}
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
