import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from '../../domain/settings/settings'
import audioCommandsSource from './audioCommands.ts?raw'
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
  it('accepts the shared sfx action type so UI and gameplay sounds use one command path', () => {
    expect(audioCommandsSource).toContain('type SfxAction')
    expect(audioCommandsSource).toContain('action: SfxAction')
    expect(audioCommandsSource).not.toContain('action: UiSfxAction')
  })

  it('wraps sfx policy in a play-sfx command with computed volume', () => {
    expect(createSfxCommand('confirm', DEFAULT_SETTINGS)).toEqual({
      type: 'play-sfx',
      sound: 'ui-confirm',
      volume: 0.8,
    })
  })

  it('wraps gameplay sfx actions in play-sfx commands with current settings volume', () => {
    expect(createSfxCommand('coin-collected', { ...DEFAULT_SETTINGS, masterVolume: 50, sfxVolume: 40 })).toEqual({
      type: 'play-sfx',
      sound: 'coin',
      volume: 0.2,
    })
  })

  it('returns null when master or sfx volume would make sound inaudible', () => {
    expect(createSfxCommand('move', { ...DEFAULT_SETTINGS, masterVolume: 0 })).toBeNull()
    expect(createSfxCommand('move', { ...DEFAULT_SETTINGS, sfxVolume: 0 })).toBeNull()
    expect(createSfxCommand('player-death', { ...DEFAULT_SETTINGS, sfxVolume: 0 })).toBeNull()
  })
})
