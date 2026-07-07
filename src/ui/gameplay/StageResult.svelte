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

  const stageResultCopy = {
    resultTitle: 'Stage Result',
    hero: {
      name: 'Yuuta Tsubasa',
      role: 'Paladin Candidate',
    },
    stats: {
      clearTime: 'Clear Time',
      coins: 'Coins',
      damageTaken: 'Damage Taken',
      falls: 'Falls',
      enemiesDefeated: 'Enemies Defeated',
      checkpoints: 'Checkpoints',
      perfect: 'Perfect',
      newRecord: 'New Record',
    },
    rank: {
      label: 'Rank',
    },
    actions: {
      retry: 'Retry',
      stageSelect: 'Stage Select',
      nextStage: 'Next Stage',
      locked: 'Locked',
    },
  } as const

  const rowStates = $derived(getStageResultRowStates(result))
  const actions = $derived(getResultActionStates({ nextStageAvailable }))

  function actionLabel(type: StageResultActionType): string {
    if (type === 'retry') return stageResultCopy.actions.retry
    if (type === 'stage-select') return stageResultCopy.actions.stageSelect
    return stageResultCopy.actions.nextStage
  }

  function activateAction(type: StageResultActionType, disabled: boolean): void {
    if (disabled) return
    onAction(type)
  }

  function handleActionClick(index: number, type: StageResultActionType, disabled: boolean): void {
    onSelectAction(index)
    activateAction(type, disabled)
  }
</script>

