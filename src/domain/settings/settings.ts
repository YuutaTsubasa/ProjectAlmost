import type { LocaleCode } from '../data/localize/localize'

export const SETTINGS_STORAGE_KEY = 'project-almost:settings'

export type GameSettings = {
  masterVolume: number
  musicVolume: number
  sfxVolume: number
  language: LocaleCode
  fullscreen: boolean
  screenShake: boolean
  vibration: boolean
}

export type SettingsRowId =
  | 'master-volume'
  | 'music-volume'
  | 'sfx-volume'
  | 'language'
  | 'fullscreen'
  | 'screen-shake'
  | 'vibration'
  | 'reset'
  | 'delete-save'
  | 'back'

export type SettingsRowKind = 'volume' | 'choice' | 'toggle' | 'action' | 'danger'

export type SettingsRow = {
  id: SettingsRowId
  kind: SettingsRowKind
}

export const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 100,
  musicVolume: 80,
  sfxVolume: 80,
  language: 'en',
  fullscreen: false,
  screenShake: true,
  vibration: true,
}

export const SETTINGS_ROWS: readonly SettingsRow[] = [
  { id: 'master-volume', kind: 'volume' },
  { id: 'music-volume', kind: 'volume' },
  { id: 'sfx-volume', kind: 'volume' },
  { id: 'language', kind: 'choice' },
  { id: 'fullscreen', kind: 'toggle' },
  { id: 'screen-shake', kind: 'toggle' },
  { id: 'vibration', kind: 'toggle' },
  { id: 'reset', kind: 'action' },
  { id: 'delete-save', kind: 'danger' },
  { id: 'back', kind: 'action' },
]

export function createDefaultSettings(): GameSettings {
  return { ...DEFAULT_SETTINGS }
}

export type DeleteConfirmState = {
  selectedActionIndex: 0 | 1
}

export function moveSettingsSelection(selectedItemIndex: number, direction: -1 | 1): number {
  return (selectedItemIndex + direction + SETTINGS_ROWS.length) % SETTINGS_ROWS.length
}

export function moveDeleteConfirmSelection(selectedActionIndex: 0 | 1, direction: -1 | 1): 0 | 1 {
  return ((selectedActionIndex + direction + 2) % 2) as 0 | 1
}

export function openDeleteConfirm(): DeleteConfirmState {
  return { selectedActionIndex: 0 }
}

export function adjustSettingsRow(
  settings: GameSettings,
  selectedItemIndex: number,
  direction: -1 | 1,
  localeCodes: readonly LocaleCode[],
): GameSettings {
  if (selectedItemIndex === 0) {
    return { ...settings, masterVolume: clampVolume(settings.masterVolume + direction * 10) }
  }
  if (selectedItemIndex === 1) {
    return { ...settings, musicVolume: clampVolume(settings.musicVolume + direction * 10) }
  }
  if (selectedItemIndex === 2) {
    return { ...settings, sfxVolume: clampVolume(settings.sfxVolume + direction * 10) }
  }
  if (selectedItemIndex === 3) {
    return { ...settings, language: cycleLocale(settings.language, direction, localeCodes) }
  }
  if (selectedItemIndex === 4) return { ...settings, fullscreen: !settings.fullscreen }
  if (selectedItemIndex === 5) return { ...settings, screenShake: !settings.screenShake }
  if (selectedItemIndex === 6) return { ...settings, vibration: !settings.vibration }
  return settings
}

export function resetSettings(actualFullscreen: boolean): GameSettings {
  return { ...DEFAULT_SETTINGS, fullscreen: actualFullscreen }
}

export function parseStoredSettings(storedValue: string | null, actualFullscreen: boolean): GameSettings {
  if (!storedValue) return { ...DEFAULT_SETTINGS, fullscreen: actualFullscreen }

  try {
    const parsed = JSON.parse(storedValue) as Partial<GameSettings>

    return {
      masterVolume: normalizeVolume(parsed.masterVolume, DEFAULT_SETTINGS.masterVolume),
      musicVolume: normalizeVolume(parsed.musicVolume, DEFAULT_SETTINGS.musicVolume),
      sfxVolume: normalizeVolume(parsed.sfxVolume, DEFAULT_SETTINGS.sfxVolume),
      language: isLocaleCode(parsed.language) ? parsed.language : DEFAULT_SETTINGS.language,
      fullscreen: actualFullscreen,
      screenShake: typeof parsed.screenShake === 'boolean' ? parsed.screenShake : DEFAULT_SETTINGS.screenShake,
      vibration: typeof parsed.vibration === 'boolean' ? parsed.vibration : DEFAULT_SETTINGS.vibration,
    }
  } catch {
    return { ...DEFAULT_SETTINGS, fullscreen: actualFullscreen }
  }
}

function normalizeVolume(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? clampVolume(value) : fallback
}

function clampVolume(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value / 10) * 10))
}

function cycleLocale(
  currentLocale: LocaleCode,
  direction: -1 | 1,
  localeCodes: readonly LocaleCode[],
): LocaleCode {
  const currentIndex = localeCodes.indexOf(currentLocale)
  const safeIndex = currentIndex === -1 ? 0 : currentIndex
  return localeCodes[(safeIndex + direction + localeCodes.length) % localeCodes.length] ?? 'en'
}

function isLocaleCode(value: unknown): value is LocaleCode {
  return value === 'en' || value === 'ja' || value === 'zhHant' || value === 'ko'
}
