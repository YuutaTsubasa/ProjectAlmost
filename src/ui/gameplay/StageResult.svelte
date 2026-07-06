<script lang="ts">
  import type { GameplayClearResultSnapshot } from '../../domain/gameplay/gameplayHud'
  import {
    getResultActionStates,
    getStageResultRowStates,
    type StageResultActionType,
  } from '../../domain/gameplay/stageResult'
  import type { GameplayHudStageDisplay } from './gameplayHudDisplay'

  type Props = {
    result: GameplayClearResultSnapshot
    stageDisplay: GameplayHudStageDisplay
    selectedAction: number
    nextStageAvailable: boolean
    onSelectAction: (index: number) => void
    onAction: (action: StageResultActionType) => void
  }

  let {
    result,
    stageDisplay,
    selectedAction,
    nextStageAvailable,
    onSelectAction,
    onAction,
  }: Props = $props()

  const rowStates = $derived(getStageResultRowStates(result))
  const actions = $derived(getResultActionStates({ nextStageAvailable }))

  function actionLabel(type: StageResultActionType): string {
    if (type === 'retry') return 'Retry'
    if (type === 'stage-select') return 'Stage Select'
    return 'Next Stage'
  }

  function activateAction(type: StageResultActionType, disabled: boolean): void {
    if (disabled) return
    onAction(type)
  }
</script>

