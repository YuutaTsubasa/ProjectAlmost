import { describe, expect, it } from 'vitest'
import type { SettingsScreen } from '../../domain/app/appFlow'
import type { GameSettings } from '../../domain/settings/settings'
import { applySettingsControlIntent } from './settingsControls'

const settings: GameSettings = {
  masterVolume: 90,
  musicVolume: 60,
  sfxVolume: 70,
  language: 'en',
  fullscreen: false,
  screenShake: true,
  vibration: true,
}

const screen: SettingsScreen = {
  type: 'settings',
  selectedItemIndex: 0,
  deleteConfirm: null,
}

describe('settings control helper', () => {
  it('moves settings selection without routing away from the current owner', () => {
    expect(applySettingsControlIntent({ screen, settings }, 'move-down', ['en', 'ja', 'zhHant', 'ko'])).toMatchObject({
      screen: { type: 'settings', selectedItemIndex: 1, deleteConfirm: null },
      exitRequested: false,
    })
  })

  it('adjusts settings and reports fullscreen changes', () => {
    const fullscreenScreen: SettingsScreen = { type: 'settings', selectedItemIndex: 4, deleteConfirm: null }

    const result = applySettingsControlIntent(
      { screen: fullscreenScreen, settings },
      'move-right',
      ['en', 'ja', 'zhHant', 'ko'],
    )

    expect(result.settings.fullscreen).toBe(true)
    expect(result.fullscreenChanged).toBe(true)
    expect(result.exitRequested).toBe(false)
  })

  it('opens, moves, confirms, and cancels delete confirmation locally', () => {
    const deleteScreen: SettingsScreen = { type: 'settings', selectedItemIndex: 8, deleteConfirm: null }
    const opened = applySettingsControlIntent({ screen: deleteScreen, settings }, 'confirm', ['en', 'ja', 'zhHant', 'ko'])

    expect(opened.screen.deleteConfirm).toEqual({ selectedActionIndex: 0 })
    expect(applySettingsControlIntent(opened, 'move-left', ['en', 'ja', 'zhHant', 'ko']).screen.deleteConfirm).toEqual({
      selectedActionIndex: 1,
    })
    expect(applySettingsControlIntent(opened, 'back', ['en', 'ja', 'zhHant', 'ko']).screen.deleteConfirm).toBeNull()
  })

  it('requests delete confirmation only for the destructive confirm action', () => {
    const deleteConfirmScreen: SettingsScreen = {
      type: 'settings',
      selectedItemIndex: 8,
      deleteConfirm: { selectedActionIndex: 1 },
    }

    expect(
      applySettingsControlIntent({ screen: deleteConfirmScreen, settings }, 'confirm', ['en', 'ja', 'zhHant', 'ko']),
    ).toMatchObject({
      deleteConfirmed: true,
      exitRequested: false,
      fullscreenChanged: false,
      screen: { type: 'settings', selectedItemIndex: 8, deleteConfirm: null },
    })
  })

  it('requests owner exit on back when no delete confirmation is open', () => {
    expect(applySettingsControlIntent({ screen, settings }, 'back', ['en', 'ja', 'zhHant', 'ko'])).toMatchObject({
      screen,
      settings,
      exitRequested: true,
      fullscreenChanged: false,
    })
  })

  it('resets settings and reports fullscreen changes only when fullscreen stays different from defaults', () => {
    const resetScreen: SettingsScreen = { type: 'settings', selectedItemIndex: 7, deleteConfirm: null }

    expect(
      applySettingsControlIntent({ screen: resetScreen, settings: { ...settings, fullscreen: true } }, 'confirm', [
        'en',
        'ja',
        'zhHant',
        'ko',
      ]),
    ).toMatchObject({
      settings: expect.objectContaining({ fullscreen: true, masterVolume: 100, musicVolume: 80, sfxVolume: 80 }),
      fullscreenChanged: false,
    })
  })
})