<section class="stage-result" aria-label="Stage Result">
  <div class="result-veil"></div>
  <aside class="result-hero" aria-hidden="true">
    <img src="/assets/results/yuuta-stage-result-standee.webp" alt="" />
    <div>
      <strong>{stageResultCopy.hero.name}</strong>
      <span>{stageResultCopy.hero.role}</span>
    </div>
  </aside>

  <div class="result-content">
    <header class="result-banner">
      <span class="result-banner-star" aria-hidden="true">✦</span>
      <strong>{stageResultCopy.resultTitle}</strong>
      <span class="result-banner-star" aria-hidden="true">✦</span>
    </header>
    <div class="result-stage-name">
      <b>{stageDisplay.worldLabel} {stageDisplay.stageId}</b>
      <i class="result-stage-separator" aria-hidden="true"></i>
      <span>{stageDisplay.stageSubtitle}</span>
    </div>

    <div class="result-board">
      <div class="result-stats">
        <div class="result-row">
          <span>{stageResultCopy.stats.clearTime}</span>
          <b>{result.time}</b>
          <small>{stageResultCopy.stats.newRecord}</small>
        </div>
        <div class:perfect={rowStates.coinsPerfect} class="result-row">
          <span>{stageResultCopy.stats.coins}</span>
          <b>{result.coins}<em>/ {result.coinTarget}</em></b>
          <small class:perfect={rowStates.coinsPerfect}>{rowStates.coinsPerfect ? stageResultCopy.stats.perfect : ''}</small>
        </div>
        <div class:perfect={rowStates.damagePerfect} class="result-row">
          <span>{stageResultCopy.stats.damageTaken}</span>
          <b>{result.damageTaken}</b>
          <small class:perfect={rowStates.damagePerfect}>{rowStates.damagePerfect ? stageResultCopy.stats.perfect : ''}</small>
        </div>
        <div class:perfect={rowStates.fallsPerfect} class="result-row">
          <span>{stageResultCopy.stats.falls}</span>
          <b>{result.falls}</b>
          <small class:perfect={rowStates.fallsPerfect}>{rowStates.fallsPerfect ? stageResultCopy.stats.perfect : ''}</small>
        </div>
        <div class:perfect={rowStates.enemiesPerfect} class="result-row">
          <span>{stageResultCopy.stats.enemiesDefeated}</span>
          <b>{result.enemiesDefeated}<em>/ {result.enemyTarget}</em></b>
          <small class:perfect={rowStates.enemiesPerfect}>{rowStates.enemiesPerfect ? stageResultCopy.stats.perfect : ''}</small>
        </div>
        <div class:perfect={rowStates.checkpointsPerfect} class="result-row">
          <span>{stageResultCopy.stats.checkpoints}</span>
          <b>{result.checkpointsReached}<em>/ {result.checkpointTarget}</em></b>
          <small class:perfect={rowStates.checkpointsPerfect}>{rowStates.checkpointsPerfect ? stageResultCopy.stats.perfect : ''}</small>
        </div>
      </div>

      <div class="result-rank">
        <span>{stageResultCopy.rank.label}</span>
        <div
          class="result-rank-badge"
          class:rank-s={result.rank === 'S'}
          class:rank-a={result.rank === 'A'}
          class:rank-b={result.rank === 'B'}
          class:rank-c={result.rank === 'C'}
          class:rank-d={result.rank === 'D'}
        >
          <b>{result.rank}</b>
        </div>
      </div>
    </div>

    <div class="result-actions">
      {#each actions as action, index}
        <button
          type="button"
          class:active={selectedAction === index}
          class:locked={action.disabled}
          disabled={action.disabled}
          onclick={() => handleActionClick(index, action.type, action.disabled)}
          onmouseenter={() => onSelectAction(index)}
        >
          <b>{actionLabel(action.type)}</b>
          {#if action.disabled}<span>{stageResultCopy.actions.locked}</span>{/if}
        </button>
      {/each}
    </div>
  </div>
</section>

<style>
  .stage-result {
    --accent: #2f6fd0;
    --accent-deep: color-mix(in oklab, var(--accent) 66%, #06122c);
    --accent-bright: color-mix(in oklab, var(--accent) 52%, #ffffff);
    --accent-pale: color-mix(in oklab, var(--accent) 16%, #ffffff);
    --glow: color-mix(in oklab, var(--accent) 40%, #ffffff);
    --hud-ink: color-mix(in oklab, var(--accent) 64%, #08152e);
    --hud-soft: color-mix(in oklab, var(--accent) 50%, #38507a);
    --hud-line: color-mix(in srgb, var(--accent) 55%, transparent);
    --hud-line-soft: color-mix(in srgb, var(--accent) 30%, transparent);
    --hud-panel: color-mix(in srgb, color-mix(in srgb, var(--accent) 13%, #ffffff) 72%, transparent);
    --hud-gold-bright: #ffe7a3;
    --hud-gold-deep: #b78313;
    position: absolute;
    inset: 0;
    z-index: 25;
    overflow: hidden;
    pointer-events: auto;
    color: var(--hud-ink);
    font-family: var(--body, "Rajdhani", "Segoe UI", system-ui, sans-serif);
    font-weight: 600;
  }

  .result-veil {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(90deg, rgba(234, 247, 255, 0.9) 0 27%, rgba(234, 247, 255, 0.45) 48%, rgba(226, 243, 255, 0.72)),
      rgba(236, 248, 255, 0.48);
    backdrop-filter: blur(0.32cqw) saturate(78%);
    animation: result-veil-in 500ms ease-out both;
  }

  .result-hero {
    position: absolute;
    inset: 0 auto 0 0;
    z-index: 2;
    width: 27cqw;
    overflow: hidden;
    mask-image: linear-gradient(90deg, #000 80%, transparent);
    animation: result-hero-in 650ms 160ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
  }

  .result-hero::after {
    content: "";
    position: absolute;
    inset: auto 0 0;
    height: 28%;
    background: linear-gradient(0deg, rgba(18, 59, 131, 0.72), transparent);
  }

  .result-hero img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center bottom;
    filter: drop-shadow(0 0.75cqh 1.7cqh rgba(20, 49, 95, 0.2));
  }

  .result-hero div {
    position: absolute;
    bottom: 4cqh;
    left: 2.1cqw;
    z-index: 2;
    display: block;
    color: #fff;
    text-transform: uppercase;
  }

  .result-hero strong,
  .result-hero span {
    display: block;
  }

  .result-hero strong {
    font-size: min(1.75cqw, 34px);
    letter-spacing: 0.06em;
    text-shadow: 0 0.24cqh 0.75cqh rgba(8, 18, 40, 0.65);
  }

  .result-hero span {
    margin-top: 0.5cqh;
    color: var(--hud-gold-bright);
    font-size: min(0.68cqw, 13px);
    font-weight: 700;
    letter-spacing: 0.25em;
  }

  .result-content {
    position: absolute;
    inset: 0 2.2cqw 0 27cqw;
    z-index: 3;
  }

  .result-banner {
    position: absolute;
    top: 4.2cqh;
    left: 50%;
    display: flex;
    width: 48cqw;
    height: 10.8cqh;
    gap: 1.7cqw;
    align-items: center;
    justify-content: center;
    transform: translateX(-50%);
    clip-path: polygon(0 50%, 1.6cqw 0, calc(100% - 1.6cqw) 0, 100% 50%, calc(100% - 1.6cqw) 100%, 1.6cqw 100%);
    background: linear-gradient(180deg, var(--accent-bright), var(--accent) 48%, var(--accent-deep));
    color: #fff;
    filter: drop-shadow(0 1.55cqh 2.6cqh rgba(20, 49, 95, 0.42));
    animation: result-banner-in 500ms 100ms cubic-bezier(0.2, 0.85, 0.2, 1.1) both;
  }

  .result-banner strong {
    font-size: min(3.3cqw, 64px);
    letter-spacing: 0.13em;
    line-height: 1;
    text-transform: uppercase;
  }

  .result-banner-star {
    color: var(--hud-gold-bright);
    font-size: min(1.4cqw, 27px);
  }

  .result-stage-name {
    position: absolute;
    top: 16.7cqh;
    right: 0;
    left: 0;
    display: flex;
    gap: 1cqw;
    align-items: center;
    justify-content: center;
    text-align: center;
    text-transform: uppercase;
    animation: result-row-in 400ms 260ms ease-out both;
  }

  .result-stage-name b {
    font-size: min(1.2cqw, 23px);
    letter-spacing: 0.14em;
    white-space: nowrap;
  }

  .result-stage-name span {
    color: var(--hud-gold-deep);
    font-size: min(0.83cqw, 16px);
    font-weight: 700;
    letter-spacing: 0.25em;
    white-space: nowrap;
  }

  .result-stage-separator {
    width: 0.42cqw;
    height: 0.42cqw;
    rotate: 45deg;
    background: var(--accent-bright);
    box-shadow: 0 0 0.6cqh var(--glow);
  }

  .result-board {
    position: absolute;
    top: 23cqh;
    right: 0;
    left: 0;
    display: grid;
    height: 43cqh;
    grid-template-columns: 1fr 20cqw;
    padding: 1.2cqh 1cqw 1.2cqh 1.4cqw;
    border: 1.5px solid var(--hud-line);
    border-radius: 0.6cqw;
    background: color-mix(in srgb, var(--hud-panel) 92%, white);
    box-shadow: 0 1px 0 #fff inset, 0 2.2cqh 4.6cqh -2.6cqh rgba(20, 49, 95, 0.65);
    backdrop-filter: blur(0.75cqw) saturate(120%);
    animation: result-board-in 520ms 330ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
  }

  .result-stats {
    display: grid;
    align-content: center;
    padding-right: 1.5cqw;
  }

  .result-row {
    display: grid;
    min-height: 5.9cqh;
    grid-template-columns: 1fr auto 8.5cqw;
    gap: 0.8cqw;
    align-items: center;
    border-bottom: 1px solid var(--hud-line-soft);
    animation: result-row-in 360ms ease-out both;
  }

  .result-row:nth-child(1) { animation-delay: 520ms; }
  .result-row:nth-child(2) { animation-delay: 590ms; }
  .result-row:nth-child(3) { animation-delay: 660ms; }
  .result-row:nth-child(4) { animation-delay: 730ms; }
  .result-row:nth-child(5) { animation-delay: 800ms; }
  .result-row:nth-child(6) {
    border-bottom: 0;
    animation-delay: 870ms;
  }

  .result-row span {
    font-size: min(1.1cqw, 21px);
    font-weight: 700;
    letter-spacing: 0.09em;
    text-transform: uppercase;
  }

  .result-row b {
    color: var(--accent-deep);
    font: 700 min(2cqw, 38px)/1 Rajdhani, sans-serif;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.03em;
    white-space: nowrap;
  }

  .result-row em {
    margin-left: 0.3cqw;
    color: var(--hud-soft);
    font: 0.56em Rajdhani, sans-serif;
    font-style: normal;
  }

  .result-row small {
    min-height: 1em;
    color: var(--hud-gold-deep);
    font-size: min(0.63cqw, 12px);
    font-weight: 700;
    letter-spacing: 0.12em;
    text-align: right;
    text-transform: uppercase;
  }

  .result-row small.perfect {
    color: var(--hud-gold-deep);
  }

  .result-rank {
    box-sizing: border-box;
    display: grid;
    margin-block: 2.4cqh;
    padding-block: 1.8cqh;
    align-content: center;
    justify-items: center;
    border-left: 1px solid var(--hud-line-soft);
    text-transform: uppercase;
  }

  .result-rank > span {
    font-size: min(1.15cqw, 22px);
    font-weight: 700;
    letter-spacing: 0.25em;
  }

  .result-rank-badge {
    display: grid;
    width: 11cqw;
    aspect-ratio: 1;
    margin: 2.2cqh 0;
    place-items: center;
    border: 1px solid var(--hud-line-soft);
    border-radius: 50%;
    box-shadow: 0 0 0 0.35cqw rgba(255, 255, 255, 0.38) inset, 0 0 2.2cqh var(--glow);
    animation: eval-pulse 1.5s ease-in-out infinite;
  }

  .result-rank-badge.rank-s {
    border-color: rgba(197, 137, 31, 0.55);
    box-shadow: 0 0 0 0.35cqw rgba(255, 230, 160, 0.32) inset, 0 0 2.6cqh rgba(243, 198, 77, 0.75);
  }

  .result-rank-badge.rank-a {
    border-color: rgba(16, 159, 200, 0.55);
    box-shadow: 0 0 0 0.35cqw rgba(173, 240, 255, 0.3) inset, 0 0 2.6cqh rgba(16, 159, 200, 0.62);
  }

  .result-rank-badge.rank-b {
    border-color: rgba(47, 111, 208, 0.55);
    box-shadow: 0 0 0 0.35cqw rgba(174, 211, 255, 0.3) inset, 0 0 2.6cqh rgba(47, 111, 208, 0.62);
  }

  .result-rank-badge.rank-c {
    border-color: rgba(116, 136, 159, 0.55);
    box-shadow: 0 0 0 0.35cqw rgba(223, 232, 240, 0.34) inset, 0 0 2.2cqh rgba(116, 136, 159, 0.5);
  }

  .result-rank-badge.rank-d {
    border-color: rgba(214, 83, 83, 0.55);
    box-shadow: 0 0 0 0.35cqw rgba(255, 195, 195, 0.28) inset, 0 0 2.4cqh rgba(214, 83, 83, 0.58);
  }

  .result-rank b {
    color: var(--accent);
    font-size: min(4.8cqw, 92px);
    letter-spacing: 0.08em;
  }

  .result-actions {
    position: absolute;
    top: 70cqh;
    right: 0;
    left: 0;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.2cqw;
    animation: result-row-in 450ms 900ms ease-out both;
  }

  .result-actions button {
    position: relative;
    display: grid;
    height: 8cqh;
    place-items: center;
    border: 1.5px solid var(--hud-line);
    border-radius: 0.38cqw;
    background: color-mix(in srgb, var(--hud-panel) 94%, white);
    color: var(--hud-ink);
    cursor: pointer;
    backdrop-filter: blur(0.65cqw);
  }

  .result-actions button.active,
  .result-actions button:hover:not(:disabled) {
    border-color: var(--accent);
    background: linear-gradient(180deg, #fff, var(--accent-pale));
    box-shadow: 0 0 1.7cqh rgba(47, 111, 208, 0.28);
    translate: 0 -0.35cqh;
  }

  .result-actions button.locked {
    opacity: 0.45;
    cursor: default;
  }

  .result-actions b {
    font-size: min(1.2cqw, 23px);
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .result-actions span {
    position: absolute;
    bottom: 0.4cqh;
    color: var(--hud-soft);
    font-size: min(0.68cqw, 13px);
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
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

  @keyframes eval-pulse {
    0%,
    100% {
      transform: scale(1);
    }

    50% {
      transform: scale(1.02);
    }
  }
</style>