<section class="stage-result" aria-label="Stage Result">
  <div class="result-veil"></div>
  <aside class="result-hero" aria-hidden="true">
    <img src="/assets/results/yuuta-stage-result-standee.webp" alt="" />
    <div>
      <strong>Yuuta Tsubasa</strong>
      <span>Paladin Candidate</span>
    </div>
  </aside>

  <div class="result-content">
    <div class="result-banner">Stage Result</div>
    <div class="result-stage-name">
      <strong>{stageDisplay.worldLabel} {stageDisplay.stageId}</strong>
      <span>{stageDisplay.stageSubtitle}</span>
    </div>

    <div class="result-board">
      <div class="result-stats">
        <div class="result-row">
          <span>Clear Time</span>
          <b>{result.time}</b>
          <em>New Record</em>
        </div>
        <div class:perfect={rowStates.coinsPerfect} class="result-row">
          <span>Coins</span>
          <b>{result.coins} / {result.coinTarget}</b>
          {#if rowStates.coinsPerfect}<em>Perfect</em>{/if}
        </div>
        <div class:perfect={rowStates.damagePerfect} class="result-row">
          <span>Damage Taken</span>
          <b>{result.damageTaken}</b>
          {#if rowStates.damagePerfect}<em>Perfect</em>{/if}
        </div>
        <div class:perfect={rowStates.fallsPerfect} class="result-row">
          <span>Falls</span>
          <b>{result.falls}</b>
          {#if rowStates.fallsPerfect}<em>Perfect</em>{/if}
        </div>
        <div class:perfect={rowStates.enemiesPerfect} class="result-row">
          <span>Enemies Defeated</span>
          <b>{result.enemiesDefeated} / {result.enemyTarget}</b>
          {#if rowStates.enemiesPerfect}<em>Perfect</em>{/if}
        </div>
        <div class:perfect={rowStates.checkpointsPerfect} class="result-row">
          <span>Checkpoints</span>
          <b>{result.checkpointsReached} / {result.checkpointTarget}</b>
          {#if rowStates.checkpointsPerfect}<em>Perfect</em>{/if}
        </div>
      </div>

      <div
        class="result-rank"
        class:rank-s={result.rank === 'S'}
        class:rank-a={result.rank === 'A'}
        class:rank-b={result.rank === 'B'}
        class:rank-c={result.rank === 'C'}
        class:rank-d={result.rank === 'D'}
      >
        <span>Final Evaluation</span>
        <strong>{result.rank}</strong>
      </div>
    </div>

    <div class="result-actions">
      {#each actions as action, index}
        <button
          type="button"
          class:active={selectedAction === index}
          class:locked={action.disabled}
          disabled={action.disabled}
          onclick={() => activateAction(action.type, action.disabled)}
          onmouseenter={() => onSelectAction(index)}
        >
          {actionLabel(action.type)}
        </button>
      {/each}
    </div>
  </div>
</section>

<style>
  .stage-result {
    position: absolute;
    inset: 0;
    z-index: 25;
    overflow: hidden;
    pointer-events: auto;
    color: #f5fbff;
    font-family: system-ui, sans-serif;
  }

  .result-veil {
    position: absolute;
    inset: 0;
    background: rgba(3, 8, 18, 0.68);
    backdrop-filter: blur(0.42cqw);
    animation: result-veil-in 500ms ease both;
  }

  .result-hero {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 27cqw;
    height: 100cqh;
    animation: result-hero-in 650ms 160ms ease both;
  }

  .result-hero img {
    position: absolute;
    left: 1.2cqw;
    bottom: 0;
    width: 25cqw;
    height: 86cqh;
    object-fit: contain;
    object-position: bottom center;
    mask-image: linear-gradient(90deg, #000 78%, transparent);
  }

  .result-hero div {
    position: absolute;
    left: 3cqw;
    bottom: 7cqh;
    display: grid;
    gap: 0.4cqh;
    text-transform: uppercase;
  }

  .result-hero strong {
    font-size: 1.45cqw;
  }

  .result-hero span {
    color: #ffd978;
    font-size: 0.8cqw;
  }

  .result-content {
    position: absolute;
    inset: 0 2.2cqw 0 27cqw;
  }

  .result-banner {
    position: absolute;
    top: 4.2cqh;
    left: 50%;
    width: 48cqw;
    height: 10.8cqh;
    display: grid;
    place-items: center;
    clip-path: polygon(6% 0, 94% 0, 100% 50%, 94% 100%, 6% 100%, 0 50%);
    background: linear-gradient(180deg, rgba(58, 198, 255, 0.94), rgba(23, 83, 170, 0.94));
    border: 0.12cqw solid rgba(212, 240, 255, 0.8);
    box-shadow: 0 1.2cqh 3cqh rgba(0, 18, 54, 0.42);
    font-size: 2.2cqw;
    font-weight: 900;
    text-transform: uppercase;
    transform: translateX(-50%);
    animation: result-banner-in 520ms 260ms ease both;
  }

  .result-stage-name {
    position: absolute;
    top: 16.7cqh;
    left: 50%;
    display: grid;
    justify-items: center;
    gap: 0.4cqh;
    transform: translateX(-50%);
    text-transform: uppercase;
  }

  .result-stage-name strong {
    font-size: 1.45cqw;
  }

  .result-stage-name span {
    color: #ffd978;
    font-size: 0.92cqw;
  }

  .result-board {
    position: absolute;
    top: 23cqh;
    left: 0;
    right: 0;
    height: 43cqh;
    display: grid;
    grid-template-columns: 1fr 20cqw;
    gap: 1.2cqw;
    padding: 2cqh 1.4cqw;
    background: rgba(8, 20, 46, 0.78);
    border: 0.12cqw solid rgba(157, 217, 255, 0.5);
    box-shadow: inset 0 0 0 0.08cqw rgba(255, 255, 255, 0.16);
    animation: result-board-in 520ms 360ms ease both;
  }

  .result-stats {
    display: grid;
    gap: 0.82cqh;
  }

  .result-row {
    display: grid;
    grid-template-columns: 1fr auto 6.8cqw;
    align-items: center;
    min-height: 5.4cqh;
    padding: 0 1cqw;
    background: rgba(255, 255, 255, 0.075);
    border-left: 0.22cqw solid rgba(76, 218, 255, 0.7);
    font-size: 0.95cqw;
    animation: result-row-in 420ms ease both;
  }

  .result-row b {
    font-size: 1.15cqw;
  }

  .result-row em {
    color: #ffd978;
    font-size: 0.72cqw;
    font-style: normal;
    text-align: right;
    text-transform: uppercase;
  }

  .result-row.perfect {
    border-left-color: #ffd978;
  }

  .result-rank {
    align-self: center;
    justify-self: center;
    width: 16cqw;
    aspect-ratio: 1;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.18), rgba(24, 80, 150, 0.9));
    border: 0.18cqw solid rgba(255, 255, 255, 0.65);
    text-transform: uppercase;
  }

  .result-rank span {
    font-size: 0.78cqw;
  }

  .result-rank strong {
    font-size: 6cqw;
    line-height: 1;
  }

  .rank-s {
    color: #fff3a8;
    box-shadow: 0 0 3cqh rgba(255, 217, 92, 0.55);
  }

  .rank-a {
    color: #c8f7ff;
  }

  .rank-b,
  .rank-c,
  .rank-d {
    color: #f5fbff;
  }

  .result-actions {
    position: absolute;
    top: 70cqh;
    left: 50%;
    width: 52cqw;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1cqw;
    transform: translateX(-50%);
  }

  .result-actions button {
    height: 7.2cqh;
    border: 0.12cqw solid rgba(185, 232, 255, 0.7);
    background: rgba(15, 44, 92, 0.86);
    color: inherit;
    font-size: 1cqw;
    font-weight: 800;
    text-transform: uppercase;
  }

  .result-actions button.active,
  .result-actions button:hover:not(:disabled) {
    border-color: #ffd978;
    color: #ffd978;
  }

  .result-actions button.locked {
    opacity: 0.42;
  }

  @keyframes result-veil-in {
    from {
      opacity: 0;
    }

    to {
      opacity: 1;
    }
  }

  @keyframes result-hero-in {
    from {
      opacity: 0;
      transform: translateX(-4cqw);
    }

    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes result-banner-in {
    from {
      opacity: 0;
      transform: translate(-50%, -3cqh);
    }

    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }

  @keyframes result-board-in {
    from {
      opacity: 0;
      transform: translateY(3cqh);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes result-row-in {
    from {
      opacity: 0;
      transform: translateX(2cqw);
    }

    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
</style>
