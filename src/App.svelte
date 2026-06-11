<script lang="ts">
  import { onMount, tick } from 'svelte'
  import type Phaser from 'phaser'
  import StageSelect from './StageSelect.svelte'
  import StageResult from './StageResult.svelte'
  import SettingsPanel, { type GameSettings } from './SettingsPanel.svelte'
  import { createPlatformerGame } from './game/createGame'

  type HudState = {
    hp: number
    hpMax: number
    coins: number
    coinTarget: number
    damageTaken: number
    falls: number
    enemiesDefeated: number
    enemyTarget: number
    checkpointsReached: number
    checkpointTarget: number
    rank: string
    time: string
    objective: string
    statusMessage: string
    playerProgress: number
    playerProgressY: number
    goalProgress: number
    enemyActive: boolean
    enemyMarkers: Array<{ x: number; y: number }>
    mapPlatforms: Array<{ x: number; y: number; width: number }>
    checkpointMarkers: Array<{ x: number; y: number }>
    activeCheckpointIndex: number
    cleared: boolean
  }

  let gameHost: HTMLDivElement
  let game: Phaser.Game | undefined
  let screen: 'select' | 'game' = 'select'
  let transitionPhase: 'idle' | 'cover' | 'reveal' = 'idle'
  let paused = false
  let pauseSelection = 0
  let settingsOpen = false
  let settingsSelection = 0
  let resultSelection = 0
  let gamepadFrame = 0
  let gamepadPrevious = new Set<number>()
  let gamepadAxisReady = true
  let mapMusic: HTMLAudioElement | undefined
  let stageMusic: HTMLAudioElement | undefined
  let musicUnlocked = false
  const musicFadeFrames = new Map<HTMLAudioElement, number>()
  const BASE_MUSIC_VOLUME = 0.42
  const SETTINGS_KEY = 'project-almost:settings'
  const DEFAULT_SETTINGS: GameSettings = {
    masterVolume: 100,
    musicVolume: 80,
    fullscreen: false,
    screenShake: true,
    vibration: true,
  }
  let settings: GameSettings = { ...DEFAULT_SETTINGS }
  const pauseItems = ['Resume', 'Restart Stage', 'Settings', 'Return to Stage Select']
  let hud: HudState = {
    hp: 3,
    hpMax: 3,
    coins: 0,
    coinTarget: 17,
    damageTaken: 0,
    falls: 0,
    enemiesDefeated: 0,
    enemyTarget: 4,
    checkpointsReached: 0,
    checkpointTarget: 2,
    rank: '--',
    time: '00:00.00',
    objective: 'Reach the Goal',
    statusMessage: 'Path confirmed. Proceed to the first gate.',
    playerProgress: 0,
    playerProgressY: 0,
    goalProgress: 0.92,
    enemyActive: true,
    enemyMarkers: [],
    mapPlatforms: [],
    checkpointMarkers: [],
    activeCheckpointIndex: -1,
    cleared: false,
  }

  function handleHudEvent(event: Event) {
    const next = (event as CustomEvent<Partial<HudState>>).detail
    const clearedChanged = next.cleared !== undefined && next.cleared !== hud.cleared
    hud = { ...hud, ...next }
    if (clearedChanged) syncMusic()
  }

  function fadeMusic(audio: HTMLAudioElement | undefined, target: number, duration = 450) {
    if (!audio) return
    const previousFrame = musicFadeFrames.get(audio)
    if (previousFrame) window.cancelAnimationFrame(previousFrame)
    const startVolume = audio.volume
    const startedAt = performance.now()

    const step = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration)
      audio.volume = startVolume + (target - startVolume) * progress
      if (progress < 1) musicFadeFrames.set(audio, window.requestAnimationFrame(step))
      else {
        musicFadeFrames.delete(audio)
        if (target === 0) audio.pause()
      }
    }
    musicFadeFrames.set(audio, window.requestAnimationFrame(step))
  }

  function playMusic(audio: HTMLAudioElement | undefined, volume: number) {
    if (!audio || !musicUnlocked) return
    if (audio.paused) {
      audio.volume = 0
      void audio.play().catch(() => {})
    }
    fadeMusic(audio, volume)
  }

  function syncMusic() {
    if (!musicUnlocked) return
    const volume = BASE_MUSIC_VOLUME * (settings.masterVolume / 100) * (settings.musicVolume / 100)

    if (screen === 'select') {
      fadeMusic(stageMusic, 0)
      playMusic(mapMusic, volume)
    } else {
      fadeMusic(mapMusic, 0)
      playMusic(stageMusic, paused || hud.cleared ? volume * 0.45 : volume)
    }
  }

  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    syncMusic()
  }

  function adjustSettings(index: number, direction: number) {
    if (index === 0 || index === 1) {
      const key = index === 0 ? 'masterVolume' : 'musicVolume'
      settings = { ...settings, [key]: Math.max(0, Math.min(100, settings[key] + direction * 10)) }
    } else if (index >= 2 && index <= 4) {
      activateSettingsItem(index)
      return
    }
    saveSettings()
  }

  async function toggleFullscreen() {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await document.documentElement.requestFullscreen()
    settings = { ...settings, fullscreen: Boolean(document.fullscreenElement) }
    saveSettings()
  }

  function closeSettings() {
    settingsOpen = false
    pauseSelection = 2
  }

  function activateSettingsItem(index = settingsSelection) {
    if (index === 0 || index === 1) {
      adjustSettings(index, 1)
    } else if (index === 2) {
      void toggleFullscreen()
    } else if (index === 3) {
      settings = { ...settings, screenShake: !settings.screenShake }
      saveSettings()
    } else if (index === 4) {
      settings = { ...settings, vibration: !settings.vibration }
      saveSettings()
    } else if (index === 5) {
      settings = { ...DEFAULT_SETTINGS, fullscreen: Boolean(document.fullscreenElement) }
      saveSettings()
    } else if (index === 6) {
      closeSettings()
    }
  }

  function unlockMusic() {
    if (musicUnlocked) return
    musicUnlocked = true
    syncMusic()
  }

  async function enterStage() {
    if (transitionPhase !== 'idle') return
    transitionPhase = 'cover'
    await new Promise((resolve) => window.setTimeout(resolve, 260))
    screen = 'game'
    paused = false
    resultSelection = 0
    syncMusic()
    await tick()
    game = createPlatformerGame(gameHost)
    await new Promise((resolve) => window.setTimeout(resolve, 420))
    transitionPhase = 'reveal'
    window.setTimeout(() => {
      transitionPhase = 'idle'
    }, 620)
  }

  function returnToStageSelect() {
    game?.destroy(true)
    game = undefined
    paused = false
    hud = { ...hud, coins: 0, damageTaken: 0, falls: 0, enemiesDefeated: 0, checkpointsReached: 0, time: '00:00.00', rank: '--', cleared: false }
    screen = 'select'
    syncMusic()
  }

  function pauseGame() {
    if (!game || hud.cleared) return
    game.scene.pause('PrototypeScene')
    pauseSelection = 0
    settingsOpen = false
    paused = true
    syncMusic()
  }

  function resumeGame() {
    game?.scene.resume('PrototypeScene')
    paused = false
    syncMusic()
  }

  async function restartStage() {
    if (!game || transitionPhase !== 'idle') return
    transitionPhase = 'cover'
    await new Promise((resolve) => window.setTimeout(resolve, 260))
    game.destroy(true)
    game = undefined
    paused = false
    resultSelection = 0
    syncMusic()
    hud = { ...hud, coins: 0, damageTaken: 0, falls: 0, enemiesDefeated: 0, checkpointsReached: 0, time: '00:00.00', rank: '--', cleared: false }
    await tick()
    game = createPlatformerGame(gameHost)
    await new Promise((resolve) => window.setTimeout(resolve, 420))
    transitionPhase = 'reveal'
    window.setTimeout(() => {
      transitionPhase = 'idle'
    }, 620)
  }

  function selectPauseItem(index: number) {
    pauseSelection = index
  }

  function movePauseSelection(direction: number) {
    pauseSelection = (pauseSelection + direction + pauseItems.length) % pauseItems.length
  }

  function activatePauseItem(index = pauseSelection) {
    if (index === 0) resumeGame()
    if (index === 1) restartStage()
    if (index === 2) {
      settingsSelection = 0
      settingsOpen = true
    }
    if (index === 3) returnToStageSelect()
  }

  function handleGlobalKeydown(event: KeyboardEvent) {
    if (screen !== 'game') return

    if (hud.cleared) {
      if (event.key === 'Escape') {
        event.preventDefault()
        returnToStageSelect()
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        resultSelection = Math.max(0, resultSelection - 1)
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        resultSelection = Math.min(1, resultSelection + 1)
      } else if (event.code === 'Space' || event.key === 'Enter') {
        event.preventDefault()
        if (resultSelection === 0) restartStage()
        if (resultSelection === 1) returnToStageSelect()
      }
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      if (settingsOpen) closeSettings()
      else if (paused) resumeGame()
      else pauseGame()
      return
    }

    if (!paused) return

    if (settingsOpen) {
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        settingsSelection = (settingsSelection + 6) % 7
      } else if (event.key === 'ArrowDown') {
        event.preventDefault()
        settingsSelection = (settingsSelection + 1) % 7
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        adjustSettings(settingsSelection, -1)
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        adjustSettings(settingsSelection, 1)
      } else if (event.code === 'Space' || event.key === 'Enter') {
        event.preventDefault()
        activateSettingsItem()
      }
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      movePauseSelection(-1)
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      movePauseSelection(1)
    } else if (event.code === 'Space' || event.key === 'Enter') {
      event.preventDefault()
      activatePauseItem()
    }
  }

  function dispatchGamepadKey(key: string, code = key) {
    window.dispatchEvent(new KeyboardEvent('keydown', { key, code, bubbles: true }))
  }

  function pollGamepad() {
    const pad = Array.from(navigator.getGamepads?.() ?? []).find((candidate): candidate is Gamepad => candidate !== null)

    if (pad) {
      if (pad.buttons.some((button) => button.pressed)) unlockMusic()
      const pressed = new Set<number>()
      pad.buttons.forEach((button, index) => {
        if (button.pressed) pressed.add(index)
      })

      const justPressed = (index: number) => pressed.has(index) && !gamepadPrevious.has(index)
      const horizontal = Math.abs(pad.axes[0] ?? 0) > 0.45 ? Math.sign(pad.axes[0]) : 0
      const vertical = Math.abs(pad.axes[1] ?? 0) > 0.45 ? Math.sign(pad.axes[1]) : 0

      if (screen === 'select') {
        if (justPressed(14) || (horizontal < 0 && gamepadAxisReady)) dispatchGamepadKey('ArrowLeft')
        if (justPressed(15) || (horizontal > 0 && gamepadAxisReady)) dispatchGamepadKey('ArrowRight')
        if (justPressed(0)) dispatchGamepadKey('Enter')
      } else if (hud.cleared) {
        if (justPressed(14) || (horizontal < 0 && gamepadAxisReady)) dispatchGamepadKey('ArrowLeft')
        if (justPressed(15) || (horizontal > 0 && gamepadAxisReady)) dispatchGamepadKey('ArrowRight')
        if (justPressed(0)) dispatchGamepadKey('Enter')
        if (justPressed(1)) dispatchGamepadKey('Escape')
      } else if (paused) {
        if (justPressed(12) || (vertical < 0 && gamepadAxisReady)) dispatchGamepadKey('ArrowUp')
        if (justPressed(13) || (vertical > 0 && gamepadAxisReady)) dispatchGamepadKey('ArrowDown')
        if (settingsOpen && (justPressed(14) || (horizontal < 0 && gamepadAxisReady))) dispatchGamepadKey('ArrowLeft')
        if (settingsOpen && (justPressed(15) || (horizontal > 0 && gamepadAxisReady))) dispatchGamepadKey('ArrowRight')
        if (justPressed(0)) dispatchGamepadKey('Enter')
        if (justPressed(1) || justPressed(9)) dispatchGamepadKey('Escape')
      } else if (justPressed(9)) {
        dispatchGamepadKey('Escape')
      }

      gamepadAxisReady = horizontal === 0 && vertical === 0
      gamepadPrevious = pressed
    } else {
      gamepadPrevious.clear()
      gamepadAxisReady = true
    }

    gamepadFrame = window.requestAnimationFrame(pollGamepad)
  }

  onMount(() => {
    const storedSettings = localStorage.getItem(SETTINGS_KEY)
    if (storedSettings) {
      try {
        settings = { ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings), fullscreen: Boolean(document.fullscreenElement) }
      } catch {
        settings = { ...DEFAULT_SETTINGS }
      }
    }
    mapMusic = new Audio('/assets/audio/world01_map.mp3')
    stageMusic = new Audio('/assets/audio/world01_stage.mp3')
    mapMusic.loop = true
    stageMusic.loop = true
    mapMusic.preload = 'auto'
    stageMusic.preload = 'auto'
    window.addEventListener('projectrun:hud', handleHudEvent)
    window.addEventListener('keydown', handleGlobalKeydown)
    window.addEventListener('keydown', unlockMusic, { once: true })
    window.addEventListener('pointerdown', unlockMusic, { once: true })
    const handleFullscreenChange = () => {
      settings = { ...settings, fullscreen: Boolean(document.fullscreenElement) }
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    gamepadFrame = window.requestAnimationFrame(pollGamepad)

    return () => {
      window.removeEventListener('projectrun:hud', handleHudEvent)
      window.removeEventListener('keydown', handleGlobalKeydown)
      window.removeEventListener('keydown', unlockMusic)
      window.removeEventListener('pointerdown', unlockMusic)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      window.cancelAnimationFrame(gamepadFrame)
      for (const frame of musicFadeFrames.values()) window.cancelAnimationFrame(frame)
      musicFadeFrames.clear()
      mapMusic?.pause()
      stageMusic?.pause()
      game?.destroy(true)
    }
  })
