# Audio Playback System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Title and World Select music/SFX playback system, connect Settings volume changes to playback, and copy the runtime audio assets needed by this slice.

**Architecture:** Pure audio policy lives in `src/domain/audio/`. Application command helpers live in `src/application/audio/`. `src/App.svelte` remains the browser coordinator and delegates actual `HTMLAudioElement` behavior to a browser audio controller.

**Tech Stack:** Svelte 5, TypeScript, Vite public assets, Vitest, browser `HTMLAudioElement`.

---

## File Structure

- Create `src/domain/audio/audioAssets.ts`: music/SFX ids and public asset manifests.
- Create `src/domain/audio/audioPolicy.ts`: volume calculators, screen-to-music policy, action-to-SFX policy.
- Create `src/domain/audio/audioPolicy.test.ts`: pure domain tests.
- Create `src/application/audio/audioCommands.ts`: command constructors for music and SFX.
- Create `src/application/audio/audioCommands.test.ts`: application command tests.
- Create `src/application/audio/browserAudioController.ts`: browser adapter for music and SFX playback.
- Modify `src/App.svelte`: instantiate audio controller, sync music after state/settings changes, and emit SFX for Title, World Select, and Settings actions.
- Copy files from `__prototype__/public/assets/audio/` to `public/assets/audio/`.

## Task 1: Domain Audio Policy

**Files:**
- Create: `src/domain/audio/audioAssets.ts`
- Create: `src/domain/audio/audioPolicy.ts`
- Test: `src/domain/audio/audioPolicy.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from '../settings/settings'
import {
  MUSIC_ASSETS,
  SFX_ASSETS,
  computeMusicVolume,
  computeSfxVolume,
  getMusicForScreen,
  getSfxForAction,
} from './audioPolicy'

describe('audio asset manifests', () => {
  it('declares the public audio assets used by title and world select', () => {
    expect(MUSIC_ASSETS).toEqual({
      title: '/assets/audio/titlescreen.mp3',
      world01Bgm: '/assets/audio/world01_bgm.mp3',
      world02Bgm: '/assets/audio/world02_bgm.mp3',
      world03Bgm: '/assets/audio/world03_bgm.mp3',
      world04Bgm: '/assets/audio/world04_bgm.mp3',
      world05Bgm: '/assets/audio/world05_bgm.mp3',
      world06Bgm: '/assets/audio/world06_bgm.mp3',
    })
    expect(SFX_ASSETS).toEqual({
      'ui-move': '/assets/audio/sfx/ui-move.wav',
      'ui-confirm': '/assets/audio/sfx/ui-confirm.wav',
      'ui-back': '/assets/audio/sfx/ui-back.wav',
    })
  })
})

describe('audio volume policy', () => {
  it('computes prototype music and sfx volumes from settings', () => {
    expect(computeMusicVolume(DEFAULT_SETTINGS)).toBeCloseTo(0.336)
    expect(computeMusicVolume(DEFAULT_SETTINGS, 0.35)).toBeCloseTo(0.1176)
    expect(computeSfxVolume(DEFAULT_SETTINGS)).toBeCloseTo(0.8)
  })
})

describe('screen music policy', () => {
  it('maps title screens and world select to the expected music tracks and volumes', () => {
    expect(getMusicForScreen({ type: 'title-intro' }, DEFAULT_SETTINGS)).toEqual({
      track: 'title',
      volume: 0.1176,
    })
    expect(getMusicForScreen({ type: 'title-menu', selectedItemIndex: 0 }, DEFAULT_SETTINGS)).toEqual({
      track: 'title',
      volume: 0.336,
    })
    expect(getMusicForScreen({ type: 'world-select', selectedWorldIndex: 2 }, DEFAULT_SETTINGS)).toEqual({
      track: 'world03Bgm',
      volume: 0.336,
    })
  })

  it('falls back to world one music for out-of-range world indexes', () => {
    expect(getMusicForScreen({ type: 'world-select', selectedWorldIndex: 99 }, DEFAULT_SETTINGS).track).toBe(
      'world01Bgm',
    )
  })
})

describe('ui sfx policy', () => {
  it('maps ui actions to prototype sfx ids', () => {
    expect(getSfxForAction('move')).toBe('ui-move')
    expect(getSfxForAction('confirm')).toBe('ui-confirm')
    expect(getSfxForAction('back')).toBe('ui-back')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/domain/audio/audioPolicy.test.ts`

