<script lang="ts">
  export let time: string
  export let coins: number
  export let coinTarget: number
  export let damageTaken: number
  export let falls: number
  export let enemiesDefeated: number
  export let enemyTarget: number
  export let checkpointsReached: number
  export let checkpointTarget: number
  export let rank: string
  export let onRetry: () => void
  export let onStageSelect: () => void
  export let selectedAction: number
  export let onSelectAction: (index: number) => void

  function activate(index = selectedAction) {
    if (index === 0) onRetry()
    if (index === 1) onStageSelect()
  }

  const actions = ['Retry', 'Stage Select', 'Next Stage']
</script>

<section class="stage-result" aria-label="Stage Result">
  <div class="result-veil"></div>
  <div class="result-hero">
    <img src="/assets/results/yuuta-stage-result-standee.png" alt="Yuuta Tsubasa" />
    <div><strong>Yuuta Tsubasa</strong><span>Paladin</span></div>
  </div>

  <div class="result-content">
    <header class="result-banner"><span>✦</span><strong>Stage Clear</strong><span>✦</span></header>
    <div class="result-stage-name"><b>White Palace 1-1</b><i></i><span>The First Gate</span></div>

    <div class="result-board">
      <div class="result-stats">
        <div><span>Clear Time</span><b>{time}</b><small>New Record</small></div>
        <div><span>Coins</span><b>{coins}<em>/ {coinTarget}</em></b><small class:perfect={coins === coinTarget}>{coins === coinTarget ? 'Perfect' : ''}</small></div>
        <div><span>Damage Taken</span><b>{damageTaken}</b><small class:perfect={damageTaken === 0}>{damageTaken === 0 ? 'Perfect' : ''}</small></div>
        <div><span>Falls</span><b>{falls}</b><small class:perfect={falls === 0}>{falls === 0 ? 'Perfect' : ''}</small></div>
        <div><span>Enemies Defeated</span><b>{enemiesDefeated}<em>/ {enemyTarget}</em></b><small class:perfect={enemiesDefeated === enemyTarget}>{enemiesDefeated === enemyTarget ? 'Perfect' : ''}</small></div>
        <div><span>Checkpoints</span><b>{checkpointsReached}<em>/ {checkpointTarget}</em></b><small class:perfect={checkpointsReached === checkpointTarget}>{checkpointsReached === checkpointTarget ? 'Perfect' : ''}</small></div>
      </div>
      <div class="result-rank">
        <span>Rank</span>
        <div class={`rank-${rank.toLowerCase()}`}><b>{rank}</b></div>
        <small>Final Evaluation</small>
      </div>
    </div>

    <nav class="result-actions" aria-label="Stage result actions">
      {#each actions as action, index}
        <button
          class:active={selectedAction === index}
          class:locked={index === 2}
          disabled={index === 2}
          onclick={() => {
            onSelectAction(index)
            activate(index)
          }}
        >
          <b>{action}</b>
          {#if index === 2}<span>Locked</span>{/if}
        </button>
      {/each}
    </nav>
  </div>
</section>
