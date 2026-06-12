<script lang="ts">
  import { onMount, tick } from 'svelte'
  import type Phaser from 'phaser'
  import StageSelect from './StageSelect.svelte'
  import StageResult from './StageResult.svelte'
  import SettingsPanel, { type GameSettings } from './SettingsPanel.svelte'
  import TitleScreen from './TitleScreen.svelte'
  import VirtualControls from './VirtualControls.svelte'
  import { IMAGE_ASSETS, MUSIC_ASSETS, PRELOAD_ASSETS, SFX_ASSETS, type MusicTrack } from './game/assets/assetManifest'
  import { createPlatformerGame } from './game/createGame'
  import { deleteSave, loadSave, recordStageClear, type SaveData } from './game/save/saveData'
  import { getNextStageId, type StageId } from './game/stages/stageRegistry'
  import { nextLocale, setLocale, translator, type TranslationKey, type TranslationParams } from './i18n'

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
    statusMessage: TranslationKey
    statusParams: TranslationParams
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
  let bootReady = false
  let bootProgress = 0
  let screen: 'title' | 'select' | 'game' = 'title'
  let selectedStageId: StageId = '1-1'
  let titleMenuOpen = false
  let titleSelection = 0
  let returnToTitlePending = false
  let transitionPhase: 'idle' | 'cover' | 'reveal' = 'idle'
  let paused = false
  let pauseSelection = 0
  let settingsOpen = false
  let settingsOrigin: 'title' | 'pause' = 'pause'
  let settingsSelection = 0
  let deleteSaveConfirmOpen = false
  let deleteSaveConfirmSelection = 0
  let resultSelection = 0
  let saveData: SaveData = { version: 1, stageRecords: {} }
  let gamepadFrame = 0
  let gamepadPrevious = new Set<number>()
  let gamepadAxisReady = true
  let virtualControlsVisible = false
  let musicPlayer: HTMLAudioElement | undefined
  let desiredMusicTrack: MusicTrack = 'title'
  let activeMusicTrack: MusicTrack = 'title'
  let desiredMusicVolume = 0
  let musicRetryTimer = 0
  const sfx = new Map<string, HTMLAudioElement>()
  let musicUnlocked = false
  let musicFadeFrame = 0
  const BASE_MUSIC_VOLUME = 0.42
  const SETTINGS_KEY = 'project-almost:settings'
  const IMAGE_ASSET_PATHS = new Set<string>(Object.values(IMAGE_ASSETS))
  const DEFAULT_SETTINGS: GameSettings = {
    masterVolume: 100,
    musicVolume: 80,
    sfxVolume: 80,
    language: 'en',
    fullscreen: false,
    screenShake: true,
    vibration: true,
  }
  let settings: GameSettings = { ...DEFAULT_SETTINGS }
  const pauseItems = ['pause.resume', 'pause.restart', 'title.settings', 'pause.stageSelect'] as const
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
    statusMessage: 'status.initial',
    statusParams: {},
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
    if (clearedChanged) {
      if (hud.cleared) {
        saveData = recordStageClear(saveData, selectedStageId, { time: hud.time, rank: hud.rank, coins: hud.coins })
      }
      syncMusic()
    }
  }

  function fadeMusic(audio: HTMLAudioElement | undefined, target: number, duration = 450) {
    if (!audio) return
    cancelMusicFade()
    const startVolume = audio.volume
    const startedAt = performance.now()

    const step = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration)
      audio.volume = startVolume + (target - startVolume) * progress
      if (progress < 1) musicFadeFrame = window.requestAnimationFrame(step)
      else musicFadeFrame = 0
    }
    musicFadeFrame = window.requestAnimationFrame(step)
  }

  function cancelMusicFade() {
    if (musicFadeFrame) window.cancelAnimationFrame(musicFadeFrame)
    musicFadeFrame = 0
  }

  function scheduleMusicRetry() {
    window.clearTimeout(musicRetryTimer)
    musicRetryTimer = window.setTimeout(() => {
      if (musicUnlocked && musicPlayer?.paused) void ensureDesiredMusicPlaying()
    }, 500)
  }

  async function ensureDesiredMusicPlaying() {
    const audio = musicPlayer
    if (!audio || !musicUnlocked) return

    cancelMusicFade()
    if (activeMusicTrack !== desiredMusicTrack) {
      activeMusicTrack = desiredMusicTrack
      audio.pause()
      audio.src = MUSIC_ASSETS[activeMusicTrack]
      audio.dataset.track = activeMusicTrack
      audio.currentTime = 0
      audio.load()
    }

    try {
      if (audio.paused) {
        audio.volume = 0
        await audio.play()
      }
      if (!audio.paused && activeMusicTrack === desiredMusicTrack) fadeMusic(audio, desiredMusicVolume)
      else scheduleMusicRetry()
    } catch {
      scheduleMusicRetry()
    }
  }

  function playMusic(track: MusicTrack, volume: number) {
    desiredMusicTrack = track
    desiredMusicVolume = volume
    void ensureDesiredMusicPlaying()
  }

  function prepareMusicTrack(track: MusicTrack) {
    desiredMusicTrack = track
    desiredMusicVolume = 0
    void ensureDesiredMusicPlaying()
  }

  function resetMusic(track: MusicTrack) {
    if (!musicPlayer || activeMusicTrack !== track) return
    cancelMusicFade()
    musicPlayer.pause()
    musicPlayer.currentTime = 0
    musicPlayer.volume = 0
  }

  function syncMusic() {
    if (!musicUnlocked) return
    const volume = BASE_MUSIC_VOLUME * (settings.masterVolume / 100) * (settings.musicVolume / 100)

    if (screen === 'title') {
      playMusic('title', volume * (titleMenuOpen ? 1 : 0.35))
    } else if (screen === 'select') {
      playMusic('map', volume)
    } else {
      if (hud.cleared) {
        playMusic('result', volume)
      } else {
        playMusic('stage', paused ? volume * 0.45 : volume)
      }
    }
  }

  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    syncMusic()
  }

  function playSfx(name: string) {
    const source = sfx.get(name)
    if (!source || settings.sfxVolume === 0 || settings.masterVolume === 0) return
    const audio = source.cloneNode() as HTMLAudioElement
    audio.volume = (settings.masterVolume / 100) * (settings.sfxVolume / 100)
    void audio.play().catch(() => {})
  }

  function handleSfxEvent(event: Event) {
    playSfx((event as CustomEvent<string>).detail)
  }

  function handlePrepareMusicEvent(event: Event) {
    prepareMusicTrack((event as CustomEvent<MusicTrack>).detail)
  }

  function adjustSettings(index: number, direction: number) {
    if (index >= 0 && index <= 2) {
      const key = index === 0 ? 'masterVolume' : index === 1 ? 'musicVolume' : 'sfxVolume'
      settings = { ...settings, [key]: Math.max(0, Math.min(100, settings[key] + direction * 10)) }
    } else if (index === 3) {
      settings = { ...settings, language: nextLocale(settings.language, direction) }
      setLocale(settings.language)
    } else if (index >= 4 && index <= 6) {
      activateSettingsItem(index)
      return
    }
    playSfx('ui-move')
    saveSettings()
  }

  async function toggleFullscreen() {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await document.documentElement.requestFullscreen()
    settings = { ...settings, fullscreen: Boolean(document.fullscreenElement) }
    saveSettings()
  }

  function closeSettings() {
    playSfx('ui-back')
    deleteSaveConfirmOpen = false
    settingsOpen = false
    if (settingsOrigin === 'pause') pauseSelection = 2
    else titleSelection = 1
  }

  function closeSettingsFromBackdrop(event: MouseEvent) {
    if (!deleteSaveConfirmOpen && event.target === event.currentTarget) closeSettings()
  }

  function activateSettingsItem(index = settingsSelection) {
    playSfx('ui-confirm')
    if (index >= 0 && index <= 2) {
      adjustSettings(index, 1)
    } else if (index === 3) {
      adjustSettings(index, 1)
    } else if (index === 4) {
      void toggleFullscreen()
    } else if (index === 5) {
      settings = { ...settings, screenShake: !settings.screenShake }
      saveSettings()
    } else if (index === 6) {
      settings = { ...settings, vibration: !settings.vibration }
      saveSettings()
    } else if (index === 7) {
      settings = { ...DEFAULT_SETTINGS, fullscreen: Boolean(document.fullscreenElement) }
      setLocale(settings.language)
      saveSettings()
    } else if (index === 8) {
      deleteSaveConfirmSelection = 0
      deleteSaveConfirmOpen = true
    } else if (index === 9) {
      closeSettings()
    }
  }

  function cancelDeleteSave() {
    playSfx('ui-back')
    deleteSaveConfirmOpen = false
    deleteSaveConfirmSelection = 0
  }

  function confirmDeleteSave() {
    playSfx('ui-confirm')
    saveData = deleteSave()
    deleteSaveConfirmOpen = false
    deleteSaveConfirmSelection = 0
  }

  function unlockMusic() {
    if (!musicUnlocked) {
      musicUnlocked = true
      syncMusic()
    } else if (musicPlayer?.paused) {
      void ensureDesiredMusicPlaying()
    }
  }

  function openTitleMenu() {
    if (titleMenuOpen) return
    playSfx('ui-confirm')
    titleMenuOpen = true
    syncMusic()
  }

  async function attemptTitleMusicAutoplay() {
    if (!musicPlayer || musicUnlocked) return
    const volume = BASE_MUSIC_VOLUME * (settings.masterVolume / 100) * (settings.musicVolume / 100) * 0.35
    musicPlayer.volume = volume
    try {
      await musicPlayer.play()
      musicUnlocked = true
      desiredMusicTrack = 'title'
      desiredMusicVolume = volume
      syncMusic()
    } catch {
      // Browsers commonly require the first keyboard, pointer, or gamepad interaction.
    }
  }

  async function preloadGameAssets() {
    let completed = 0
    const reportComplete = () => {
      completed += 1
      bootProgress = Math.round((completed / (PRELOAD_ASSETS.length + 1)) * 100)
    }

    const assetLoads = PRELOAD_ASSETS.map(async (source) => {
      try {
        const response = await fetch(source, { cache: 'force-cache' })
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
        await response.blob()

        if (IMAGE_ASSET_PATHS.has(source)) {
          const image = new Image()
          image.src = source
          await image.decode()
        }
      } catch (error) {
        console.warn(`Unable to preload ${source}`, error)
      } finally {
        reportComplete()
      }
    })

    await Promise.all([
      ...assetLoads,
      document.fonts.ready.then(reportComplete),
    ])
    bootProgress = 100
    await new Promise((resolve) => window.setTimeout(resolve, 180))
    bootReady = true
  }

  async function enterStage(stageId: StageId) {
    if (transitionPhase !== 'idle') return
    hideVirtualControls()
    selectedStageId = stageId
    transitionPhase = 'cover'
    await new Promise((resolve) => window.setTimeout(resolve, 260))
    screen = 'game'
    paused = false
    resultSelection = 0
    resetMusic('result')
    syncMusic()
    await createStageGame()
    await new Promise((resolve) => window.setTimeout(resolve, 420))
    resetGameLoopTiming()
    transitionPhase = 'reveal'
    window.setTimeout(() => {
      transitionPhase = 'idle'
    }, 620)
  }

  async function enterStageSelect() {
    if (transitionPhase !== 'idle') return
    transitionPhase = 'cover'
    await new Promise((resolve) => window.setTimeout(resolve, 260))
    screen = 'select'
    syncMusic()
    await new Promise((resolve) => window.setTimeout(resolve, 280))
    transitionPhase = 'reveal'
    window.setTimeout(() => {
      transitionPhase = 'idle'
      if (returnToTitlePending) {
        returnToTitlePending = false
        void returnToTitle()
      }
    }, 620)
  }

  async function returnToTitle() {
    if (transitionPhase !== 'idle') {
      returnToTitlePending = true
      return
    }
    transitionPhase = 'cover'
    await new Promise((resolve) => window.setTimeout(resolve, 260))
    screen = 'title'
    titleMenuOpen = true
    titleSelection = 0
    syncMusic()
    await new Promise((resolve) => window.setTimeout(resolve, 280))
    transitionPhase = 'reveal'
    window.setTimeout(() => {
      transitionPhase = 'idle'
    }, 620)
  }

  function activateTitleItem(index = titleSelection) {
    playSfx('ui-confirm')
    if (index === 0) {
      prepareMusicTrack('map')
      void enterStageSelect()
    }
    if (index === 1) {
      settingsOrigin = 'title'
      settingsSelection = 0
      settingsOpen = true
    }
  }

  function returnToStageSelect() {
    hideVirtualControls()
    game?.destroy(true)
    game = undefined
    paused = false
    hud = { ...hud, coins: 0, damageTaken: 0, falls: 0, enemiesDefeated: 0, checkpointsReached: 0, time: '00:00.00', rank: '--', cleared: false }
    screen = 'select'
    syncMusic()
  }

  function pauseGame() {
    if (!game || hud.cleared) return
    hideVirtualControls()
    playSfx('ui-confirm')
    game.scene.pause('GameplayScene')
    pauseSelection = 0
    settingsOpen = false
    paused = true
    syncMusic()
  }

  function resumeGame() {
    playSfx('ui-back')
    game?.scene.resume('GameplayScene')
    resetGameLoopTiming()
    paused = false
    syncMusic()
  }

  function nextAnimationFrame() {
    return new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()))
  }

  function resetGameLoopTiming() {
    game?.loop.resetDelta()
  }

  async function createStageGame() {
    await tick()
    await nextAnimationFrame()
    game = createPlatformerGame(gameHost, selectedStageId)
    await nextAnimationFrame()
    resetGameLoopTiming()
  }

  async function restartStage() {
    if (!game || transitionPhase !== 'idle') return
    hideVirtualControls()
    resetMusic('stage')
    prepareMusicTrack('stage')
    transitionPhase = 'cover'
    await new Promise((resolve) => window.setTimeout(resolve, 260))
    game.destroy(true)
    game = undefined
    paused = false
    resultSelection = 0
    resetMusic('result')
    hud = { ...hud, coins: 0, damageTaken: 0, falls: 0, enemiesDefeated: 0, checkpointsReached: 0, time: '00:00.00', rank: '--', cleared: false }
    syncMusic()
    await createStageGame()
    await new Promise((resolve) => window.setTimeout(resolve, 420))
    resetGameLoopTiming()
    transitionPhase = 'reveal'
    window.setTimeout(() => {
      transitionPhase = 'idle'
    }, 620)
  }

  async function enterNextStage() {
    const nextStageId = getNextStageId(selectedStageId)
    if (!game || !nextStageId || !saveData.stageRecords[selectedStageId]?.cleared || transitionPhase !== 'idle') return

    hideVirtualControls()
    resetMusic('stage')
    prepareMusicTrack('stage')
    transitionPhase = 'cover'
    await new Promise((resolve) => window.setTimeout(resolve, 260))
    game.destroy(true)
    game = undefined
    selectedStageId = nextStageId
    paused = false
    resultSelection = 0
    resetMusic('result')
    hud = { ...hud, coins: 0, damageTaken: 0, falls: 0, enemiesDefeated: 0, checkpointsReached: 0, time: '00:00.00', rank: '--', cleared: false }
    syncMusic()
    await createStageGame()
    await new Promise((resolve) => window.setTimeout(resolve, 420))
    resetGameLoopTiming()
    transitionPhase = 'reveal'
    window.setTimeout(() => {
      transitionPhase = 'idle'
    }, 620)
  }

  function selectPauseItem(index: number) {
    pauseSelection = index
  }

  function movePauseSelection(direction: number) {
    playSfx('ui-move')
    pauseSelection = (pauseSelection + direction + pauseItems.length) % pauseItems.length
  }

  function activatePauseItem(index = pauseSelection) {
    playSfx('ui-confirm')
    if (index === 0) resumeGame()
    if (index === 1) restartStage()
    if (index === 2) {
      settingsOrigin = 'pause'
      settingsSelection = 0
      settingsOpen = true
    }
    if (index === 3) returnToStageSelect()
  }

  function handleGlobalKeydown(event: KeyboardEvent) {
    hideVirtualControls()

    if (screen === 'title') {
      event.preventDefault()
      if (settingsOpen) {
        if (deleteSaveConfirmOpen) {
          if (event.key === 'Escape') cancelDeleteSave()
          else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.code === 'KeyA' || event.code === 'KeyD') {
            playSfx('ui-move')
            deleteSaveConfirmSelection = deleteSaveConfirmSelection === 0 ? 1 : 0
          } else if (event.code === 'Space' || event.key === 'Enter') {
            if (deleteSaveConfirmSelection === 0) cancelDeleteSave()
            else confirmDeleteSave()
          }
        } else if (event.key === 'Escape') closeSettings()
        else if (event.key === 'ArrowUp' || event.code === 'KeyW') {
          playSfx('ui-move')
          settingsSelection = (settingsSelection + 9) % 10
        } else if (event.key === 'ArrowDown' || event.code === 'KeyS') {
          playSfx('ui-move')
          settingsSelection = (settingsSelection + 1) % 10
        }
        else if (event.key === 'ArrowLeft' || event.code === 'KeyA') adjustSettings(settingsSelection, -1)
        else if (event.key === 'ArrowRight' || event.code === 'KeyD') adjustSettings(settingsSelection, 1)
        else if (event.code === 'Space' || event.key === 'Enter') activateSettingsItem()
      } else if (!titleMenuOpen) {
        openTitleMenu()
      } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.code === 'KeyW' || event.code === 'KeyS') {
        playSfx('ui-move')
        titleSelection = titleSelection === 0 ? 1 : 0
      } else if (event.code === 'Space' || event.key === 'Enter') {
        activateTitleItem()
      } else if (event.key === 'Escape') {
        playSfx('ui-back')
        titleMenuOpen = false
      }
      return
    }

    if (screen !== 'game') return

    if (hud.cleared) {
      if (event.key === 'Escape') {
        event.preventDefault()
        playSfx('ui-back')
        returnToStageSelect()
      } else if (event.key === 'ArrowLeft' || event.code === 'KeyA') {
        event.preventDefault()
        playSfx('ui-move')
        resultSelection = Math.max(0, resultSelection - 1)
      } else if (event.key === 'ArrowRight' || event.code === 'KeyD') {
        event.preventDefault()
        playSfx('ui-move')
        resultSelection = Math.min(getNextStageId(selectedStageId) ? 2 : 1, resultSelection + 1)
      } else if (event.code === 'Space' || event.key === 'Enter') {
        event.preventDefault()
        playSfx('ui-confirm')
        if (resultSelection === 0) restartStage()
        if (resultSelection === 1) returnToStageSelect()
        if (resultSelection === 2) enterNextStage()
      }
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      if (deleteSaveConfirmOpen) cancelDeleteSave()
      else if (settingsOpen) closeSettings()
      else if (paused) resumeGame()
      else pauseGame()
      return
    }

    if (!paused) return

    if (settingsOpen) {
      if (deleteSaveConfirmOpen) {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.code === 'KeyA' || event.code === 'KeyD') {
          event.preventDefault()
          playSfx('ui-move')
          deleteSaveConfirmSelection = deleteSaveConfirmSelection === 0 ? 1 : 0
        } else if (event.code === 'Space' || event.key === 'Enter') {
          event.preventDefault()
          if (deleteSaveConfirmSelection === 0) cancelDeleteSave()
          else confirmDeleteSave()
        }
      } else if (event.key === 'ArrowUp' || event.code === 'KeyW') {
        event.preventDefault()
        playSfx('ui-move')
        settingsSelection = (settingsSelection + 9) % 10
      } else if (event.key === 'ArrowDown' || event.code === 'KeyS') {
        event.preventDefault()
        playSfx('ui-move')
        settingsSelection = (settingsSelection + 1) % 10
      } else if (event.key === 'ArrowLeft' || event.code === 'KeyA') {
        event.preventDefault()
        adjustSettings(settingsSelection, -1)
      } else if (event.key === 'ArrowRight' || event.code === 'KeyD') {
        event.preventDefault()
        adjustSettings(settingsSelection, 1)
      } else if (event.code === 'Space' || event.key === 'Enter') {
        event.preventDefault()
        activateSettingsItem()
      }
      return
    }

    if (event.key === 'ArrowUp' || event.code === 'KeyW') {
      event.preventDefault()
      movePauseSelection(-1)
    } else if (event.key === 'ArrowDown' || event.code === 'KeyS') {
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

  function showVirtualControls() {
    if (screen === 'game' && !paused && !hud.cleared) virtualControlsVisible = true
  }

  function hideVirtualControls() {
    if (!virtualControlsVisible) return
    virtualControlsVisible = false
    window.dispatchEvent(new CustomEvent('projectrun:virtual-input', { detail: { type: 'move', x: 0 } }))
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
      if (pressed.size > 0 || horizontal !== 0 || vertical !== 0) hideVirtualControls()

      if (screen === 'title') {
        if (settingsOpen) {
          if (justPressed(12) || (vertical < 0 && gamepadAxisReady)) dispatchGamepadKey('ArrowUp')
          if (justPressed(13) || (vertical > 0 && gamepadAxisReady)) dispatchGamepadKey('ArrowDown')
          if (justPressed(14) || (horizontal < 0 && gamepadAxisReady)) dispatchGamepadKey('ArrowLeft')
          if (justPressed(15) || (horizontal > 0 && gamepadAxisReady)) dispatchGamepadKey('ArrowRight')
          if (justPressed(0)) dispatchGamepadKey('Enter')
          if (justPressed(1)) dispatchGamepadKey('Escape')
        } else if (!titleMenuOpen && pressed.size > 0) {
          dispatchGamepadKey('Enter')
        } else {
          if (justPressed(12) || (vertical < 0 && gamepadAxisReady)) dispatchGamepadKey('ArrowUp')
          if (justPressed(13) || (vertical > 0 && gamepadAxisReady)) dispatchGamepadKey('ArrowDown')
          if (justPressed(0)) dispatchGamepadKey('Enter')
          if (justPressed(1)) dispatchGamepadKey('Escape')
        }
      } else if (screen === 'select') {
        if (justPressed(14) || (horizontal < 0 && gamepadAxisReady)) dispatchGamepadKey('ArrowLeft')
        if (justPressed(15) || (horizontal > 0 && gamepadAxisReady)) dispatchGamepadKey('ArrowRight')
        if (justPressed(0)) dispatchGamepadKey('Enter')
        if (justPressed(1)) dispatchGamepadKey('Escape')
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
    saveData = loadSave()
    const storedSettings = localStorage.getItem(SETTINGS_KEY)
    if (storedSettings) {
      try {
        settings = { ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings), fullscreen: Boolean(document.fullscreenElement) }
      } catch {
        settings = { ...DEFAULT_SETTINGS }
      }
    }
    settings = { ...settings, language: setLocale(settings.language) }
    musicPlayer = new Audio(MUSIC_ASSETS.title)
    musicPlayer.id = 'bgm-player'
    musicPlayer.dataset.track = 'title'
    musicPlayer.hidden = true
    musicPlayer.loop = true
    musicPlayer.preload = 'auto'
    document.body.append(musicPlayer)
    musicPlayer.load()
    musicPlayer.addEventListener('canplay', ensureDesiredMusicPlaying)
    for (const [name, source] of Object.entries(SFX_ASSETS)) {
      const audio = new Audio(source)
      audio.preload = 'auto'
      audio.load()
      sfx.set(name, audio)
    }
    void attemptTitleMusicAutoplay()
    window.addEventListener('projectrun:hud', handleHudEvent)
    window.addEventListener('projectrun:sfx', handleSfxEvent)
    window.addEventListener('projectrun:prepare-music', handlePrepareMusicEvent)
    window.addEventListener('keydown', handleGlobalKeydown)
    window.addEventListener('keydown', unlockMusic)
    window.addEventListener('pointerdown', unlockMusic)
    window.addEventListener('touchstart', unlockMusic)
    const handleVisibilityChange = () => {
      if (!document.hidden) void ensureDesiredMusicPlaying()
    }
    const handleFullscreenChange = () => {
      settings = { ...settings, fullscreen: Boolean(document.fullscreenElement) }
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    gamepadFrame = window.requestAnimationFrame(pollGamepad)
    void preloadGameAssets()

    return () => {
      window.removeEventListener('projectrun:hud', handleHudEvent)
      window.removeEventListener('projectrun:sfx', handleSfxEvent)
      window.removeEventListener('projectrun:prepare-music', handlePrepareMusicEvent)
      window.removeEventListener('keydown', handleGlobalKeydown)
      window.removeEventListener('keydown', unlockMusic)
      window.removeEventListener('pointerdown', unlockMusic)
      window.removeEventListener('touchstart', unlockMusic)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.cancelAnimationFrame(gamepadFrame)
      window.clearTimeout(musicRetryTimer)
      cancelMusicFade()
      musicPlayer?.removeEventListener('canplay', ensureDesiredMusicPlaying)
      musicPlayer?.pause()
      musicPlayer?.remove()
      game?.destroy(true)
    }
  })
</script>

<main class="shell">
  {#if !bootReady}
    <section class="game-panel boot-screen" aria-label="Loading game">
      <div class="boot-emblem">✦</div>
      <strong>Project Almost</strong>
      <span>{$translator('boot.initializing')}</span>
      <div class="boot-meter"><i style={`width:${bootProgress}%`}></i></div>
      <b>{String(bootProgress).padStart(3, '0')}%</b>
    </section>
  {:else if screen === 'title'}
    <section class="game-panel">
      <TitleScreen
        menuOpen={titleMenuOpen}
        selectedItem={titleSelection}
        onOpenMenu={openTitleMenu}
        onSelect={(index) => titleSelection = index}
        onActivate={activateTitleItem}
      />
      {#if settingsOpen}
        <div class="title-settings-overlay" role="presentation" onclick={closeSettingsFromBackdrop}>
          <SettingsPanel
            {settings}
            selectedItem={settingsSelection}
            onSelect={(index) => settingsSelection = index}
            onAdjust={adjustSettings}
            onActivate={activateSettingsItem}
            confirmDelete={deleteSaveConfirmOpen}
            confirmSelection={deleteSaveConfirmSelection}
            onCancelDelete={cancelDeleteSave}
            onConfirmDelete={confirmDeleteSave}
          />
        </div>
      {/if}
    </section>
  {:else if screen === 'select'}
    <section class="game-panel" aria-label="White Palace stage select">
      <StageSelect onEnter={enterStage} onBack={returnToTitle} {saveData} initialStageId={selectedStageId} />
    </section>
  {:else}
  <section class="game-panel game-enter" aria-label={`White Palace ${selectedStageId} gameplay`}>
    <div class="game-frame">
      <div class="play-surface" role="application" aria-label="Gameplay touch area" onpointerdown={showVirtualControls}>
        <div bind:this={gameHost} class="game-host"></div>

        <div class="hud-layer" aria-label="White Palace HUD">
          <section class="hud-panel status-hud">
            <span class="corner tl"></span>
            <span class="corner tr"></span>
            <span class="corner bl"></span>
            <span class="corner br"></span>
            <div class="hud-label"><span></span>{$translator('hud.systemStatus')}</div>
            <div class="status-body">
              <img class="portrait-slot" src={IMAGE_ASSETS.playerPortrait} alt="Yuuta Tsubasa" />
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
                <strong>White Palace {selectedStageId}</strong>
                <span>{$translator(`stage.${selectedStageId}.subtitle`)}</span>
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
            <div class="hud-label"><span></span>{$translator('hud.mapOverview')}</div>
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
            <div class="hud-label"><span></span>{$translator('hud.objective')}</div>
            <p>{$translator('stage.objective.reachGoal')}</p>
          </section>

          <section class="bottom-hud">
            <div class="bottom-fill">
              <div class="skill-group">
                <div class="hud-label"><span></span>{$translator('hud.controls')}</div>
                <div class="skills">
                  <div><b>← →</b><span>{$translator('hud.move')}</span></div>
                  <div><b>Space</b><span>{$translator('hud.jump')}</span></div>
                  <div><b>J</b><span>{$translator('hud.attack')}</span></div>
                  <div><b>Air + J</b><span>{$translator('hud.homing')}</span></div>
                </div>
              </div>
              <div class="ai-callout">
                <img class="ai-face" src={IMAGE_ASSETS.aiNavigator} alt="Palace navigator AI" />
                <div>
                  <span>{$translator('hud.navigator')}</span>
                  <p>› {$translator(hud.statusMessage as TranslationKey, hud.statusParams)}</p>
                </div>
              </div>
              <div class="readouts">
                <div>
                  <span>{$translator('hud.time')}</span>
                  <b>{hud.time}</b>
                </div>
                <div>
                  <span>{$translator('hud.coins')}</span>
                  <b>{hud.coins} <small>/ {hud.coinTarget}</small></b>
                </div>
                <div>
                  <span>{$translator('hud.damage')}</span>
                  <b>{hud.damageTaken}</b>
                </div>
                <div>
                  <span>{$translator('hud.falls')}</span>
                  <b>{hud.falls}</b>
                </div>
                <div>
                  <span>{$translator('hud.enemies')}</span>
                  <b>{hud.enemiesDefeated} <small>/ {hud.enemyTarget}</small></b>
                </div>
                <div>
                  <span>{$translator('hud.checkpoints')}</span>
                  <b>{hud.checkpointsReached} <small>/ {hud.checkpointTarget}</small></b>
                </div>
                <div class="live-rank">
                  <span>{$translator('hud.rank')}</span>
                  <b class={`rank-${hud.rank.toLowerCase()}`}>{hud.rank}</b>
                </div>
              </div>
            </div>
          </section>

          {#if hud.cleared}
            <StageResult
              stageId={selectedStageId}
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
              onNextStage={enterNextStage}
              nextStageAvailable={Boolean(getNextStageId(selectedStageId) && saveData.stageRecords[selectedStageId]?.cleared)}
              selectedAction={resultSelection}
              onSelectAction={(index) => resultSelection = index}
            />
          {/if}

          {#if paused}
            <div class="pause-overlay" role="presentation" onclick={settingsOpen ? closeSettingsFromBackdrop : undefined}>
              {#if settingsOpen}
                <SettingsPanel
                  {settings}
                  selectedItem={settingsSelection}
                  onSelect={(index) => settingsSelection = index}
                  onAdjust={adjustSettings}
                  onActivate={activateSettingsItem}
                  confirmDelete={deleteSaveConfirmOpen}
                  confirmSelection={deleteSaveConfirmSelection}
                  onCancelDelete={cancelDeleteSave}
                  onConfirmDelete={confirmDeleteSave}
                />
              {:else}
              <div class="pause-menu">
                <span class="pause-kicker">{$translator('settings.systemMenu')}</span>
                <strong>{$translator('pause.paused')}</strong>
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
                      <b>{$translator(item)}</b>
                    </button>
                  {/each}
                </nav>
                <p><kbd>↑</kbd><kbd>↓</kbd> {$translator('common.select')} <kbd>Enter</kbd> {$translator('common.confirm')} <kbd>Esc</kbd> {$translator('pause.resume')}</p>
              </div>
              {/if}
            </div>
          {/if}
        </div>
        {#if virtualControlsVisible && !paused && !hud.cleared}
          <VirtualControls onPause={pauseGame} />
        {/if}
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
