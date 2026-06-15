<script lang="ts">
  import { onMount, tick } from 'svelte'
  import type Phaser from 'phaser'
  import AvgOverlay from './AvgOverlay.svelte'
  import StageSelect from './StageSelect.svelte'
  import StageResult from './StageResult.svelte'
  import SettingsPanel, { type GameSettings } from './SettingsPanel.svelte'
  import TitleScreen from './TitleScreen.svelte'
  import VirtualControls from './VirtualControls.svelte'
  import WorldSelect from './WorldSelect.svelte'
  import { IMAGE_ASSETS, SFX_ASSETS, type MusicTrack } from './game/assets/assetManifest'
  import { bootAssets, getWorldAssets, preloadAssets, preloadInBackground, sharedGameplayAssets, worldSelectAssets } from './game/assets/preloader'
  import { createMusicController, type MusicController } from './game/audio/musicController'
  import { getStageIntroSequence } from './game/avg/avgRegistry'
  import type { AvgSequence } from './game/avg/avgTypes'
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
  let screen: 'title' | 'world' | 'select' | 'game' = 'title'
  let selectedStageId: StageId = '1-1'
  let selectedWorldIndex = 1
  let titleMenuOpen = false
  let titleSelection = 0
  let returnToTitlePending = false
  let transitionPhase: 'idle' | 'cover' | 'reveal' = 'idle'
  let transitionStyle: 'page' | 'world-stage-forward' | 'world-stage-back' = 'page'
  let paused = false
  let pauseSelection = 0
  let settingsOpen = false
  let settingsOrigin: 'title' | 'pause' = 'pause'
  let settingsSelection = 0
  let deleteSaveConfirmOpen = false
  let deleteSaveConfirmSelection = 0
  let resultSelection = 0
  let activeAvg: AvgSequence | undefined
  let avgLineIndex = 0
  let saveData: SaveData = { version: 1, stageRecords: {} }
  let gamepadFrame = 0
  let gamepadPrevious = new Set<number>()
  let gamepadAxisReady = true
  let virtualControlsVisible = false
  let music: MusicController | undefined
  const sfx = new Map<string, HTMLAudioElement>()
  const BASE_MUSIC_VOLUME = 0.42
  const SETTINGS_KEY = 'project-almost:settings'
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

  function getWorldMusicTrack(kind: 'bgm' | 'map'): MusicTrack {
    const world = String(selectedWorldIndex).padStart(2, '0')
    return `world${world}${kind === 'bgm' ? 'Bgm' : 'Map'}` as MusicTrack
  }

  function getStageMusicTrack(stageId = selectedStageId): MusicTrack {
    const world = stageId.split('-')[0].padStart(2, '0')
    return `world${world}${stageId.endsWith('-6') ? 'Boss' : 'Bgm'}` as MusicTrack
  }

  function getShellBackdrop() {
    if (screen === 'title') return IMAGE_ASSETS.titleBackground
    const worldBackdrops = [
      IMAGE_ASSETS.stageSelectBackground,
      IMAGE_ASSETS.emeraldSanctuaryStageSelect,
      IMAGE_ASSETS.ceruleanDepthsStageSelect,
      IMAGE_ASSETS.frostveilPeaksStageSelect,
      IMAGE_ASSETS.emberfallCalderaStageSelect,
      IMAGE_ASSETS.abyssalHollowStageSelect,
    ]
    return worldBackdrops[selectedWorldIndex - 1] ?? IMAGE_ASSETS.stageSelectBackground
  }

  function syncMusic() {
    if (!music?.isUnlocked) return
    const volume = BASE_MUSIC_VOLUME * (settings.masterVolume / 100) * (settings.musicVolume / 100)

    if (screen === 'title') {
      music.setDesired('title', volume * (titleMenuOpen ? 1 : 0.35))
    } else if (screen === 'world') {
      music.setDesired(getWorldMusicTrack('bgm'), volume)
    } else if (screen === 'select') {
      music.setDesired(getWorldMusicTrack('map'), volume)
    } else {
      if (hud.cleared) {
        music.setDesired('result', volume)
      } else {
        music.setDesired(getStageMusicTrack(), paused ? volume * 0.45 : volume)
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
    if (!music) return
    const wasUnlocked = music.isUnlocked
    music.unlock()
    // On first unlock the controller has no real desired state yet; push it from
    // the current screen. When already unlocked, unlock() reconciled (covers a
    // tab that came back paused).
    if (!wasUnlocked) syncMusic()
  }

  function openTitleMenu() {
    if (titleMenuOpen) return
    playSfx('ui-confirm')
    titleMenuOpen = true
    syncMusic()
  }

  async function attemptTitleMusicAutoplay() {
    if (!music) return
    const volume = BASE_MUSIC_VOLUME * (settings.masterVolume / 100) * (settings.musicVolume / 100) * 0.35
    const ok = await music.attemptAutoplay(volume)
    if (ok) syncMusic()
  }

  async function preloadGameAssets() {
    await preloadAssets(bootAssets, (completed, total) => {
      bootProgress = Math.round((completed / Math.max(1, total)) * 100)
    })
    await document.fonts.ready
    bootProgress = 100
    await new Promise((resolve) => window.setTimeout(resolve, 180))
    bootReady = true
    preloadInBackground([...worldSelectAssets, ...sharedGameplayAssets, ...getWorldAssets(1)])
  }

  async function enterStage(stageId: StageId) {
    if (transitionPhase !== 'idle') return
    hideVirtualControls()
    selectedStageId = stageId
    transitionPhase = 'cover'
    await new Promise((resolve) => window.setTimeout(resolve, 260))
    await preloadAssets([...sharedGameplayAssets, ...getWorldAssets(Number(stageId.split('-')[0]))])
    screen = 'game'
    paused = false
    resultSelection = 0
    music?.reset('result')
    syncMusic()
    await createStageGame()
    resumeStageMusic()
    beginStageIntro()
    await new Promise((resolve) => window.setTimeout(resolve, 420))
    resetGameLoopTiming()
    transitionPhase = 'reveal'
    window.setTimeout(() => {
      transitionPhase = 'idle'
    }, 620)
  }

  async function enterStageSelect() {
    if (transitionPhase !== 'idle') return
    preloadInBackground([...worldSelectAssets, ...getWorldAssets(selectedWorldIndex)])
    transitionStyle = 'world-stage-forward'
    transitionPhase = 'cover'
    await new Promise((resolve) => window.setTimeout(resolve, 300))
    screen = 'select'
    syncMusic()
    await new Promise((resolve) => window.setTimeout(resolve, 140))
    transitionPhase = 'reveal'
    window.setTimeout(() => {
      transitionPhase = 'idle'
      transitionStyle = 'page'
      if (returnToTitlePending) {
        returnToTitlePending = false
        void returnToTitle()
      }
    }, 620)
  }

  async function enterWorldSelect() {
    if (transitionPhase !== 'idle') return
    transitionStyle = screen === 'select' ? 'world-stage-back' : 'page'
    transitionPhase = 'cover'
    await new Promise((resolve) => window.setTimeout(resolve, transitionStyle === 'page' ? 260 : 300))
    screen = 'world'
    syncMusic()
    await new Promise((resolve) => window.setTimeout(resolve, transitionStyle === 'page' ? 280 : 140))
    transitionPhase = 'reveal'
    window.setTimeout(() => {
      transitionPhase = 'idle'
      transitionStyle = 'page'
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
    playSfx(index === 2 ? 'ui-back' : 'ui-confirm')
    if (index === 0) {
      music?.prepare(getWorldMusicTrack('bgm'))
      void enterWorldSelect()
    }
    if (index === 1) {
      settingsOrigin = 'title'
      settingsSelection = 0
      settingsOpen = true
    }
    if (index === 2) {
      titleMenuOpen = false
      titleSelection = 0
      syncMusic()
    }
  }

  function returnToStageSelect() {
    hideVirtualControls()
    game?.destroy(true)
    game = undefined
    activeAvg = undefined
    paused = false
    hud = { ...hud, coins: 0, damageTaken: 0, falls: 0, enemiesDefeated: 0, checkpointsReached: 0, time: '00:00.00', rank: '--', cleared: false }
    screen = 'select'
    syncMusic()
  }

  function pauseGame() {
    if (!game || hud.cleared || activeAvg) return
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

  function resumeStageMusic() {
    syncMusic()
    music?.nudge()
  }

  function beginStageIntro() {
    const sequence = getStageIntroSequence(selectedStageId)
    if (!sequence || !game) {
      activeAvg = undefined
      return
    }

    hideVirtualControls()
    activeAvg = sequence
    avgLineIndex = 0
    window.dispatchEvent(new CustomEvent('projectrun:avg-state', { detail: { active: true } }))
    window.requestAnimationFrame(() => {
      if (activeAvg?.id === sequence.id) {
        window.dispatchEvent(new CustomEvent('projectrun:avg-state', { detail: { active: true } }))
      }
    })
  }

  function advanceAvg() {
    if (!activeAvg) return
    playSfx('ui-confirm')
    if (avgLineIndex < activeAvg.lines.length - 1) {
      avgLineIndex += 1
      return
    }
    finishAvg()
  }

  function finishAvg() {
    if (!activeAvg) return
    activeAvg = undefined
    avgLineIndex = 0
    window.dispatchEvent(new CustomEvent('projectrun:avg-state', { detail: { active: false } }))
    resetGameLoopTiming()
  }

  async function restartStage() {
    if (!game || transitionPhase !== 'idle') return
    hideVirtualControls()
    music?.reset(getStageMusicTrack())
    music?.prepare(getStageMusicTrack())
    transitionPhase = 'cover'
    await new Promise((resolve) => window.setTimeout(resolve, 260))
    game.destroy(true)
    game = undefined
    paused = false
    resultSelection = 0
    music?.reset('result')
    hud = { ...hud, coins: 0, damageTaken: 0, falls: 0, enemiesDefeated: 0, checkpointsReached: 0, time: '00:00.00', rank: '--', cleared: false }
    syncMusic()
    await createStageGame()
    resumeStageMusic()
    beginStageIntro()
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
    music?.reset(getStageMusicTrack())
    transitionPhase = 'cover'
    await new Promise((resolve) => window.setTimeout(resolve, 260))
    game.destroy(true)
    game = undefined
    selectedStageId = nextStageId
    music?.prepare(getStageMusicTrack(nextStageId))
    paused = false
    resultSelection = 0
    music?.reset('result')
    hud = { ...hud, coins: 0, damageTaken: 0, falls: 0, enemiesDefeated: 0, checkpointsReached: 0, time: '00:00.00', rank: '--', cleared: false }
    syncMusic()
    await createStageGame()
    resumeStageMusic()
    beginStageIntro()
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
        const direction = event.key === 'ArrowUp' || event.code === 'KeyW' ? -1 : 1
        titleSelection = (titleSelection + direction + 3) % 3
      } else if (event.code === 'Space' || event.key === 'Enter') {
        activateTitleItem()
      } else if (event.key === 'Escape') {
        playSfx('ui-back')
        titleMenuOpen = false
      }
      return
    }

    if (screen !== 'game') return

    if (activeAvg) {
      event.preventDefault()
      event.stopImmediatePropagation()
      if (event.key === 'Escape') finishAvg()
      else if (event.code === 'Space' || event.key === 'Enter') advanceAvg()
      return
    }

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
    if (screen === 'game' && !paused && !hud.cleared && !activeAvg) virtualControlsVisible = true
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
      } else if (screen === 'world' || screen === 'select') {
        if (screen === 'world') {
          if (justPressed(12) || (vertical < 0 && gamepadAxisReady)) dispatchGamepadKey('ArrowUp')
          if (justPressed(13) || (vertical > 0 && gamepadAxisReady)) dispatchGamepadKey('ArrowDown')
        }
        if (justPressed(14) || (horizontal < 0 && gamepadAxisReady)) dispatchGamepadKey('ArrowLeft')
        if (justPressed(15) || (horizontal > 0 && gamepadAxisReady)) dispatchGamepadKey('ArrowRight')
        if (justPressed(0)) dispatchGamepadKey('Enter')
        if (justPressed(1)) dispatchGamepadKey('Escape')
      } else if (activeAvg) {
        if (justPressed(0)) dispatchGamepadKey('Enter')
        if (justPressed(1) || justPressed(9)) dispatchGamepadKey('Escape')
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
    music = createMusicController({ initialTrack: 'title' })
    for (const [name, source] of Object.entries(SFX_ASSETS)) {
      const audio = new Audio(source)
      audio.preload = 'auto'
      audio.load()
      sfx.set(name, audio)
    }
    void attemptTitleMusicAutoplay()
    window.addEventListener('projectrun:hud', handleHudEvent)
    window.addEventListener('projectrun:sfx', handleSfxEvent)
    window.addEventListener('keydown', handleGlobalKeydown)
    window.addEventListener('keydown', unlockMusic)
    window.addEventListener('pointerdown', unlockMusic)
    window.addEventListener('touchstart', unlockMusic)
    const handleVisibilityChange = () => {
      if (!document.hidden) music?.nudge()
    }
    const handleFullscreenChange = () => {
      settings = { ...settings, fullscreen: Boolean(document.fullscreenElement) }
    }
    const preventBrowserGesture = (event: Event) => event.preventDefault()
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('gesturestart', preventBrowserGesture, { passive: false })
    document.addEventListener('gesturechange', preventBrowserGesture, { passive: false })
    document.addEventListener('gestureend', preventBrowserGesture, { passive: false })
    document.addEventListener('contextmenu', preventBrowserGesture)
    gamepadFrame = window.requestAnimationFrame(pollGamepad)
    void preloadGameAssets()

    return () => {
      window.removeEventListener('projectrun:hud', handleHudEvent)
      window.removeEventListener('projectrun:sfx', handleSfxEvent)
      window.removeEventListener('keydown', handleGlobalKeydown)
      window.removeEventListener('keydown', unlockMusic)
      window.removeEventListener('pointerdown', unlockMusic)
      window.removeEventListener('touchstart', unlockMusic)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('gesturestart', preventBrowserGesture)
      document.removeEventListener('gesturechange', preventBrowserGesture)
      document.removeEventListener('gestureend', preventBrowserGesture)
      document.removeEventListener('contextmenu', preventBrowserGesture)
      window.cancelAnimationFrame(gamepadFrame)
      music?.destroy()
      music = undefined
      game?.destroy(true)
    }
  })
</script>

<main class="shell" style={`--shell-backdrop:url("${getShellBackdrop()}")`}>
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
  {:else if screen === 'world'}
    <section class="game-panel" aria-label="World select">
      <WorldSelect
        onSelect={(worldIndex) => {
          selectedWorldIndex = worldIndex
          syncMusic()
          preloadInBackground(getWorldAssets(worldIndex))
        }}
        onEnter={(worldIndex) => {
          selectedWorldIndex = worldIndex
          void enterStageSelect()
        }}
        onBack={returnToTitle}
        initialWorldIndex={selectedWorldIndex}
        {saveData}
      />
    </section>
  {:else if screen === 'select'}
    <section class="game-panel" aria-label="White Palace stage select">
      <StageSelect onEnter={enterStage} onBack={enterWorldSelect} {saveData} initialStageId={selectedStageId} worldIndex={selectedWorldIndex} />
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
            <p>{$translator(selectedStageId === '1-6' ? 'stage.objective.defeatBoss' : 'stage.objective.reachGoal')}</p>
          </section>

          <section class="bottom-hud">
            <div class="bottom-fill">
              <div class="skill-group">
                <div class="hud-label"><span></span>{$translator('hud.controls')}</div>
                <div class="skills">
                  <div><b>← →</b><span>{$translator('hud.move')}</span></div>
                  <div><b>Space ×2</b><span>{$translator('hud.jump')}</span></div>
                  <div><b>↓ / S</b><span>{$translator('hud.crouch')}</span></div>
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

          {#if activeAvg}
            <AvgOverlay
              sequence={activeAvg}
              lineIndex={avgLineIndex}
              onAdvance={advanceAvg}
              onSkip={finishAvg}
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
        {#if virtualControlsVisible && !paused && !hud.cleared && !activeAvg}
          <VirtualControls onPause={pauseGame} />
        {/if}
      </div>
    </div>
  </section>
  {/if}

  {#if transitionPhase !== 'idle'}
    <div
      class:reveal={transitionPhase === 'reveal'}
      class:world-shift={transitionStyle !== 'page'}
      class:reverse={transitionStyle === 'world-stage-back'}
      class="page-transition"
      aria-hidden="true"
    >
      <div class="transition-emblem">✦</div>
    </div>
  {/if}
</main>
