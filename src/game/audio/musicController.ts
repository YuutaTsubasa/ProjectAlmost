import { MUSIC_ASSETS, type MusicTrack } from '../assets/assetManifest'

/**
 * MusicController owns the single background-music <audio> element and the
 * logic for reliably making the *desired* track play at the *desired* volume.
 *
 * Design split: the App decides WHAT it wants (track + volume) from screen
 * state; this controller is solely responsible for HOW that is achieved.
 *
 * The previous implementation lived inline in App.svelte and reconciled state
 * through an un-serialized async function. Rapid screen transitions spawned
 * overlapping reconcile runs that fought over one shared <audio> element,
 * producing the well-known "play() interrupted by pause()/load()" AbortError
 * and, worse, leaving the element *playing at volume 0* with no recovery path
 * (the retry only fired when the element was paused). That is the root cause of
 * "BGM sometimes disappears when switching scenes".
 *
 * Two guarantees here fix that:
 *   1. Serialized reconcile: only one reconcile runs at a time. New requests
 *      set a `pending` flag; when the current reconcile finishes it loops again
 *      for the latest desired state. No overlapping play()/pause()/load().
 *   2. Silence watchdog: a retry timer re-checks the invariant "unlocked +
 *      desiredVolume > 0 + correct track playing => audible", and re-fades if
 *      the element is somehow playing silently.
 */

const FADE_DURATION_MS = 450
const RETRY_INTERVAL_MS = 500
const SILENT_EPSILON = 0.001

export type MusicControllerOptions = {
  initialTrack?: MusicTrack
  baseVolume?: number
}

export class MusicController {
  private readonly audio: HTMLAudioElement
  private readonly tracks: Record<MusicTrack, string> = MUSIC_ASSETS

  private desiredTrack: MusicTrack
  private desiredVolume = 0
  private activeTrack: MusicTrack
  private unlocked = false

  private reconciling = false
  private pending = false
  private fadeFrame = 0
  private retryTimer = 0

  private readonly handleCanPlay = () => this.nudge()

  constructor(options: MusicControllerOptions = {}) {
    const initialTrack = options.initialTrack ?? 'title'
    this.desiredTrack = initialTrack
    this.activeTrack = initialTrack

    const audio = new Audio(this.tracks[initialTrack])
    audio.id = 'bgm-player'
    audio.dataset.track = initialTrack
    audio.hidden = true
    audio.loop = true
    audio.preload = 'auto'
    audio.volume = 0
    document.body.append(audio)
    audio.load()
    audio.addEventListener('canplay', this.handleCanPlay)
    this.audio = audio
  }

  get isUnlocked(): boolean {
    return this.unlocked
  }

  /** Set the track + volume we want to hear, then reconcile toward it. */
  setDesired(track: MusicTrack, volume: number): void {
    this.desiredTrack = track
    this.desiredVolume = volume
    this.requestReconcile()
  }

  /** Pre-warm a track silently (volume 0) so a later setDesired fades in fast. */
  prepare(track: MusicTrack): void {
    this.setDesired(track, 0)
  }

  /** Hard-stop and rewind, only if the given track is the active one. */
  reset(track: MusicTrack): void {
    if (this.activeTrack !== track) return
    this.cancelFade()
    this.audio.pause()
    this.audio.currentTime = 0
    this.audio.volume = 0
  }

  /** Mark audio as user-unlocked (first interaction) and reconcile. */
  unlock(): void {
    if (!this.unlocked) {
      this.unlocked = true
    }
    this.requestReconcile()
  }

  /**
   * Try to autoplay the initial title track before any user interaction.
   * Resolves to true if the browser allowed playback (audio now unlocked).
   */
  async attemptAutoplay(volume: number): Promise<boolean> {
    if (this.unlocked) return true
    this.desiredTrack = this.activeTrack
    this.desiredVolume = volume
    try {
      this.audio.volume = volume
      await this.audio.play()
      this.unlocked = true
      this.requestReconcile()
      return true
    } catch {
      // Browsers commonly require a first keyboard, pointer, or gamepad event.
      return false
    }
  }

  /** Re-check and reconcile (used by visibility/canplay nudges). */
  nudge(): void {
    this.requestReconcile()
  }

  destroy(): void {
    this.cancelFade()
    window.clearTimeout(this.retryTimer)
    this.retryTimer = 0
    this.audio.removeEventListener('canplay', this.handleCanPlay)
    this.audio.pause()
    this.audio.remove()
  }

  // --- internals ------------------------------------------------------------

  private requestReconcile(): void {
    this.pending = true
    if (this.reconciling) return
    void this.runReconcile()
  }

  private async runReconcile(): Promise<void> {
    this.reconciling = true
    try {
      // Loop until no newer request arrived while we were awaiting. This is the
      // serialization guarantee: exactly one reconcile body runs at a time, and
      // it always finishes against the *latest* desired state.
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
    const audio = this.audio

    this.cancelFade()

    if (this.activeTrack !== this.desiredTrack) {
      this.activeTrack = this.desiredTrack
      audio.pause()
      audio.src = this.tracks[this.activeTrack]
      audio.dataset.track = this.activeTrack
      audio.currentTime = 0
      audio.load()
    }

    try {
      if (audio.paused) {
        audio.volume = 0
        await audio.play()
      }
    } catch {
      this.scheduleRetry()
      return
    }

    // Desired state may have changed during the await; the run loop will pick it
    // up. Don't fade toward a stale volume for a now-wrong track.
    if (this.pending || this.activeTrack !== this.desiredTrack) return

    if (!audio.paused) {
      this.fadeTo(this.desiredVolume)
    } else {
      this.scheduleRetry()
    }
  }

  private fadeTo(target: number, duration = FADE_DURATION_MS): void {
    const audio = this.audio
    this.cancelFade()
    const startVolume = audio.volume
    const startedAt = performance.now()

    const step = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration)
      audio.volume = startVolume + (target - startVolume) * progress
      if (progress < 1) {
        this.fadeFrame = window.requestAnimationFrame(step)
      } else {
        this.fadeFrame = 0
        this.scheduleRetry()
      }
    }
    this.fadeFrame = window.requestAnimationFrame(step)
  }

  private cancelFade(): void {
    if (this.fadeFrame) window.cancelAnimationFrame(this.fadeFrame)
    this.fadeFrame = 0
  }

  /**
   * Watchdog. Re-runs on a timer to repair two failure modes:
   *   - element ended up paused while we wanted sound -> reconcile to play it.
   *   - element is playing the right track but silently (volume ~ 0) while we
   *     wanted it audible -> re-fade in. The old code never recovered this.
   */
  private scheduleRetry(): void {
    window.clearTimeout(this.retryTimer)
    this.retryTimer = window.setTimeout(() => {
      if (!this.unlocked) return

      if (this.audio.paused) {
        this.requestReconcile()
        return
      }

      const wantsSound = this.desiredVolume > SILENT_EPSILON
      const isSilent = this.audio.volume <= SILENT_EPSILON
      const onDesiredTrack = this.activeTrack === this.desiredTrack
      if (wantsSound && isSilent && onDesiredTrack && this.fadeFrame === 0) {
        this.fadeTo(this.desiredVolume)
      }
    }, RETRY_INTERVAL_MS)
  }
}

export function createMusicController(options?: MusicControllerOptions): MusicController {
  return new MusicController(options)
}
