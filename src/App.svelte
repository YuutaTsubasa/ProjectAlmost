<script lang="ts">
  import { onMount } from 'svelte'
  import { createPlatformerGame } from './game/createGame'

  type HudState = {
    hp: number
    hpMax: number
    coins: number
    coinTarget: number
    time: string
    objective: string
    cleared: boolean
  }

  let gameHost: HTMLDivElement
  let hud: HudState = {
    hp: 3,
    hpMax: 3,
    coins: 0,
    coinTarget: 100,
    time: '00:00.00',
    objective: 'Move: A/D or arrows  Jump: W/Space  Attack: J/Z  Homing: jump + attack',
    cleared: false,
  }

  function handleHudEvent(event: Event) {
    const next = (event as CustomEvent<Partial<HudState>>).detail
    hud = { ...hud, ...next }
  }

  onMount(() => {
    window.addEventListener('projectrun:hud', handleHudEvent)
    const game = createPlatformerGame(gameHost)

    return () => {
      window.removeEventListener('projectrun:hud', handleHudEvent)
      game.destroy(true)
    }
  })
</script>

<main class="shell">
  <section class="game-panel" aria-label="White Palace 1-1 playable prototype">
    <div class="game-frame">
      <div class="play-surface">
        <div bind:this={gameHost} class="game-host"></div>

        <div class="hud-layer" aria-label="White Palace HUD">
          <section class="hud-panel status-hud">
            <span class="corner tl"></span>
            <span class="corner tr"></span>
            <span class="corner bl"></span>
            <span class="corner br"></span>
            <div class="hud-label"><span></span>System Status</div>
            <div class="status-body">
              <div class="portrait-slot">YT</div>
              <div class="status-info">
                <strong>Yuuta Tsubasa</strong>
                <div><span>Class</span><b>Paladin</b></div>
                <div><span>Alignment</span><b>Taiwan Knight</b></div>
              </div>
            </div>
            <div class="vitals">
              <div class="vital-row">
                <span>HP</span>
                <b>{hud.hp} / {hud.hpMax}</b>
              </div>
              <div class="bar"><i style={`width:${Math.max(0, Math.min(100, (hud.hp / hud.hpMax) * 100))}%`}></i></div>
            </div>
          </section>

          <section class="stage-banner">
            <div class="banner-fill">
              <span class="emblem" aria-hidden="true">
                <svg viewBox="0 0 26 52" fill="currentColor">
                  <rect x="12" y="5" width="2" height="44" rx="1"></rect>
                  <path d="M13 14c-5 0-8-3-9-8 6 0 9 3 9 8z"></path>
                  <path d="M13 14c5 0 8-3 9-8-6 0-9 3-9 8z"></path>
                  <path d="M13 24c-4.5 0-7-2.6-8-7 5.4 0 8 2.6 8 7z"></path>
                  <path d="M13 24c4.5 0 7-2.6 8-7-5.4 0-8 2.6-8 7z"></path>
                  <path d="M13 34c-4 0-6.4-2.3-7.3-6.2 4.9 0 7.3 2.3 7.3 6.2z"></path>
                  <path d="M13 34c4 0 6.4-2.3 7.3-6.2-4.9 0-7.3 2.3-7.3 6.2z"></path>
                </svg>
              </span>
              <div>
                <strong>White Palace 1-1</strong>
                <span>The First Gate</span>
              </div>
              <span class="emblem flip" aria-hidden="true">
                <svg viewBox="0 0 26 52" fill="currentColor">
                  <rect x="12" y="5" width="2" height="44" rx="1"></rect>
                  <path d="M13 14c-5 0-8-3-9-8 6 0 9 3 9 8z"></path>
                  <path d="M13 14c5 0 8-3 9-8-6 0-9 3-9 8z"></path>
                  <path d="M13 24c-4.5 0-7-2.6-8-7 5.4 0 8 2.6 8 7z"></path>
                  <path d="M13 24c4.5 0 7-2.6 8-7-5.4 0-8 2.6-8 7z"></path>
                  <path d="M13 34c-4 0-6.4-2.3-7.3-6.2 4.9 0 7.3 2.3 7.3 6.2z"></path>
                  <path d="M13 34c4 0 6.4-2.3 7.3-6.2-4.9 0-7.3 2.3-7.3 6.2z"></path>
                </svg>
              </span>
            </div>
          </section>

          <section class="hud-panel map-hud">
            <span class="corner tr"></span>
            <span class="corner bl"></span>
            <div class="hud-label"><span></span>Map Overview</div>
            <div class="mini-map">
              <i class="route r1"></i>
              <i class="route r2"></i>
              <i class="route r3"></i>
              <i class="pin"></i>
              <i class="goal-pin"></i>
            </div>
          </section>

          <section class="hud-panel objective-hud">
            <span class="corner tl"></span>
            <span class="corner br"></span>
            <div class="hud-label"><span></span>Objective</div>
            <p>{hud.objective}</p>
          </section>

          <section class="bottom-hud">
            <div class="bottom-fill">
              <div class="skill-group">
                <div class="hud-label"><span></span>Skill</div>
                <div class="skills">
                  <div><b>J</b><span>Attack</span></div>
                  <div><b>K</b><span>Homing</span></div>
                  <div><b>L</b><span>Guard</span></div>
                  <div><b>⇧</b><span>Dash</span></div>
                </div>
              </div>
              <div class="ai-callout">
                <div class="ai-face">AI</div>
                <p>› All systems nominal.<br />› Knight Yuuta, proceed.<br />› The first gate awaits.</p>
              </div>
              <div class="readouts">
                <div>
                  <span>Coin</span>
                  <b>{String(hud.coins).padStart(3, '0')} <small>/ {hud.coinTarget}</small></b>
                </div>
                <div>
                  <span>Time</span>
                  <b>{hud.time}</b>
                </div>
                <div>
                  <span>Rank</span>
                  <b class="rank">S</b>
                </div>
              </div>
            </div>
          </section>

          {#if hud.cleared}
            <div class="clear-overlay">
              <span>Stage Clear</span>
              <strong>Gate Opened</strong>
              <small>Coins {String(hud.coins).padStart(3, '0')} / {hud.coinTarget} · Time {hud.time}</small>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </section>
</main>