Expected: FAIL because `src/domain/audio/audioPolicy.ts` does not exist.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/domain/audio/audioAssets.ts
export const MUSIC_ASSETS = {
  title: '/assets/audio/titlescreen.mp3',
  world01Bgm: '/assets/audio/world01_bgm.mp3',
  world02Bgm: '/assets/audio/world02_bgm.mp3',
  world03Bgm: '/assets/audio/world03_bgm.mp3',
  world04Bgm: '/assets/audio/world04_bgm.mp3',
  world05Bgm: '/assets/audio/world05_bgm.mp3',
  world06Bgm: '/assets/audio/world06_bgm.mp3',
} as const

export const SFX_ASSETS = {
  'ui-move': '/assets/audio/sfx/ui-move.wav',
  'ui-confirm': '/assets/audio/sfx/ui-confirm.wav',
  'ui-back': '/assets/audio/sfx/ui-back.wav',
} as const

export type MusicTrackId = keyof typeof MUSIC_ASSETS
export type SfxId = keyof typeof SFX_ASSETS
```

```ts
// src/domain/audio/audioPolicy.ts
import type { AppScreen } from '../app/appFlow'
import type { GameSettings } from '../settings/settings'
import { MUSIC_ASSETS, SFX_ASSETS, type MusicTrackId, type SfxId } from './audioAssets'

export { MUSIC_ASSETS, SFX_ASSETS }

export type UiSfxAction = 'move' | 'confirm' | 'back'

export type MusicDecision = {
  track: MusicTrackId
  volume: number
}

const BASE_MUSIC_VOLUME = 0.42
const TITLE_INTRO_VOLUME_MULTIPLIER = 0.35
const WORLD_BGM_TRACKS: readonly MusicTrackId[] = [
  'world01Bgm',
  'world02Bgm',
  'world03Bgm',
  'world04Bgm',
  'world05Bgm',
  'world06Bgm',
]

export function computeMusicVolume(settings: GameSettings, multiplier = 1): number {
  return BASE_MUSIC_VOLUME * (settings.masterVolume / 100) * (settings.musicVolume / 100) * multiplier
}

export function computeSfxVolume(settings: GameSettings): number {
  return (settings.masterVolume / 100) * (settings.sfxVolume / 100)
}

export function getMusicForScreen(screen: AppScreen, settings: GameSettings): MusicDecision {
  if (screen.type === 'title-intro') {
    return { track: 'title', volume: computeMusicVolume(settings, TITLE_INTRO_VOLUME_MULTIPLIER) }
  }
  if (screen.type === 'world-select') {
    return {
      track: WORLD_BGM_TRACKS[screen.selectedWorldIndex] ?? 'world01Bgm',
      volume: computeMusicVolume(settings),
    }
  }
  return { track: 'title', volume: computeMusicVolume(settings) }
}

