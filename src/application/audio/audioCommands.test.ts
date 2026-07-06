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

  it('returns null for gameplay so the current music keeps playing', () => {
    expect(createMusicCommand({ type: 'gameplay', stageId: '1-1', runId: 0 }, DEFAULT_SETTINGS)).toBeNull()
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
