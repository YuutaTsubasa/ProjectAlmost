<script lang="ts">
  import { IMAGE_ASSETS } from './game/assets/assetManifest'
  import { translator, type TranslationKey } from './i18n'

  export let stageId: string
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
  export let onNextStage: () => void
  export let nextStageAvailable: boolean
  export let selectedAction: number
  export let onSelectAction: (index: number) => void

  function activate(index = selectedAction) {
    if (index === 0) onRetry()
    if (index === 1) onStageSelect()
    if (index === 2 && nextStageAvailable) onNextStage()
  }

  const actions = ['result.retry', 'result.stageSelect', 'result.nextStage'] as const
</script>

<section class="stage-result" aria-label="Stage Result">
  <div class="result-veil"></div>
  <div class="result-hero">
    <img src={IMAGE_ASSETS.resultStandee} alt="Yuuta Tsubasa" />
    <div><strong>Yuuta Tsubasa</strong><span>{$translator('result.paladin')}</span></div>
  </div>

  <div class="result-content">
    <header class="result-banner"><span>✦</span><strong>{$translator('result.title')}</strong><span>✦</span></header>
    <div class="result-stage-name"><b>White Palace {stageId}</b><i></i><span>{$translator(`stage.${stageId}.subtitle` as TranslationKey)}</span></div>

    <div class="result-board">
      <div class="result-stats">
        <div><span>{$translator('result.clearTime')}</span><b>{time}</b><small>{$translator('result.newRecord')}</small></div>
        <div><span>{$translator('hud.coins')}</span><b>{coins}<em>/ {coinTarget}</em></b><small class:perfect={coins === coinTarget}>{coins === coinTarget ? $translator('result.perfect') : ''}</small></div>
        <div><span>{$translator('result.damageTaken')}</span><b>{damageTaken}</b><small class:perfect={damageTaken === 0}>{damageTaken === 0 ? $translator('result.perfect') : ''}</small></div>
        <div><span>{$translator('hud.falls')}</span><b>{falls}</b><small class:perfect={falls === 0}>{falls === 0 ? $translator('result.perfect') : ''}</small></div>
        <div><span>{$translator('result.enemiesDefeated')}</span><b>{enemiesDefeated}<em>/ {enemyTarget}</em></b><small class:perfect={enemiesDefeated === enemyTarget}>{enemiesDefeated === enemyTarget ? $translator('result.perfect') : ''}</small></div>
        <div><span>{$translator('hud.checkpoints')}</span><b>{checkpointsReached}<em>/ {checkpointTarget}</em></b><small class:perfect={checkpointsReached === checkpointTarget}>{checkpointsReached === checkpointTarget ? $translator('result.perfect') : ''}</small></div>
      </div>
      <div class="result-rank">
        <span>{$translator('hud.rank')}</span>
        <div class={`rank-${rank.toLowerCase()}`}><b>{rank}</b></div>
        <small>{$translator('result.finalEvaluation')}</small>
      </div>
    </div>

    <nav class="result-actions" aria-label="Stage result actions">
      {#each actions as action, index}
        <button
          class:active={selectedAction === index}
          class:locked={index === 2 && !nextStageAvailable}
          disabled={index === 2 && !nextStageAvailable}
          onclick={() => {
            onSelectAction(index)
            activate(index)
          }}
        >
          <b>{$translator(action)}</b>
          {#if index === 2 && !nextStageAvailable}<span>{$translator('common.locked')}</span>{/if}
        </button>
      {/each}
    </nav>
  </div>
</section>
