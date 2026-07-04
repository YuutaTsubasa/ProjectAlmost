<script lang="ts">
  import type { GameplayHudState } from '../../domain/gameplay/gameplayHud'
  import {
    GAMEPLAY_HUD_PLAYER_PORTRAIT_SRC,
    type GameplayHudStageDisplay,
  } from './gameplayHudDisplay'

  type Props = {
    state: GameplayHudState
    stageDisplay: GameplayHudStageDisplay
    stageLabel?: string
  }

  let { state, stageDisplay }: Props = $props()

  function getHpWidthPercent() {
    if (state.hpMax <= 0) return 0
    return Math.max(0, Math.min(100, (state.hp / state.hpMax) * 100))
  }
</script>

<div class="gameplay-hud" aria-label="Gameplay HUD">
  <section class="hud-panel status-hud" aria-label="Player status">
    <span class="corner tl"></span>
    <span class="corner tr"></span>
    <span class="corner bl"></span>
    <span class="corner br"></span>
    <div class="hud-label"><span></span>System Status</div>
    <div class="status-body">
      <img class="portrait-slot" src={GAMEPLAY_HUD_PLAYER_PORTRAIT_SRC} alt="Yuuta Tsubasa" />
      <div class="status-info">
        <strong>Yuuta Tsubasa</strong>
        <div class="hp-heading">
          <span>HP</span>
          <b>{state.hp} / {state.hpMax}</b>
        </div>
        <div class="bar" aria-hidden="true">
          <i style:width={`${getHpWidthPercent()}%`}></i>
        </div>
      </div>
    </div>
  </section>

  <section class="stage-banner" aria-label="Stage">
    <div class="banner-fill">
      <span class="emblem" aria-hidden="true">
        <svg viewBox="0 0 26 52" fill="currentColor">
          <rect x="12" y="5" width="2" height="44" rx="1"></rect>
          <path d="M13 14c-5 0-8-3-9-8 6 0 9 3 9 8z"></path>
          <path d="M13 14c5 0 8-3 9-8-6 0-9 3-9 8z"></path>
          <path d="M13 24c-4.5 0-7-2.6-8-7 5.4 0 8 2.6 8 7z"></path>
          <path d="M13 24c4.5 0 7-2.6 8-7-5.4 0-8 2.6-8 7z"></path>
        </svg>
      </span>
      <div>
        <strong>{stageDisplay.worldLabel} {stageDisplay.stageId}</strong>
        <span>{stageDisplay.stageSubtitle}</span>
      </div>
      <span class="emblem flip" aria-hidden="true">
        <svg viewBox="0 0 26 52" fill="currentColor">
          <rect x="12" y="5" width="2" height="44" rx="1"></rect>
          <path d="M13 14c-5 0-8-3-9-8 6 0 9 3 9 8z"></path>
          <path d="M13 14c5 0 8-3 9-8-6 0-9 3-9 8z"></path>
          <path d="M13 24c-4.5 0-7-2.6-8-7 5.4 0 8 2.6 8 7z"></path>
          <path d="M13 24c4.5 0 7-2.6 8-7-5.4 0-8 2.6-8 7z"></path>
        </svg>
      </span>
    </div>
  </section>

  <section class="hud-panel map-hud" aria-label="Mini map">
    <span class="corner tr"></span>
    <span class="corner bl"></span>
    <div class="hud-label"><span></span>Map Overview</div>
    <div class="mini-map">
      <svg viewBox="0 0 100 36" aria-label="Stage map">
        {#each state.mapPlatforms as platform}
          <line
            class="map-platform"
            x1={platform.x * 100}
            y1={platform.y * 36}
            x2={(platform.x + platform.width) * 100}
            y2={platform.y * 36}
          ></line>
        {/each}
        {#each state.checkpointMarkers as checkpoint, index}
          <path
            class="map-checkpoint"
            class:active={index <= state.activeCheckpointIndex}
            d={`M${checkpoint.x * 100} ${checkpoint.y * 36} V${checkpoint.y * 36 - 6} M${checkpoint.x * 100 - 1.7} ${checkpoint.y * 36 - 6} H${checkpoint.x * 100 + 1.7} V${checkpoint.y * 36 - 3} H${checkpoint.x * 100 - 1.7} Z`}
          ></path>
        {/each}
        <circle class="map-player" cx={state.playerProgress * 100} cy={state.playerProgressY * 36} r="2.4"></circle>
        {#each state.enemyMarkers as enemy}
          <circle class="map-enemy" cx={enemy.x * 100} cy={enemy.y * 36} r="1.4"></circle>
        {/each}
        <path class="map-goal" d={`M${state.goalProgress * 100} 9.1 V2 M${state.goalProgress * 100} 2 L${state.goalProgress * 100 - 6} 4.5 L${state.goalProgress * 100} 7`}></path>
      </svg>
    </div>
  </section>

  <section class="hud-panel objective-hud" aria-label="Objective">
    <span class="corner tl"></span>
    <span class="corner br"></span>
    <div class="hud-label"><span></span>Objective</div>
    <p>{state.cleared ? 'Stage clear' : 'Reach the goal'}</p>
  </section>

  <section class="bottom-hud" aria-label="Gameplay statistics and controls">
    <div class="bottom-fill">
      <div class="skill-group">
        <div class="hud-label"><span></span>Controls</div>
        <div class="skills">
          <div><b>← →</b><span>Move</span></div>
          <div><b>Space ×2</b><span>Jump</span></div>
          <div><b>↓ / S</b><span>Crouch</span></div>
          <div><b>J</b><span>Attack</span></div>
          <div><b>Air + J</b><span>Homing</span></div>
        </div>
      </div>
      <div class="readouts">
        <div><span>Time</span><b>{state.time}</b></div>
        <div><span>Coins</span><b>{state.coins} <small>/ {state.coinTarget}</small></b></div>
        <div><span>Damage</span><b>{state.damageTaken}</b></div>
        <div><span>Falls</span><b>{state.falls}</b></div>
        <div><span>Enemies</span><b>{state.enemiesDefeated} <small>/ {state.enemyTarget}</small></b></div>
        <div><span>Checkpoints</span><b>{state.checkpointsReached} <small>/ {state.checkpointTarget}</small></b></div>
        <div class="live-rank"><span>Rank</span><b>{state.rank}</b></div>
      </div>
    </div>
  </section>
</div>

<style>
  .gameplay-hud {
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
    --hud-gold: #f3c64d;
    --hud-gold-deep: #c5891f;
    --hud-gold-bright: #ffe6a0;
    position: absolute;
    inset: 0;
    z-index: 5;
    pointer-events: none;
    color: var(--hud-ink);
    font-family: Rajdhani, Verdana, Geneva, sans-serif;
    font-weight: 600;
  }

  .hud-panel {
    position: absolute;
    border: 1.5px solid var(--hud-line);
    border-radius: 8px;
    background: var(--hud-panel);
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.85) inset,
      0 0 0 1px rgba(255, 255, 255, 0.4),
      0 18px 40px -22px rgba(20, 49, 95, 0.7);
    backdrop-filter: blur(7px) saturate(125%);
  }

  .hud-panel::after {
    content: "";
    position: absolute;
    inset: 4px;
    border: 1px solid var(--hud-line-soft);
    border-radius: 5px;
    pointer-events: none;
  }

  .corner {
    position: absolute;
    z-index: 2;
    width: 10px;
    height: 12px;
    border: 2px solid var(--accent-bright);
    opacity: 0.9;
  }

  .corner.tl { top: 5px; left: 5px; border-right: 0; border-bottom: 0; }
  .corner.tr { top: 5px; right: 5px; border-left: 0; border-bottom: 0; }
  .corner.bl { bottom: 5px; left: 5px; border-right: 0; border-top: 0; }
  .corner.br { right: 5px; bottom: 5px; border-left: 0; border-top: 0; }

  .hud-label {
    display: flex;
    gap: 0.63cqw;
    align-items: center;
    color: var(--hud-soft);
    font-size: clamp(10px, 0.72cqw, 14px);
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .hud-label span {
    width: 0.63cqw;
    height: 0.63cqw;
    rotate: 45deg;
    background: var(--accent-bright);
    box-shadow: 0 0 6px var(--glow);
  }

  .status-hud {
    top: 2.2cqh;
    left: 1.25cqw;
    width: min(360px, 28.1cqw);
    padding: 2.1cqh 1.25cqw 1.95cqh;
  }

  .status-body {
    display: flex;
    gap: 1.1cqw;
    margin-top: 1.67cqh;
  }

  .portrait-slot {
    flex: none;
    width: clamp(58px, 5.4cqw, 104px);
    aspect-ratio: 1;
    object-fit: cover;
    object-position: 50% 36%;
    border: 2px solid var(--hud-line);
    border-radius: 8px;
    background: var(--accent-pale);
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.45);
  }

  .status-info {
    flex: 1;
    min-width: 0;
  }

  .status-info strong {
    display: block;
    overflow-wrap: anywhere;
    color: var(--hud-ink);
    font-size: clamp(18px, 1.35cqw, 26px);
    line-height: 1;
  }

  .hp-heading {
    display: flex;
    justify-content: space-between;
    gap: 0.94cqw;
    align-items: baseline;
    margin-top: 1.95cqh;
    color: var(--hud-ink);
    font-size: clamp(12px, 0.85cqw, 16px);
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .hp-heading b {
    font-size: clamp(15px, 1.05cqw, 20px);
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.03em;
    white-space: nowrap;
  }

  .bar {
    height: 1.1cqh;
    margin-top: 0.83cqh;
    overflow: hidden;
    border: 1px solid rgba(226, 87, 76, 0.36);
    border-radius: 999px;
    background: rgba(226, 87, 76, 0.14);
  }

  .bar i {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #e2574c, #ffb0a7);
  }

  .stage-banner {
    position: absolute;
    top: 2.2cqh;
    left: 50%;
    width: min(680px, 38cqw);
    height: clamp(72px, 9.7cqh, 104px);
    transform: translateX(-50%);
    animation: none;
    clip-path: polygon(18px 0, calc(100% - 18px) 0, 100% 18px, 100% calc(100% - 18px), calc(100% - 18px) 100%, 18px 100%, 0 calc(100% - 18px), 0 18px);
    background: var(--hud-line);
    filter: drop-shadow(0 16px 30px rgba(20, 49, 95, 0.4));
  }

  .banner-fill {
    position: absolute;
    inset: 1px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.4cqw;
    clip-path: inherit;
    background: linear-gradient(180deg, var(--accent-bright), var(--accent) 45%, var(--accent-deep));
    color: #fff;
    text-align: center;
    box-shadow: 0 2px 0 rgba(255, 255, 255, 0.35) inset;
  }

  .banner-fill strong {
    display: block;
    font-size: clamp(24px, 2.2cqw, 44px);
    font-weight: 700;
    letter-spacing: 0.04em;
    line-height: 1;
    text-transform: uppercase;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.28);
  }

  .banner-fill > div span {
    display: block;
    margin-top: 0.83cqh;
    color: var(--hud-gold-bright);
    font-size: clamp(11px, 0.85cqw, 16px);
    font-weight: 700;
    letter-spacing: 0.26em;
    text-transform: uppercase;
  }

  .emblem {
    display: block;
    flex: none;
    width: 1.25cqw;
    height: 4.45cqh;
    color: #fff;
    opacity: 0.9;
    filter: drop-shadow(0 0 6px color-mix(in srgb, var(--glow) 70%, transparent));
  }

  .emblem svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  .emblem.flip {
    transform: scaleX(-1);
  }

  .map-hud {
    top: 2.2cqh;
    right: 1.25cqw;
    width: min(338px, 24cqw);
    padding: 1.67cqh 1cqw 1.95cqh;
  }

  .mini-map {
    position: relative;
    height: clamp(58px, 7.4cqh, 80px);
    margin-top: 1.4cqh;
    overflow: hidden;
    border: 1px solid var(--hud-line-soft);
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.56);
  }

  .mini-map::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      linear-gradient(90deg, rgba(47, 111, 208, 0.09) 1px, transparent 1px),
      linear-gradient(0deg, rgba(47, 111, 208, 0.09) 1px, transparent 1px);
    background-size: 14px 14px;
  }

  .mini-map svg {
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .map-platform {
    fill: none;
    stroke: var(--accent);
    stroke-linecap: square;
    stroke-width: 2.2;
    filter: drop-shadow(0 0 2px rgba(21, 156, 230, 0.45));
  }

  .map-checkpoint {
    fill: rgba(47, 111, 208, 0.18);
    stroke: rgba(47, 111, 208, 0.55);
    stroke-width: 0.65;
  }

  .map-checkpoint.active {
    fill: var(--hud-gold);
    stroke: var(--hud-gold-deep);
  }

  .map-player {
    fill: #fff;
    stroke: var(--accent);
    stroke-width: 1.4;
    filter: drop-shadow(0 0 2px var(--accent));
    transition: cx 100ms linear, cy 100ms linear;
  }

  .map-enemy {
    fill: #e2574c;
    stroke: #fff;
    stroke-width: 0.8;
  }

  .map-goal {
    fill: none;
    stroke: var(--hud-gold-deep);
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.7;
  }

  .objective-hud {
    top: 20.8cqh;
    right: 1.25cqw;
    width: min(338px, 24cqw);
    padding: 1.67cqh 1.1cqw;
  }

  .objective-hud p {
    margin: 1.25cqh 0 0;
    color: var(--hud-ink);
    font-size: clamp(13px, 0.85cqw, 16px);
    font-weight: 700;
    line-height: 1.2;
  }

  .bottom-hud {
    position: absolute;
    right: 1.25cqw;
    bottom: 2.2cqh;
    left: 1.25cqw;
    height: clamp(112px, 13.8cqh, 148px);
    clip-path: polygon(16px 0, calc(100% - 16px) 0, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0 calc(100% - 16px), 0 16px);
    background: var(--hud-line);
    filter: drop-shadow(0 14px 28px rgba(20, 49, 95, 0.32));
  }

  .bottom-fill {
    position: absolute;
    inset: 1px;
    display: grid;
    grid-template-columns: minmax(260px, 23cqw) 1fr;
    clip-path: inherit;
    background: var(--hud-panel);
    backdrop-filter: blur(7px) saturate(125%);
  }

  .skill-group,
  .readouts {
    min-width: 0;
    padding: 1.67cqh 1.25cqw;
  }

  .readouts {
    display: grid;
    grid-template-columns: 1.25fr repeat(2, minmax(0, 1fr)) 0.9fr;
    grid-template-rows: repeat(2, minmax(0, 1fr));
    gap: 1.4cqh 1.4cqw;
    align-items: center;
    border-left: 1px solid var(--hud-line-soft);
  }

  .skills {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 0.55cqw;
    margin-top: 1.4cqh;
  }

  .skills div {
    display: grid;
    min-width: 0;
    gap: 0.56cqh;
    justify-items: center;
  }

  .skills b {
    display: grid;
    width: 100%;
    min-height: 40px;
    place-items: center;
    border: 1px solid var(--hud-line);
    border-radius: 6px;
    background: linear-gradient(180deg, #fff, var(--accent-pale));
    color: var(--hud-ink);
    font-size: clamp(9px, 0.6cqw, 12px);
    line-height: 1;
    text-align: center;
  }

  .skills span,
  .readouts span {
    display: block;
    color: var(--hud-soft);
    font-size: clamp(9px, 0.68cqw, 13px);
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .readouts b {
    display: block;
    margin-top: 0.56cqh;
    color: var(--hud-ink);
    font-size: clamp(16px, 1.45cqw, 28px);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    white-space: nowrap;
  }

  .readouts small {
    color: var(--hud-soft);
    font-size: 0.62em;
  }

  .live-rank b {
    color: var(--hud-soft);
    font-size: clamp(24px, 2.25cqw, 43px);
    font-style: italic;
    line-height: 0.72;
  }

  @container (max-width: 900px) {
    .status-hud,
    .map-hud,
    .objective-hud {
      width: min(240px, calc(50cqw - 3.1cqw));
    }

    .stage-banner {
      top: 35.2cqh;
      right: 2.1cqw;
      left: 2.1cqw;
      width: auto;
      transform: none;
    }

    .objective-hud {
      top: auto;
      bottom: 31.5cqh;
    }

    .bottom-fill {
      grid-template-columns: 1fr;
    }

    .skill-group {
      display: none;
    }

    .readouts {
      grid-template-columns: repeat(4, minmax(0, 1fr));
      border-left: 0;
    }
  }
</style>