</script>

<main class="shell">
  {#if screen === 'select'}
    <section class="game-panel" aria-label="White Palace stage select">
      <StageSelect onEnter={enterStage} />
    </section>
  {:else}
  <section class="game-panel game-enter" aria-label="White Palace 1-1 playable prototype">
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
              <img class="portrait-slot" src="/assets/hud/player-portrait.png" alt="Yuuta Tsubasa" />
              <div class="status-info">
                <strong>Yuuta Tsubasa</strong>
                <div class="hp-heading">
                  <span>HP</span>
                  <b>{hud.hp} / {hud.hpMax}</b>
                </div>
                <div class="bar"><i style={`width:${Math.max(0, Math.min(100, (hud.hp / hud.hpMax) * 100))}%`}></i></div>
              </div>
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
              <svg viewBox="0 0 100 36" aria-label="White Palace stage map">
                {#each hud.mapPlatforms as platform}
                  <line class="map-platform" x1={platform.x * 100} y1={platform.y * 36} x2={(platform.x + platform.width) * 100} y2={platform.y * 36}></line>
                {/each}
                {#each hud.checkpointMarkers as checkpoint, index}
                  <path class:active={index <= hud.activeCheckpointIndex} class="map-checkpoint" d={`M${checkpoint.x * 100} ${checkpoint.y * 36} V${checkpoint.y * 36 - 6} M${checkpoint.x * 100 - 1.7} ${checkpoint.y * 36 - 6} H${checkpoint.x * 100 + 1.7} V${checkpoint.y * 36 - 3} H${checkpoint.x * 100 - 1.7} Z`}></path>
                {/each}
                <circle class="map-player" cx={hud.playerProgress * 100} cy={hud.playerProgressY * 36} r="2.4"></circle>
                {#each hud.enemyMarkers as enemy}
                  <circle class="map-enemy" cx={enemy.x * 100} cy={enemy.y * 36} r="1.4"></circle>
                {/each}
                <path class="map-goal" d={`M${hud.goalProgress * 100} 9.1 V2 M${hud.goalProgress * 100} 2 L${hud.goalProgress * 100 - 6} 4.5 L${hud.goalProgress * 100} 7`}></path>
              </svg>
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
                <div class="hud-label"><span></span>Controls</div>
                <div class="skills">
                  <div><b>← →</b><span>Move</span></div>
                  <div><b>Space</b><span>Jump</span></div>
                  <div><b>J</b><span>Attack</span></div>
                  <div><b>Space + J</b><span>Homing</span></div>
                </div>
              </div>
              <div class="ai-callout">
                <img class="ai-face" src="/assets/hud/ai-navigator.png" alt="Palace navigator AI" />
                <div>
                  <span>Palace Navigator</span>
                  <p>› {hud.statusMessage}</p>
                </div>
              </div>
              <div class="readouts">
                <div>
                  <span>Time</span>
                  <b>{hud.time}</b>
                </div>
                <div>
                  <span>Coins</span>
                  <b>{hud.coins} <small>/ {hud.coinTarget}</small></b>
                </div>
                <div>
                  <span>Damage</span>
                  <b>{hud.damageTaken}</b>
                </div>
                <div>
                  <span>Falls</span>
                  <b>{hud.falls}</b>
                </div>
                <div>
                  <span>Enemies</span>
                  <b>{hud.enemiesDefeated} <small>/ {hud.enemyTarget}</small></b>
                </div>
                <div>
                  <span>Checkpoints</span>
                  <b>{hud.checkpointsReached} <small>/ {hud.checkpointTarget}</small></b>
                </div>
                <div class="live-rank">
                  <span>Rank</span>
                  <b class={`rank-${hud.rank.toLowerCase()}`}>{hud.rank}</b>
                </div>
              </div>
            </div>
          </section>

          {#if hud.cleared}
            <StageResult
              time={hud.time}
              coins={hud.coins}
              coinTarget={hud.coinTarget}
              damageTaken={hud.damageTaken}
              falls={hud.falls}
              enemiesDefeated={hud.enemiesDefeated}
              enemyTarget={hud.enemyTarget}
              checkpointsReached={hud.checkpointsReached}
              checkpointTarget={hud.checkpointTarget}
              rank={hud.rank}
              onRetry={restartStage}
              onStageSelect={returnToStageSelect}
              selectedAction={resultSelection}
              onSelectAction={(index) => resultSelection = index}
            />
          {/if}

          {#if paused}
            <div class="pause-overlay">
              {#if settingsOpen}
                <SettingsPanel
                  {settings}
                  selectedItem={settingsSelection}
                  onSelect={(index) => settingsSelection = index}
                  onAdjust={adjustSettings}
                  onActivate={activateSettingsItem}
                />
              {:else}
              <div class="pause-menu">
                <span class="pause-kicker">System Menu</span>
                <strong>Paused</strong>
                <div class="pause-rule"></div>
                <nav aria-label="Pause menu">
                  {#each pauseItems as item, index}
                    <button
                      class:active={pauseSelection === index}
                      onclick={() => {
                        selectPauseItem(index)
                        activatePauseItem(index)
                      }}
                    >
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <b>{item}</b>
                    </button>
                  {/each}
                </nav>
                <p><kbd>↑</kbd><kbd>↓</kbd> Select <kbd>Enter</kbd> Confirm <kbd>Esc</kbd> Resume</p>
              </div>
              {/if}
            </div>
          {/if}
        </div>
      </div>
    </div>
  </section>
  {/if}

  {#if transitionPhase !== 'idle'}
    <div class:reveal={transitionPhase === 'reveal'} class="page-transition" aria-hidden="true">
      <div class="transition-emblem">✦</div>
    </div>
  {/if}
</main>
