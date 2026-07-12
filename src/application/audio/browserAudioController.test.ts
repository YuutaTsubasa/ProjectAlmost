import { describe, expect, it } from 'vitest'
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
  it('creates a hidden looping title music element and preloads sfx sources', () => {
    const created: FakeAudio[] = []
    const appended: FakeAudio[] = []

    const controller = createBrowserAudioController({
      appendMusic: (audio) => appended.push(audio as unknown as FakeAudio),
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
      setTimeout: (() => 1) as typeof window.setTimeout,
      clearTimeout: (() => {}) as typeof window.clearTimeout,
    })

    expect(created.map((audio) => audio.src)).toEqual([
      '/assets/audio/titlescreen.mp3',
      '/assets/audio/sfx/ui-move.wav',
      '/assets/audio/sfx/ui-confirm.wav',
      '/assets/audio/sfx/ui-back.wav',
      '/assets/audio/sfx/hit.wav',
      '/assets/audio/sfx/coin.wav',
      '/assets/audio/sfx/death.wav',
      '/assets/audio/sfx/checkpoint.wav',
      '/assets/audio/sfx/armor-step.wav',
      '/assets/audio/sfx/goal.wav',
    ])
    expect(created[0]).toMatchObject({ id: 'bgm-player', hidden: true, loop: true, volume: 0 })
    expect(appended).toEqual([created[0]])

    controller.destroy()
    expect(created[0].removed).toBe(true)
  })

  it('reconciles the desired music after unlock and switches tracks', async () => {
    const created: FakeAudio[] = []
    const controller = createBrowserAudioController({
      appendMusic: () => {},
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
      setTimeout: (() => 1) as typeof window.setTimeout,
      clearTimeout: (() => {}) as typeof window.clearTimeout,
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
