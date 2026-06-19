import { MUSIC_ASSETS, SFX_ASSETS, type MusicTrackId, type SfxId } from '../../domain/audio/audioAssets'
import type { AudioCommand } from './audioCommands'

type BrowserAudioControllerOptions = {
  appendMusic?: (audio: HTMLAudioElement) => void
  createAudio?: (source: string) => HTMLAudioElement
  requestAnimationFrame?: typeof window.requestAnimationFrame
  cancelAnimationFrame?: typeof window.cancelAnimationFrame
  setTimeout?: typeof window.setTimeout
  clearTimeout?: typeof window.clearTimeout
}

const FADE_DURATION_MS = 450
const RETRY_INTERVAL_MS = 500

export class BrowserAudioController {
  private readonly appendMusic: (audio: HTMLAudioElement) => void
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
    this.appendMusic = options.appendMusic ?? ((audio) => document.body.append(audio))
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
    this.appendMusic(this.music)
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

      if (progress < 1) {
        this.fadeFrame = this.requestFrame(step)
      } else {
        this.fadeFrame = 0
      }
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
