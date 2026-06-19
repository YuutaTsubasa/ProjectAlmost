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
