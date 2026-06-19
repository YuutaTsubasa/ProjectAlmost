import { describe, expect, it } from 'vitest'
import {
  adjustSettingsRow,
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  SETTINGS_ROWS,
  createDefaultSettings,
  moveDeleteConfirmSelection,
  moveSettingsSelection,
  openDeleteConfirm,
  parseStoredSettings,
  resetSettings,
} from './settings'

describe('settings defaults', () => {
  it('matches the prototype defaults and storage key', () => {
    expect(SETTINGS_STORAGE_KEY).toBe('project-almost:settings')
    expect(DEFAULT_SETTINGS).toEqual({
      masterVolume: 100,
      musicVolume: 80,
      sfxVolume: 80,
      language: 'en',
      fullscreen: false,
      screenShake: true,
      vibration: true,
    })
    expect(createDefaultSettings()).toEqual(DEFAULT_SETTINGS)
    expect(createDefaultSettings()).not.toBe(DEFAULT_SETTINGS)
  })

  it('declares the ten prototype settings rows in order', () => {
    expect(SETTINGS_ROWS.map((row) => row.id)).toEqual([
      'master-volume',
      'music-volume',
      'sfx-volume',
      'language',
      'fullscreen',
      'screen-shake',
      'vibration',
      'reset',
      'delete-save',
      'back',
    ])
  })
})

describe('settings reducers', () => {
  it('adjusts volume rows by ten and clamps to zero and one hundred', () => {
    expect(adjustSettingsRow({ ...DEFAULT_SETTINGS, masterVolume: 95 }, 0, 1, ['en', 'ja'])).toEqual({
      ...DEFAULT_SETTINGS,
      masterVolume: 100,
    })
    expect(adjustSettingsRow({ ...DEFAULT_SETTINGS, musicVolume: 5 }, 1, -1, ['en', 'ja'])).toEqual({
      ...DEFAULT_SETTINGS,
      musicVolume: 0,
    })
    expect(adjustSettingsRow(DEFAULT_SETTINGS, 2, 1, ['en', 'ja'])).toEqual({
      ...DEFAULT_SETTINGS,
      sfxVolume: 90,
    })
  })

  it('cycles language through the provided locale order', () => {
    const locales = ['en', 'ja', 'zhHant', 'ko'] as const

    expect(adjustSettingsRow(DEFAULT_SETTINGS, 3, 1, locales).language).toBe('ja')
    expect(adjustSettingsRow({ ...DEFAULT_SETTINGS, language: 'en' }, 3, -1, locales).language).toBe('ko')
  })

  it('toggles boolean rows through adjustment', () => {
    expect(adjustSettingsRow(DEFAULT_SETTINGS, 4, 1, ['en']).fullscreen).toBe(true)
    expect(adjustSettingsRow(DEFAULT_SETTINGS, 5, 1, ['en']).screenShake).toBe(false)
    expect(adjustSettingsRow(DEFAULT_SETTINGS, 6, 1, ['en']).vibration).toBe(false)
  })

  it('resets settings while preserving the actual fullscreen state', () => {
    expect(resetSettings(true)).toEqual({ ...DEFAULT_SETTINGS, fullscreen: true })
    expect(resetSettings(false)).toEqual(DEFAULT_SETTINGS)
  })

  it('wraps settings and delete confirmation selection', () => {
    expect(moveSettingsSelection(0, -1)).toBe(9)
    expect(moveSettingsSelection(9, 1)).toBe(0)
    expect(moveDeleteConfirmSelection(0, -1)).toBe(1)
    expect(moveDeleteConfirmSelection(1, 1)).toBe(0)
  })

  it('opens delete confirmation with cancel selected', () => {
    expect(openDeleteConfirm()).toEqual({ selectedActionIndex: 0 })
  })
})

describe('parseStoredSettings', () => {
  it('merges valid stored values over defaults and clamps invalid values', () => {
    expect(
      parseStoredSettings(
        JSON.stringify({
          masterVolume: 120,
          musicVolume: -5,
          sfxVolume: 55,
          language: 'zhHant',
          fullscreen: true,
          screenShake: false,
          vibration: false,
        }),
        false,
      ),
    ).toEqual({
      masterVolume: 100,
      musicVolume: 0,
      sfxVolume: 60,
      language: 'zhHant',
      fullscreen: false,
      screenShake: false,
      vibration: false,
    })
  })

  it('uses defaults for malformed JSON and invalid scalar types', () => {
    expect(parseStoredSettings('{bad json', true)).toEqual({ ...DEFAULT_SETTINGS, fullscreen: true })
    expect(
      parseStoredSettings(
        JSON.stringify({
          masterVolume: 'loud',
          language: 'missing',
          screenShake: 'yes',
        }),
        false,
      ),
    ).toEqual(DEFAULT_SETTINGS)
  })
})
