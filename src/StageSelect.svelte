<script lang="ts">
  import { onMount } from 'svelte'

  export let onEnter: () => void

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

  const stages: StageOption[] = [
    { id: '1-1', subtitle: 'The First Gate', objective: 'Reach the Goal', coins: 17, x: 35, y: 70, unlocked: true, cleared: false },
    { id: '1-2', subtitle: 'Azure Courtyard', objective: 'Locked', coins: 21, x: 49, y: 59, unlocked: false, cleared: false },
    { id: '1-3', subtitle: 'Sky Terrace', objective: 'Locked', coins: 24, x: 61, y: 42, unlocked: false, cleared: false },
    { id: '1-4', subtitle: 'The Arch Bridge', objective: 'Locked', coins: 28, x: 73, y: 54, unlocked: false, cleared: false },
    { id: '1-5', subtitle: 'Hanging Garden', objective: 'Locked', coins: 30, x: 83, y: 34, unlocked: false, cleared: false },
    { id: '1-6', subtitle: 'The High Spire', objective: 'Locked', coins: 35, x: 91, y: 17, unlocked: false, cleared: false },
  ]

  let selectedIndex = 0
  let selected = stages[selectedIndex]
  let confirming = false

  function selectStage(index: number) {
    selectedIndex = (index + stages.length) % stages.length
    selected = stages[selectedIndex]
  }

  function confirmStage() {
    if (!selected.unlocked || confirming) return
    confirming = true
    window.setTimeout(onEnter, 280)
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      selectStage(selectedIndex - 1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      selectStage(selectedIndex + 1)
    } else if (event.code === 'Space' || event.key === 'Enter') {
      event.preventDefault()
      confirmStage()
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  })
</script>

<section class:confirming class="stage-select" aria-label="Stage Select">
  <div class="select-world" aria-hidden="true">
    <div class="select-sky"></div>
    <div class="select-palace far"></div>
    <div class="select-palace near"></div>
    <div class="select-cloud cloud-a"></div>
    <div class="select-cloud cloud-b"></div>
  </div>

  <header class="select-banner">
    <span>✦</span>
    <strong>Stage Select</strong>
    <span>✦</span>
  </header>

  <aside class="select-detail">
    <div class="select-preview">
      <div class="preview-scene"></div>
      {#if !selected.unlocked}<div class="preview-lock">Locked</div>{/if}
    </div>
    <strong class="select-title">White Palace {selected.id}</strong>
    <span class="select-subtitle">{selected.subtitle}</span>

    <div class="select-rule"></div>
    <span class="select-label">Objective</span>
    <p class="select-objective">{selected.objective}</p>

    <span class="select-label">Collectibles</span>
    <div class="select-collectible">
      <span class="coin-mark">I</span>
      <b>{selected.unlocked ? '00' : '0'} <small>/ {selected.coins}</small></b>
    </div>

    <div class="select-stats">
      <div><span class="select-label">Best Time</span><b>{selected.unlocked ? '00:00.00' : '--:--.--'}</b></div>
      <div><span class="select-label">Rank</span><b class="select-rank">--</b></div>
    </div>

    <div class="select-roster">
      <img src="/assets/hud/player-portrait.png" alt="Yuuta Tsubasa" />
      <div><span>Active Character</span><strong>Yuuta Tsubasa</strong></div>
    </div>
  </aside>

  <div class="select-map">
    <svg class="select-paths" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {#each stages.slice(0, -1) as stage, index}
        <line class:live={stage.unlocked && stages[index + 1].unlocked} x1={stage.x} y1={stage.y} x2={stages[index + 1].x} y2={stages[index + 1].y}></line>
      {/each}
    </svg>

    {#each stages as stage, index}
      <button
        class:active={index === selectedIndex}
        class:locked={!stage.unlocked}
        class:cleared={stage.cleared}
        class="stage-node"
        style={`left:${stage.x}%;top:${stage.y}%;--node-index:${index}`}
        aria-label={`White Palace ${stage.id}, ${stage.subtitle}${stage.unlocked ? '' : ', locked'}`}
        onclick={() => selectStage(index)}
      >
        <i></i>
        <b>{stage.unlocked ? stage.id : '◆'}</b>
        <span><strong>{stage.id}</strong>{stage.subtitle}</span>
      </button>
    {/each}

  </div>

  <div class="select-controls">
    <span><kbd>←</kbd><kbd>→</kbd> Select</span>
    <span><kbd>Space</kbd> Confirm</span>
    <span><kbd>Esc</kbd> Back</span>
  </div>

</section>
