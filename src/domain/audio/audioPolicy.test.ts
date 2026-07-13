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
  it('declares the public audio assets used by title, world select, and stage select', () => {
    expect(MUSIC_ASSETS).toEqual({
      title: '/assets/audio/titlescreen.mp3',
      result: '/assets/audio/game_result.mp3',
      world01Bgm: '/assets/audio/world01_bgm.mp3',
      world01Boss: '/assets/audio/world01_boss.mp3',
      world02Bgm: '/assets/audio/world02_bgm.mp3',
      world02Boss: '/assets/audio/world02_boss.mp3',
      world03Bgm: '/assets/audio/world03_bgm.mp3',
      world03Boss: '/assets/audio/world03_boss.mp3',
      world04Bgm: '/assets/audio/world04_bgm.mp3',
      world04Boss: '/assets/audio/world04_boss.mp3',
      world05Bgm: '/assets/audio/world05_bgm.mp3',
      world05Boss: '/assets/audio/world05_boss.mp3',
      world06Bgm: '/assets/audio/world06_bgm.mp3',
      world06Boss: '/assets/audio/world06_boss.mp3',
      world01Map: '/assets/audio/world01_map.mp3',
      world02Map: '/assets/audio/world02_map.mp3',
      world03Map: '/assets/audio/world03_map.mp3',
      world04Map: '/assets/audio/world04_map.mp3',
      world05Map: '/assets/audio/world05_map.mp3',
      world06Map: '/assets/audio/world06_map.mp3',
    })
    expect(SFX_ASSETS).toEqual({
      'ui-move': '/assets/audio/sfx/ui-move.wav',
      'ui-confirm': '/assets/audio/sfx/ui-confirm.wav',
      'ui-back': '/assets/audio/sfx/ui-back.wav',
      hit: '/assets/audio/sfx/hit.wav',
      coin: '/assets/audio/sfx/coin.wav',
      death: '/assets/audio/sfx/death.wav',
      checkpoint: '/assets/audio/sfx/checkpoint.wav',
      'armor-step': '/assets/audio/sfx/armor-step.wav',
      goal: '/assets/audio/sfx/goal.wav',
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
    expect(
      getMusicForScreen(
        { type: 'stage-select', selectedWorldIndex: 4, worldId: 'world05', selectedStageIndex: 0 },
        DEFAULT_SETTINGS,
      ),
    ).toEqual({
      track: 'world05Map',
      volume: 0.336,
    })
  })

  it('returns no music decision for gameplay so the current stage-select track is preserved', () => {
    expect(getMusicForScreen({ type: 'gameplay', stageId: '1-1', runId: 0 }, DEFAULT_SETTINGS)).toBeNull()
  })

  it('falls back to world one music for out-of-range world indexes', () => {
    expect(getMusicForScreen({ type: 'world-select', selectedWorldIndex: 99 }, DEFAULT_SETTINGS)).toEqual({
      track: 'world01Bgm',
      volume: 0.336,
    })
    expect(
      getMusicForScreen(
        { type: 'stage-select', selectedWorldIndex: 99, worldId: 'world01', selectedStageIndex: 0 },
        DEFAULT_SETTINGS,
      ),
    ).toEqual({
      track: 'world01Map',
      volume: 0.336,
    })
  })
})

describe('ui sfx policy', () => {
  it('maps ui actions to prototype sfx ids', () => {
    expect(getSfxForAction('move')).toBe('ui-move')
    expect(getSfxForAction('confirm')).toBe('ui-confirm')
    expect(getSfxForAction('back')).toBe('ui-back')
  })

  it('maps gameplay actions to prototype gameplay sfx ids', () => {
    expect(getSfxForAction('player-hit')).toBe('hit')
    expect(getSfxForAction('coin-collected')).toBe('coin')
    expect(getSfxForAction('player-death')).toBe('death')
    expect(getSfxForAction('checkpoint-activated')).toBe('checkpoint')
    expect(getSfxForAction('player-footstep')).toBe('armor-step')
    expect(getSfxForAction('goal-opened')).toBe('goal')
  })
})
