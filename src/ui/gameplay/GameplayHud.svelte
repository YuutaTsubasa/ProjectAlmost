<script lang="ts">
  import type { GameplayHudState } from '../../domain/gameplay/gameplayHud'

  type Props = {
    state: GameplayHudState
    stageLabel: string
  }

  let { state, stageLabel }: Props = $props()

  function getHpWidthPercent() {
    if (state.hpMax <= 0) return 0
    return Math.max(0, Math.min(100, (state.hp / state.hpMax) * 100))
  }
</script>

<div class="gameplay-hud" aria-label="Gameplay HUD">
  <section class="hud-status-panel" aria-label="Player status">
    <span class="hud-kicker">STATUS</span>
    <div class="hud-status-title">PLAYER</div>
    <div class="hud-hp-row">
      <span>HP</span>
      <b>{state.hp} / {state.hpMax}</b>
    </div>
    <div class="hud-hp-bar" aria-hidden="true">
      <i style:width={`${getHpWidthPercent()}%`}></i>
    </div>
  </section>

  <section class="hud-stage-banner" aria-label="Stage">
    <strong>{stageLabel}</strong>
    <span>{state.cleared ? 'CLEAR' : 'REACH GOAL'}</span>
  </section>

  <section class="hud-map-panel" aria-label="Mini map">
    <span class="hud-kicker">MAP</span>
    <svg class="hud-mini-map" viewBox="0 0 100 36" aria-hidden="true">
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

      <path
        class="map-goal"
        d={`M${state.goalProgress * 100} 9.1 V2 M${state.goalProgress * 100} 2 L${state.goalProgress * 100 - 6} 4.5 L${state.goalProgress * 100} 7`}
      ></path>
    </svg>
  </section>

  <section class="hud-objective-panel" aria-label="Objective">
    <span class="hud-kicker">OBJECTIVE</span>
    <p>{state.cleared ? 'Stage clear' : 'Reach the goal'}</p>
  </section>

  <section class="hud-readouts" aria-label="Gameplay statistics">
    <div><span>TIME</span><b>{state.time}</b></div>
    <div><span>COINS</span><b>{state.coins} / {state.coinTarget}</b></div>
    <div><span>DAMAGE</span><b>{state.damageTaken}</b></div>
    <div><span>FALLS</span><b>{state.falls}</b></div>
    <div><span>ENEMIES</span><b>{state.enemiesDefeated} / {state.enemyTarget}</b></div>
    <div><span>CHECKPOINTS</span><b>{state.checkpointsReached} / {state.checkpointTarget}</b></div>
  </section>
</div>

<style>
  .gameplay-hud {
    --hud-accent: #2f6fd0;
    --hud-accent-soft: rgba(47, 111, 208, 0.28);
    --hud-gold: #f3c64d;
    --hud-ink: #16345c;
    --hud-panel: rgba(242, 250, 255, 0.86);
    position: absolute;
    inset: 0;
    z-index: 5;
    pointer-events: none;
    color: var(--hud-ink);
    font-family: Rajdhani, 'Segoe UI', system-ui, sans-serif;
    font-weight: 700;
  }

  .hud-status-panel,
  .hud-map-panel,
  .hud-objective-panel,
  .hud-readouts,
  .hud-stage-banner {
    position: absolute;
    border: 1px solid rgba(47, 111, 208, 0.44);
    border-radius: 8px;
    background: var(--hud-panel);
    box-shadow: 0 18px 40px -26px rgba(8, 32, 74, 0.72);
    backdrop-filter: blur(7px) saturate(125%);
  }

  .hud-kicker {
    display: block;
    color: rgba(22, 52, 92, 0.68);
    font-size: 11px;
    letter-spacing: 0.16em;
  }

  .hud-status-panel {
    top: 16px;
    left: 16px;
    width: min(280px, 24vw);
    padding: 12px 14px;
  }

  .hud-status-title {
    margin-top: 8px;
    color: var(--hud-accent);
    font-size: clamp(16px, 1.8vw, 22px);
    line-height: 1;
  }

  .hud-hp-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-top: 14px;
    font-size: 15px;
  }

  .hud-hp-bar {
    height: 8px;
    margin-top: 7px;
    overflow: hidden;
    border-radius: 999px;
    background: rgba(226, 87, 76, 0.16);
  }

  .hud-hp-bar i {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #e2574c, #ffb0a7);
  }

  .hud-stage-banner {
    top: 16px;
    left: 50%;
    width: min(360px, 34vw);
    padding: 10px 16px;
    transform: translateX(-50%);
    text-align: center;
    color: #fff;
    background: linear-gradient(180deg, #5ba3f0, #2f6fd0 54%, #16345c);
  }

  .hud-stage-banner strong {
    display: block;
    font-size: clamp(18px, 2.2vw, 28px);
    line-height: 1;
    letter-spacing: 0.08em;
  }

  .hud-stage-banner span {
    color: #ffe6a0;
    font-size: 11px;
    letter-spacing: 0.18em;
  }

  .hud-map-panel {
    top: 16px;
    right: 16px;
    width: min(260px, 22vw);
    padding: 11px 12px 12px;
  }

  .hud-mini-map {
    display: block;
    width: 100%;
    height: auto;
    margin-top: 10px;
    border-radius: 6px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.6), rgba(215, 233, 255, 0.5));
  }

  .map-platform {
    stroke: rgba(22, 52, 92, 0.38);
    stroke-linecap: round;
    stroke-width: 1.3;
  }

  .map-checkpoint {
    fill: rgba(243, 198, 77, 0.42);
    stroke: rgba(22, 52, 92, 0.48);
    stroke-width: 0.75;
  }

  .map-checkpoint.active {
    fill: rgba(243, 198, 77, 0.92);
  }

  .map-player {
    fill: var(--hud-accent);
    stroke: #fff;
    stroke-width: 0.9;
  }

  .map-enemy {
    fill: #d9534f;
  }

  .map-goal {
    fill: none;
    stroke: var(--hud-gold);
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.4;
  }

  .hud-objective-panel {
    right: 16px;
    bottom: 104px;
    width: min(260px, 22vw);
    padding: 12px;
  }

  .hud-objective-panel p {
    margin: 8px 0 0;
    font-size: 14px;
  }

  .hud-readouts {
    left: 16px;
    right: 16px;
    bottom: 16px;
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 10px;
    padding: 12px;
  }

  .hud-readouts div {
    min-width: 0;
  }

  .hud-readouts span {
    display: block;
    color: rgba(22, 52, 92, 0.68);
    font-size: 11px;
    letter-spacing: 0.12em;
  }

  .hud-readouts b {
    display: block;
    margin-top: 6px;
    font-size: clamp(14px, 1.6vw, 18px);
    line-height: 1.1;
  }

  @media (max-width: 900px) {
    .hud-status-panel,
    .hud-map-panel,
    .hud-objective-panel,
    .hud-stage-banner,
    .hud-readouts {
      transform: none;
    }

    .hud-status-panel,
    .hud-map-panel,
    .hud-objective-panel {
      width: min(240px, calc(50vw - 24px));
    }

    .hud-stage-banner {
      width: min(300px, calc(100vw - 32px));
    }

    .hud-objective-panel {
      bottom: 136px;
    }

    .hud-readouts {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
</style>