export function getSfxForAction(action: UiSfxAction): SfxId {
  if (action === 'move') return 'ui-move'
  if (action === 'back') return 'ui-back'
  return 'ui-confirm'
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/domain/audio/audioPolicy.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/audio/audioAssets.ts src/domain/audio/audioPolicy.ts src/domain/audio/audioPolicy.test.ts
git commit -m "feat: add audio domain policy"
```

## Task 2: Application Audio Commands

**Files:**
- Create: `src/application/audio/audioCommands.ts`
- Test: `src/application/audio/audioCommands.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from '../../domain/settings/settings'
import { createMusicCommand, createSfxCommand } from './audioCommands'

describe('createMusicCommand', () => {
  it('wraps screen music policy in a set-music command', () => {
    expect(createMusicCommand({ type: 'world-select', selectedWorldIndex: 5 }, DEFAULT_SETTINGS)).toEqual({
      type: 'set-music',
      track: 'world06Bgm',
      volume: 0.336,
    })
  })
})

describe('createSfxCommand', () => {
  it('wraps sfx policy in a play-sfx command with computed volume', () => {
    expect(createSfxCommand('confirm', DEFAULT_SETTINGS)).toEqual({
      type: 'play-sfx',
      sound: 'ui-confirm',
      volume: 0.8,
    })
  })

  it('returns null when master or sfx volume would make sound inaudible', () => {
    expect(createSfxCommand('move', { ...DEFAULT_SETTINGS, masterVolume: 0 })).toBeNull()
    expect(createSfxCommand('move', { ...DEFAULT_SETTINGS, sfxVolume: 0 })).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/application/audio/audioCommands.test.ts`

Expected: FAIL because `src/application/audio/audioCommands.ts` does not exist.

- [ ] **Step 3: Write minimal implementation**

```ts
import type { AppScreen } from '../../domain/app/appFlow'
import {
  computeSfxVolume,
  getMusicForScreen,
  getSfxForAction,
  type UiSfxAction,
} from '../../domain/audio/audioPolicy'
import type { MusicTrackId, SfxId } from '../../domain/audio/audioAssets'
import type { GameSettings } from '../../domain/settings/settings'

export type AudioCommand =
  | { type: 'set-music'; track: MusicTrackId; volume: number }
  | { type: 'prepare-music'; track: MusicTrackId }
  | { type: 'play-sfx'; sound: SfxId; volume: number }

export function createMusicCommand(screen: AppScreen, settings: GameSettings): AudioCommand {
  return { type: 'set-music', ...getMusicForScreen(screen, settings) }
}

export function createPrepareMusicCommand(track: MusicTrackId): AudioCommand {
  return { type: 'prepare-music', track }
}

export function createSfxCommand(action: UiSfxAction, settings: GameSettings): AudioCommand | null {
  const volume = computeSfxVolume(settings)
  if (volume <= 0) return null
  return { type: 'play-sfx', sound: getSfxForAction(action), volume }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/application/audio/audioCommands.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/application/audio/audioCommands.ts src/application/audio/audioCommands.test.ts
git commit -m "feat: add audio application commands"
```

## Task 3: Browser Audio Controller

**Files:**
- Create: `src/application/audio/browserAudioController.ts`
- Test: `src/application/audio/browserAudioController.test.ts`

- [ ] **Step 1: Write the failing adapter test**

```ts
import { afterEach, describe, expect, it } from 'vitest'
import { createBrowserAudioController } from './browserAudioController'

class FakeAudio {
  id = ''
  dataset: Record<string, string> = {}
  hidden = false
  loop = false
  preload = ''
  volume = 1
  paused = true
  src: string
  currentTime = 0
  played = 0
  loaded = 0
  removed = false

  constructor(source: string) {
    this.src = source
  }

  load() {
    this.loaded += 1
  }

  async play() {
    this.played += 1
    this.paused = false
  }

  pause() {
    this.paused = true
  }

  remove() {
    this.removed = true
  }

  cloneNode() {
    return new FakeAudio(this.src)
  }
}

describe('BrowserAudioController', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('creates a hidden looping title music element and preloads sfx sources', () => {
    const created: FakeAudio[] = []

    const controller = createBrowserAudioController({
      createAudio: (source) => {
        const audio = new FakeAudio(source)
        created.push(audio)
        return audio as unknown as HTMLAudioElement
      },
      requestAnimationFrame: (callback) => {
        callback(performance.now() + 450)
        return 1
      },
      cancelAnimationFrame: () => {},
    })

    expect(created.map((audio) => audio.src)).toEqual([
      '/assets/audio/titlescreen.mp3',
      '/assets/audio/sfx/ui-move.wav',
      '/assets/audio/sfx/ui-confirm.wav',
      '/assets/audio/sfx/ui-back.wav',
    ])
    expect(created[0]).toMatchObject({ id: 'bgm-player', hidden: true, loop: true, volume: 0 })

    controller.destroy()
    expect(created[0].removed).toBe(true)
  })

  it('reconciles the desired music after unlock and switches tracks', async () => {
    const created: FakeAudio[] = []
    const controller = createBrowserAudioController({
      createAudio: (source) => {
        const audio = new FakeAudio(source)
        created.push(audio)
        return audio as unknown as HTMLAudioElement
      },
      requestAnimationFrame: (callback) => {
        callback(performance.now() + 450)
        return 1
      },
      cancelAnimationFrame: () => {},
    })

    controller.execute({ type: 'set-music', track: 'world02Bgm', volume: 0.25 })
    expect(created[0].played).toBe(0)

    controller.unlock()
    await Promise.resolve()
    await Promise.resolve()

    expect(created[0].src).toBe('/assets/audio/world02_bgm.mp3')
    expect(created[0].dataset.track).toBe('world02Bgm')
    expect(created[0].played).toBe(1)
    expect(created[0].volume).toBe(0.25)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/application/audio/browserAudioController.test.ts`

Expected: FAIL because `src/application/audio/browserAudioController.ts` does not exist.

- [ ] **Step 3: Write minimal adapter implementation**

```ts
import { MUSIC_ASSETS, SFX_ASSETS, type MusicTrackId, type SfxId } from '../../domain/audio/audioAssets'
import type { AudioCommand } from './audioCommands'

type BrowserAudioControllerOptions = {
  createAudio?: (source: string) => HTMLAudioElement
  requestAnimationFrame?: typeof window.requestAnimationFrame
  cancelAnimationFrame?: typeof window.cancelAnimationFrame
  setTimeout?: typeof window.setTimeout
  clearTimeout?: typeof window.clearTimeout
}

const FADE_DURATION_MS = 450
const RETRY_INTERVAL_MS = 500

export class BrowserAudioController {
  private readonly createAudio: (source: string) => HTMLAudioElement
  private readonly requestFrame: typeof window.requestAnimationFrame
  private readonly cancelFrame: typeof window.cancelAnimationFrame
  private readonly setTimer: typeof window.setTimeout
  private readonly clearTimer: typeof window.clearTimeout
  private readonly music: HTMLAudioElement
  private readonly sfxSources = new Map<SfxId, HTMLAudioElement>()
  private desiredTrack: MusicTrackId = 'title'
  private desiredVolume = 0
  private activeTrack: MusicTrackId = 'title'
  private unlocked = false
  private reconciling = false
  private pending = false
  private fadeFrame = 0
  private retryTimer = 0

  constructor(options: BrowserAudioControllerOptions = {}) {
    this.createAudio = options.createAudio ?? ((source) => new Audio(source))
    this.requestFrame = options.requestAnimationFrame ?? window.requestAnimationFrame.bind(window)
    this.cancelFrame = options.cancelAnimationFrame ?? window.cancelAnimationFrame.bind(window)
    this.setTimer = options.setTimeout ?? window.setTimeout.bind(window)
    this.clearTimer = options.clearTimeout ?? window.clearTimeout.bind(window)
    this.music = this.createAudio(MUSIC_ASSETS.title)
    this.music.id = 'bgm-player'
    this.music.dataset.track = 'title'
    this.music.hidden = true
    this.music.loop = true
    this.music.preload = 'auto'
    this.music.volume = 0
    document.body.append(this.music)
    this.music.load()

    for (const [id, source] of Object.entries(SFX_ASSETS) as [SfxId, string][]) {
      const audio = this.createAudio(source)
      audio.preload = 'auto'
      audio.load()
      this.sfxSources.set(id, audio)
    }
  }

  get isUnlocked(): boolean {
    return this.unlocked
  }

  execute(command: AudioCommand | null): void {
    if (!command) return
    if (command.type === 'set-music') {
      this.setMusic(command.track, command.volume)
      return
    }
    if (command.type === 'prepare-music') {
      this.setMusic(command.track, 0)
      return
    }
    this.playSfx(command.sound, command.volume)
  }

  unlock(): void {
    this.unlocked = true
    this.requestReconcile()
  }

  async attemptAutoplay(volume: number): Promise<boolean> {
    if (this.unlocked) return true
    this.desiredTrack = 'title'
    this.desiredVolume = volume
    try {
      this.music.volume = volume
      await this.music.play()
      this.unlocked = true
      this.requestReconcile()
      return true
    } catch {
      return false
    }
  }

  destroy(): void {
    this.cancelFade()
    this.clearTimer(this.retryTimer)
    this.retryTimer = 0
    this.music.pause()
    this.music.remove()
  }

  private setMusic(track: MusicTrackId, volume: number): void {
    this.desiredTrack = track
    this.desiredVolume = volume
    this.requestReconcile()
  }

  private playSfx(sound: SfxId, volume: number): void {
    const source = this.sfxSources.get(sound)
    if (!source || volume <= 0) return
    const audio = source.cloneNode() as HTMLAudioElement
    audio.volume = volume
    void audio.play().catch(() => {})
  }

  private requestReconcile(): void {
    this.pending = true
    if (this.reconciling) return
    void this.runReconcile()
  }

  private async runReconcile(): Promise<void> {
    this.reconciling = true
    try {
      while (this.pending) {
        this.pending = false
        await this.reconcileOnce()
      }
    } finally {
      this.reconciling = false
    }
  }

  private async reconcileOnce(): Promise<void> {
    if (!this.unlocked) return
    this.cancelFade()
    if (this.activeTrack !== this.desiredTrack) {
      this.activeTrack = this.desiredTrack
      this.music.pause()
      this.music.src = MUSIC_ASSETS[this.activeTrack]
      this.music.dataset.track = this.activeTrack
      this.music.currentTime = 0
      this.music.load()
    }
    try {
      if (this.music.paused) {
        this.music.volume = 0
        await this.music.play()
      }
    } catch {
      this.scheduleRetry()
      return
    }
    if (!this.pending) this.fadeTo(this.desiredVolume)
  }

  private fadeTo(target: number): void {
    this.cancelFade()
    const startVolume = this.music.volume
    const startedAt = performance.now()
    const step = (now: number) => {
      const progress = Math.max(0, Math.min(1, (now - startedAt) / FADE_DURATION_MS))
      this.music.volume = startVolume + (target - startVolume) * progress
      if (progress < 1) this.fadeFrame = this.requestFrame(step)
      else this.fadeFrame = 0
    }
    this.fadeFrame = this.requestFrame(step)
  }

  private cancelFade(): void {
    if (this.fadeFrame) this.cancelFrame(this.fadeFrame)
    this.fadeFrame = 0
  }

  private scheduleRetry(): void {
    this.clearTimer(this.retryTimer)
    this.retryTimer = this.setTimer(() => this.requestReconcile(), RETRY_INTERVAL_MS)
  }
}

export function createBrowserAudioController(options?: BrowserAudioControllerOptions): BrowserAudioController {
  return new BrowserAudioController(options)
}
```

- [ ] **Step 4: Run test and typecheck after adapter creation**

Run:

```bash
npm run test -- src/application/audio/browserAudioController.test.ts
npm run check
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/application/audio/browserAudioController.ts src/application/audio/browserAudioController.test.ts
git commit -m "feat: add browser audio controller"
```

## Task 4: App Wiring And SFX Events

**Files:**
- Modify: `src/App.svelte`

- [ ] **Step 1: Wire audio imports and runtime state**

Add imports:

```ts
import { createMusicCommand, createSfxCommand } from './application/audio/audioCommands'
import { createBrowserAudioController, type BrowserAudioController } from './application/audio/browserAudioController'
```

Add state:

```ts
let audio: BrowserAudioController | undefined
```

- [ ] **Step 2: Add sync and SFX helpers**

```ts
function syncMusicForCurrentState() {
  audio?.execute(createMusicCommand(appState.screen, settings))
}

function playUiSfx(action: 'move' | 'confirm' | 'back') {
  audio?.execute(createSfxCommand(action, settings))
}

function syncSettings(nextSettings: GameSettings) {
  settings = nextSettings
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  syncMusicForCurrentState()
}
```

- [ ] **Step 3: Emit SFX in the existing handlers**

Use these concrete rules in the existing handlers:

- `handleSelectTitleMenuItem`: play `move` when the title menu selected index changes.
- `handleControlIntent`: compare previous and next screens; play `confirm` for `open` from title intro and `confirm` from title menu/settings/world select, play `back` for `back`, and play `move` when selected item/world/delete-confirm index changes.
- `handleSelectWorld`: play `move` when the selected world index changes, then sync music.
- `handleConfirmWorld`: play `confirm`, preserve world-select state, then sync music.
- `handleBackFromWorldSelect`: play `back`, return to title menu, then sync music.
- `handleAdjustSettingsItem`: play `move` after applying a volume/language/toggle adjustment, then sync music through `syncSettings`.
- `handleActivateSettingsItem`: play `confirm` for reset/delete-confirm/open-setting actions and `back` for Back.
- `handleCancelDelete`: play `back`.
- `handleConfirmDelete`: play `confirm`.

Examples:

```ts
function handleSelectTitleMenuItem(index: number) {
  const previousIndex = appState.screen.type === 'title-menu' ? appState.screen.selectedItemIndex : null
  appState = selectTitleMenuItem(appState, index)
  if (previousIndex !== null && previousIndex !== index) playUiSfx('move')
}

function handleBackFromWorldSelect() {
  playUiSfx('back')
  appState = backFromWorldSelect(appState)
  syncMusicForCurrentState()
}
```

- [ ] **Step 4: Sync music after every screen or selected-world change**

Call `syncMusicForCurrentState()` immediately after each handler assigns a new `appState` or after Settings changes that affect `masterVolume` or `musicVolume`. Calling it after every `syncSettings` is acceptable because it is idempotent.

- [ ] **Step 5: Create and unlock runtime in `onMount`**

```ts
audio = createBrowserAudioController()
syncSettings(parseStoredSettings(localStorage.getItem(SETTINGS_STORAGE_KEY), actualFullscreen()))
void audio.attemptAutoplay(createMusicCommand(appState.screen, settings).volume)

const unlockAudio = () => {
  audio?.unlock()
  syncMusicForCurrentState()
}

window.addEventListener('keydown', unlockAudio)
window.addEventListener('pointerdown', unlockAudio)
window.addEventListener('touchstart', unlockAudio)
```

Return cleanup that removes these listeners and calls `audio?.destroy()`.

- [ ] **Step 6: Run checks**

Run:

```bash
npm run test -- src/domain/audio/audioPolicy.test.ts src/application/audio/audioCommands.test.ts
npm run check
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/App.svelte
git commit -m "feat: wire audio playback into app"
```

## Task 5: Copy Runtime Audio Assets

**Files:**
- Create: `public/assets/audio/titlescreen.mp3`
- Create: `public/assets/audio/world01_bgm.mp3`
- Create: `public/assets/audio/world02_bgm.mp3`
- Create: `public/assets/audio/world03_bgm.mp3`
- Create: `public/assets/audio/world04_bgm.mp3`
- Create: `public/assets/audio/world05_bgm.mp3`
- Create: `public/assets/audio/world06_bgm.mp3`
- Create: `public/assets/audio/sfx/ui-move.wav`
- Create: `public/assets/audio/sfx/ui-confirm.wav`
- Create: `public/assets/audio/sfx/ui-back.wav`

- [ ] **Step 1: Copy assets from prototype**

Run:

```bash
mkdir -p public/assets/audio/sfx
cp __prototype__/public/assets/audio/titlescreen.mp3 public/assets/audio/titlescreen.mp3
cp __prototype__/public/assets/audio/world01_bgm.mp3 public/assets/audio/world01_bgm.mp3
cp __prototype__/public/assets/audio/world02_bgm.mp3 public/assets/audio/world02_bgm.mp3
cp __prototype__/public/assets/audio/world03_bgm.mp3 public/assets/audio/world03_bgm.mp3
cp __prototype__/public/assets/audio/world04_bgm.mp3 public/assets/audio/world04_bgm.mp3
cp __prototype__/public/assets/audio/world05_bgm.mp3 public/assets/audio/world05_bgm.mp3
cp __prototype__/public/assets/audio/world06_bgm.mp3 public/assets/audio/world06_bgm.mp3
cp __prototype__/public/assets/audio/sfx/ui-move.wav public/assets/audio/sfx/ui-move.wav
cp __prototype__/public/assets/audio/sfx/ui-confirm.wav public/assets/audio/sfx/ui-confirm.wav
cp __prototype__/public/assets/audio/sfx/ui-back.wav public/assets/audio/sfx/ui-back.wav
```

- [ ] **Step 2: Verify copied paths**

Run:

```bash
ls public/assets/audio public/assets/audio/sfx
```

Expected: all ten files listed.

- [ ] **Step 3: Commit**

```bash
git add public/assets/audio
git commit -m "feat: add title and world select audio assets"
```

## Task 6: Full Verification

**Files:**
- Inspect: `src/domain/audio/audioPolicy.ts`
- Inspect: `src/application/audio/audioCommands.ts`
- Inspect: `src/application/audio/browserAudioController.ts`
- Inspect: `src/App.svelte`
- Inspect: `public/assets/audio/`

- [ ] **Step 1: Run required checks**

Run:

```bash
npm run test
npm run check
npm run build
git diff --check
```

Expected: all commands pass.

- [ ] **Step 2: Audit completion against the spec**

Confirm:

- Title intro and title menu have music commands with prototype volume rules.
- World Select maps all six worlds to the matching BGM.
- Settings master/music changes resync music.
- Settings SFX volume changes future SFX volume.
- UI move/confirm/back SFX are wired for Title, World Select, and Settings actions.
- Root audio files exist in `public/assets/audio/`.

- [ ] **Step 3: Final commit if verification caused a fix**

If verification requires a code or asset fix, stage the concrete files changed by that fix and commit with `git commit -m "fix: complete audio playback verification"`. Skip this step when verification makes no changes.
