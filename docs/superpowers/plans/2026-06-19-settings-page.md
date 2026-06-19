# Settings Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the rebuilt settings page with prototype-equivalent behavior and styling, connected to the rebuild localization and control systems.

**Architecture:** Add pure settings behavior under `src/domain/settings/`, extend app flow and input reducers to route shared control intents through the settings screen, and keep browser side effects in `App.svelte`. Svelte renders a localized settings panel that receives state and emits intents or explicit callbacks.

**Tech Stack:** Svelte 5, TypeScript, Vitest, Vite, browser `localStorage`, browser Fullscreen API.

---

## File Structure

- Create `src/domain/settings/settings.test.ts`: red tests for settings defaults, adjustment, row movement, activation decisions, confirmation flow, and storage parsing.
- Create `src/domain/settings/settings.ts`: pure settings model and reducers.
- Modify `src/domain/data/localize/localize.test.ts`: red tests for common, language, settings labels, settings aria strings, and fallback.
- Modify `src/domain/data/localize/localize.ts`: add typed localization keys and catalog entries for all locales.
- Modify `src/domain/input/controlIntents.test.ts`: red tests for `settings` and `settings-delete-confirm` contexts.
- Modify `src/domain/input/controlIntents.ts`: extend contexts and map settings keyboard/gamepad inputs.
- Modify `src/domain/app/appFlow.test.ts`: red tests for opening and leaving settings from the title menu.
- Modify `src/domain/app/appFlow.ts`: add `settings` app screen and pure navigation helpers.
- Modify `src/application/input/appControls.test.ts`: red tests for settings control-intent application.
- Modify `src/application/input/appControls.ts`: apply shared intents to settings state.
- Create `src/ui/settings/SettingsScreen.svelte`: localized settings panel presentation.
- Modify `src/App.svelte`: own reactive settings, locale, persistence, fullscreen adapter, and delete-save no-op adapter.
- Modify `src/app.css`: add prototype-equivalent settings overlay, panel, row, meter, and confirm dialog styles.

## Task 1: Domain Settings Model

**Files:**
- Create: `src/domain/settings/settings.test.ts`
- Create: `src/domain/settings/settings.ts`

- [ ] **Step 1: Write failing tests for defaults and row catalog**

Create `src/domain/settings/settings.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  SETTINGS_ROWS,
  createDefaultSettings,
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/domain/settings/settings.test.ts`

Expected: FAIL because `src/domain/settings/settings.ts` does not exist.

- [ ] **Step 3: Add minimal settings model**

Create `src/domain/settings/settings.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/domain/settings/settings.test.ts`

Expected: PASS.

- [ ] **Step 5: Write failing tests for adjustment and selection**

Append to `src/domain/settings/settings.test.ts`:

```ts
import {
  adjustSettingsRow,
  moveDeleteConfirmSelection,
  moveSettingsSelection,
  openDeleteConfirm,
  parseStoredSettings,
} from './settings'

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
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm run test -- src/domain/settings/settings.test.ts`

Expected: FAIL because the reducer and parser functions are not implemented.

- [ ] **Step 7: Implement settings reducers and parser**

Append to `src/domain/settings/settings.ts`:

```ts
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
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm run test -- src/domain/settings/settings.test.ts`

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/domain/settings/settings.test.ts src/domain/settings/settings.ts
git commit -m "feat: add settings domain model"
```

## Task 2: Localization And Input Contexts

**Files:**
- Modify: `src/domain/data/localize/localize.test.ts`
- Modify: `src/domain/data/localize/localize.ts`
- Modify: `src/domain/input/controlIntents.test.ts`
- Modify: `src/domain/input/controlIntents.ts`

- [ ] **Step 1: Write failing localization tests**

Add this test to `src/domain/data/localize/localize.test.ts` inside `describe('localize', ...)`:

```ts
  it('includes localized settings, common, and language values for every supported locale', () => {
    const expectedByLocale = {
      en: {
        systemMenu: 'System Menu',
        title: 'Settings',
        masterVolume: 'Master Volume',
        musicVolume: 'Music Volume',
        sfxVolume: 'SFX Volume',
        language: 'Language',
        fullscreen: 'Fullscreen',
        screenShake: 'Screen Shake',
        vibration: 'Controller Vibration',
        reset: 'Reset to Default',
        deleteSave: 'Delete Save Data',
        deleteTitle: 'Delete Save Data?',
        deleteBody: 'All stage clears, unlocks, records, and best ranks will be permanently deleted.',
        select: 'Select',
        adjust: 'Adjust',
        on: 'On',
        off: 'Off',
        cancel: 'Cancel',
        delete: 'Delete',
        warning: 'Warning',
        english: 'English',
      },
      ja: {
        systemMenu: 'システムメニュー',
        title: '設定',
        masterVolume: 'マスター音量',
        musicVolume: '音楽音量',
        sfxVolume: '効果音音量',
        language: '言語',
        fullscreen: 'フルスクリーン',
        screenShake: '画面振動',
        vibration: 'コントローラー振動',
        reset: '初期設定に戻す',
        deleteSave: 'セーブデータ削除',
        deleteTitle: 'セーブデータを削除しますか？',
        deleteBody: 'ステージクリア、解放、記録、最高ランクがすべて削除されます。',
        select: '選択',
        adjust: '調整',
        on: 'オン',
        off: 'オフ',
        cancel: 'キャンセル',
        delete: '削除',
        warning: '警告',
        english: '英語',
      },
      zhHant: {
        systemMenu: '系統選單',
        title: '設定',
        masterVolume: '主音量',
        musicVolume: '音樂音量',
        sfxVolume: '音效音量',
        language: '語言',
        fullscreen: '全螢幕',
        screenShake: '畫面震動',
        vibration: '控制器震動',
        reset: '恢復預設值',
        deleteSave: '刪除存檔',
        deleteTitle: '刪除存檔？',
        deleteBody: '所有過關、解鎖、紀錄與最佳評價都將永久刪除。',
        select: '選擇',
        adjust: '調整',
        on: '開啟',
        off: '關閉',
        cancel: '取消',
        delete: '刪除',
        warning: '警告',
        english: '英文',
      },
      ko: {
        systemMenu: '시스템 메뉴',
        title: '설정',
        masterVolume: '전체 음량',
        musicVolume: '음악 음량',
        sfxVolume: '효과음 음량',
        language: '언어',
        fullscreen: '전체 화면',
        screenShake: '화면 흔들림',
        vibration: '컨트롤러 진동',
        reset: '기본값 복원',
        deleteSave: '저장 데이터 삭제',
        deleteTitle: '저장 데이터를 삭제할까요?',
        deleteBody: '모든 클리어, 해금, 기록 및 최고 랭크가 영구 삭제됩니다.',
        select: '선택',
        adjust: '조정',
        on: '켜기',
        off: '끄기',
        cancel: '취소',
        delete: '삭제',
        warning: '경고',
        english: '영어',
      },
    }

    const locales = ['en', 'ja', 'zhHant', 'ko'] as const

    for (const locale of locales) {
      expect(resolveLocalizedText(localize, locale, 'settings.systemMenu')).toBe(
        expectedByLocale[locale].systemMenu,
      )
      expect(resolveLocalizedText(localize, locale, 'settings.title')).toBe(expectedByLocale[locale].title)
      expect(resolveLocalizedText(localize, locale, 'settings.masterVolume')).toBe(
        expectedByLocale[locale].masterVolume,
      )
      expect(resolveLocalizedText(localize, locale, 'settings.musicVolume')).toBe(
        expectedByLocale[locale].musicVolume,
      )
      expect(resolveLocalizedText(localize, locale, 'settings.sfxVolume')).toBe(
        expectedByLocale[locale].sfxVolume,
      )
      expect(resolveLocalizedText(localize, locale, 'settings.language')).toBe(
        expectedByLocale[locale].language,
      )
      expect(resolveLocalizedText(localize, locale, 'settings.fullscreen')).toBe(
        expectedByLocale[locale].fullscreen,
      )
      expect(resolveLocalizedText(localize, locale, 'settings.screenShake')).toBe(
        expectedByLocale[locale].screenShake,
      )
      expect(resolveLocalizedText(localize, locale, 'settings.vibration')).toBe(
        expectedByLocale[locale].vibration,
      )
      expect(resolveLocalizedText(localize, locale, 'settings.reset')).toBe(expectedByLocale[locale].reset)
      expect(resolveLocalizedText(localize, locale, 'settings.deleteSave')).toBe(
        expectedByLocale[locale].deleteSave,
      )
      expect(resolveLocalizedText(localize, locale, 'settings.deleteTitle')).toBe(
        expectedByLocale[locale].deleteTitle,
      )
      expect(resolveLocalizedText(localize, locale, 'settings.deleteBody')).toBe(
        expectedByLocale[locale].deleteBody,
      )
      expect(resolveLocalizedText(localize, locale, 'common.select')).toBe(expectedByLocale[locale].select)
      expect(resolveLocalizedText(localize, locale, 'common.adjust')).toBe(expectedByLocale[locale].adjust)
      expect(resolveLocalizedText(localize, locale, 'common.on')).toBe(expectedByLocale[locale].on)
      expect(resolveLocalizedText(localize, locale, 'common.off')).toBe(expectedByLocale[locale].off)
      expect(resolveLocalizedText(localize, locale, 'common.cancel')).toBe(expectedByLocale[locale].cancel)
      expect(resolveLocalizedText(localize, locale, 'common.delete')).toBe(expectedByLocale[locale].delete)
      expect(resolveLocalizedText(localize, locale, 'common.warning')).toBe(expectedByLocale[locale].warning)
      expect(resolveLocalizedText(localize, locale, 'language.en')).toBe(expectedByLocale[locale].english)
    }
  })
```

- [ ] **Step 2: Run localization test to verify failure**

Run: `npm run test -- src/domain/data/localize/localize.test.ts`

Expected: FAIL because settings, common, and language keys are not in the `LocalizationKey` union or catalog.

- [ ] **Step 3: Extend localization key types and catalog**

In `src/domain/data/localize/localize.ts`, add:

```ts
export type CommonLocalizationKey =
  | 'common.select'
  | 'common.confirm'
  | 'common.adjust'
  | 'common.back'
  | 'common.on'
  | 'common.off'
  | 'common.cancel'
  | 'common.delete'
  | 'common.warning'

export type LanguageLocalizationKey = `language.${LocaleCode}`

export type SettingsLocalizationKey =
  | 'settings.systemMenu'
  | 'settings.title'
  | 'settings.masterVolume'
  | 'settings.musicVolume'
  | 'settings.sfxVolume'
  | 'settings.language'
  | 'settings.fullscreen'
  | 'settings.screenShake'
  | 'settings.vibration'
  | 'settings.reset'
  | 'settings.deleteSave'
  | 'settings.decrease'
  | 'settings.increase'
  | 'settings.deleteTitle'
  | 'settings.deleteBody'
  | 'settings.aria.screen'
  | 'settings.aria.menu'
  | 'settings.aria.deleteConfirm'
```

Change `LocalizationKey` to include the new unions:

```ts
export type LocalizationKey =
  | WorldLocalizationKey
  | TitleLocalizationKey
  | CommonLocalizationKey
  | LanguageLocalizationKey
  | SettingsLocalizationKey
```

Add English, Japanese, Traditional Chinese, and Korean catalog entries matching the test values. Include `common.confirm`, `common.back`, `settings.decrease`, `settings.increase`, `settings.aria.screen`, `settings.aria.menu`, and `settings.aria.deleteConfirm` in every locale.

- [ ] **Step 4: Run localization test to verify pass**

Run: `npm run test -- src/domain/data/localize/localize.test.ts`

Expected: PASS.

- [ ] **Step 5: Write failing input tests for settings contexts**

Append to `src/domain/input/controlIntents.test.ts`:

```ts
  it('maps settings keys to row navigation, adjustment, confirm, and back intents', () => {
    expect(mapKeyboardControlIntent({ key: 'ArrowUp', repeat: false }, 'settings')).toBe('move-up')
    expect(mapKeyboardControlIntent({ key: 'w', repeat: false }, 'settings')).toBe('move-up')
    expect(mapKeyboardControlIntent({ key: 'ArrowDown', repeat: false }, 'settings')).toBe('move-down')
    expect(mapKeyboardControlIntent({ key: 's', repeat: false }, 'settings')).toBe('move-down')
    expect(mapKeyboardControlIntent({ key: 'ArrowLeft', repeat: false }, 'settings')).toBe('move-left')
    expect(mapKeyboardControlIntent({ key: 'a', repeat: false }, 'settings')).toBe('move-left')
    expect(mapKeyboardControlIntent({ key: 'ArrowRight', repeat: false }, 'settings')).toBe('move-right')
    expect(mapKeyboardControlIntent({ key: 'd', repeat: false }, 'settings')).toBe('move-right')
    expect(mapKeyboardControlIntent({ key: 'Enter', repeat: false }, 'settings')).toBe('confirm')
    expect(mapKeyboardControlIntent({ key: ' ', repeat: false }, 'settings')).toBe('confirm')
    expect(mapKeyboardControlIntent({ key: 'Escape', repeat: false }, 'settings')).toBe('back')
  })

  it('maps delete confirmation keys to horizontal selection, confirm, and back intents', () => {
    expect(mapKeyboardControlIntent({ key: 'ArrowLeft', repeat: false }, 'settings-delete-confirm')).toBe(
      'move-left',
    )
    expect(mapKeyboardControlIntent({ key: 'ArrowRight', repeat: false }, 'settings-delete-confirm')).toBe(
      'move-right',
    )
    expect(mapKeyboardControlIntent({ key: 'a', repeat: false }, 'settings-delete-confirm')).toBe('move-left')
    expect(mapKeyboardControlIntent({ key: 'd', repeat: false }, 'settings-delete-confirm')).toBe('move-right')
    expect(mapKeyboardControlIntent({ key: 'Enter', repeat: false }, 'settings-delete-confirm')).toBe('confirm')
    expect(mapKeyboardControlIntent({ key: 'Escape', repeat: false }, 'settings-delete-confirm')).toBe('back')
    expect(mapKeyboardControlIntent({ key: 'ArrowUp', repeat: false }, 'settings-delete-confirm')).toBeNull()
  })
```

Add this expectation to the gamepad button test:

```ts
    expect(
      mapGamepadControlIntents(previous, { ...previous, buttons: [true, false, false, false] }, 'settings'),
    ).toEqual(['confirm'])
```

- [ ] **Step 6: Run input test to verify failure**

Run: `npm run test -- src/domain/input/controlIntents.test.ts`

Expected: FAIL because `ControlContext` does not include settings contexts.

- [ ] **Step 7: Extend input context mapping**

In `src/domain/input/controlIntents.ts`, change `ControlContext`:

```ts
export type ControlContext =
  | 'title-intro'
  | 'title-menu'
  | 'world-select'
  | 'settings'
  | 'settings-delete-confirm'
```

In `mapKeyboardControlIntent`, add before the world-select branch:

```ts
  if (context === 'settings') {
    if (descriptor.key === 'ArrowUp' || key === 'w') return 'move-up'
    if (descriptor.key === 'ArrowDown' || key === 's') return 'move-down'
    if (descriptor.key === 'ArrowLeft' || key === 'a') return 'move-left'
    if (descriptor.key === 'ArrowRight' || key === 'd') return 'move-right'
    if (descriptor.key === 'Enter' || descriptor.key === ' ') return 'confirm'
    if (descriptor.key === 'Escape') return 'back'
    return null
  }

  if (context === 'settings-delete-confirm') {
    if (descriptor.key === 'ArrowLeft' || key === 'a') return 'move-left'
    if (descriptor.key === 'ArrowRight' || key === 'd') return 'move-right'
    if (descriptor.key === 'Enter' || descriptor.key === ' ') return 'confirm'
    if (descriptor.key === 'Escape') return 'back'
    return null
  }
```

The existing gamepad mapper can keep directional behavior for settings contexts because it already emits shared directional intents by button/axis.

- [ ] **Step 8: Run focused tests**

Run:

```bash
npm run test -- src/domain/data/localize/localize.test.ts
npm run test -- src/domain/input/controlIntents.test.ts
```

Expected: both PASS.

- [ ] **Step 9: Commit**

```bash
git add src/domain/data/localize/localize.test.ts src/domain/data/localize/localize.ts src/domain/input/controlIntents.test.ts src/domain/input/controlIntents.ts
git commit -m "feat: localize settings controls"
```

## Task 3: App Flow And Application Commands

**Files:**
- Modify: `src/domain/app/appFlow.test.ts`
- Modify: `src/domain/app/appFlow.ts`
- Modify: `src/application/input/appControls.test.ts`
- Modify: `src/application/input/appControls.ts`

- [ ] **Step 1: Write failing app-flow tests**

In `src/domain/app/appFlow.test.ts`, import:

```ts
  backFromSettings,
  cancelDeleteConfirm,
  moveSettingsDeleteConfirmSelection,
  moveSettingsScreenSelection,
  openSettingsDeleteConfirm,
```

Change the `activateTitleMenuItem` Settings test to:

```ts
  it('opens settings when Settings is activated', () => {
    const state = { screen: { type: 'title-menu', selectedItemIndex: 1 } } as const

    expect(activateTitleMenuItem(state)).toEqual({
      screen: { type: 'settings', selectedItemIndex: 0, deleteConfirm: null },
    })
  })
```

Append:

```ts
describe('settings screen flow', () => {
  it('moves settings selection with wraparound', () => {
    expect(
      moveSettingsScreenSelection(
        { screen: { type: 'settings', selectedItemIndex: 0, deleteConfirm: null } },
        -1,
      ),
    ).toEqual({ screen: { type: 'settings', selectedItemIndex: 9, deleteConfirm: null } })
  })

  it('opens, moves, and cancels delete confirmation', () => {
    const settingsState = { screen: { type: 'settings', selectedItemIndex: 8, deleteConfirm: null } } as const

    expect(openSettingsDeleteConfirm(settingsState)).toEqual({
      screen: { type: 'settings', selectedItemIndex: 8, deleteConfirm: { selectedActionIndex: 0 } },
    })
    expect(
      moveSettingsDeleteConfirmSelection(
        { screen: { type: 'settings', selectedItemIndex: 8, deleteConfirm: { selectedActionIndex: 0 } } },
        1,
      ),
    ).toEqual({
      screen: { type: 'settings', selectedItemIndex: 8, deleteConfirm: { selectedActionIndex: 1 } },
    })
    expect(
      cancelDeleteConfirm({
        screen: { type: 'settings', selectedItemIndex: 8, deleteConfirm: { selectedActionIndex: 1 } },
      }),
    ).toEqual({ screen: { type: 'settings', selectedItemIndex: 8, deleteConfirm: null } })
  })

  it('returns from settings to title menu with Settings selected', () => {
    expect(backFromSettings({ screen: { type: 'settings', selectedItemIndex: 3, deleteConfirm: null } })).toEqual({
      screen: { type: 'title-menu', selectedItemIndex: 1 },
    })
  })
})
```

- [ ] **Step 2: Run app-flow test to verify failure**

Run: `npm run test -- src/domain/app/appFlow.test.ts`

Expected: FAIL because the settings app screen and helpers do not exist.

- [ ] **Step 3: Implement app-flow settings helpers**

In `src/domain/app/appFlow.ts`, import:

```ts
import {
  moveDeleteConfirmSelection,
  moveSettingsSelection,
  openDeleteConfirm,
  type DeleteConfirmState,
} from '../settings/settings'
```

Add:

```ts
export type SettingsScreen = {
  type: 'settings'
  selectedItemIndex: number
  deleteConfirm: DeleteConfirmState | null
}
```

Include `SettingsScreen` in `AppScreen`. In `activateTitleMenuItem`, replace the inactive Settings behavior:

```ts
  if (selectedItem === 'settings') {
    return {
      screen: { type: 'settings', selectedItemIndex: 0, deleteConfirm: null },
    }
  }
```

Append helpers:

```ts
export function moveSettingsScreenSelection(state: AppState, direction: -1 | 1): AppState {
  if (state.screen.type !== 'settings' || state.screen.deleteConfirm) return state

  return {
    screen: {
      ...state.screen,
      selectedItemIndex: moveSettingsSelection(state.screen.selectedItemIndex, direction),
    },
  }
}

export function openSettingsDeleteConfirm(state: AppState): AppState {
  if (state.screen.type !== 'settings') return state

  return {
    screen: {
      ...state.screen,
      deleteConfirm: openDeleteConfirm(),
    },
  }
}

export function moveSettingsDeleteConfirmSelection(state: AppState, direction: -1 | 1): AppState {
  if (state.screen.type !== 'settings' || !state.screen.deleteConfirm) return state

  return {
    screen: {
      ...state.screen,
      deleteConfirm: {
        selectedActionIndex: moveDeleteConfirmSelection(
          state.screen.deleteConfirm.selectedActionIndex,
          direction,
        ),
      },
    },
  }
}

export function cancelDeleteConfirm(state: AppState): AppState {
  if (state.screen.type !== 'settings' || !state.screen.deleteConfirm) return state

  return {
    screen: {
      ...state.screen,
      deleteConfirm: null,
    },
  }
}

export function backFromSettings(state: AppState): AppState {
  if (state.screen.type !== 'settings') return state

  if (state.screen.deleteConfirm) return cancelDeleteConfirm(state)

  return {
    screen: { type: 'title-menu', selectedItemIndex: 1 },
  }
}
```

- [ ] **Step 4: Run app-flow test to verify pass**

Run: `npm run test -- src/domain/app/appFlow.test.ts`

Expected: PASS.

- [ ] **Step 5: Write failing application-control tests**

Replace `src/application/input/appControls.test.ts` imports with:

```ts
import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from '../../domain/settings/settings'
import { applyControlIntent } from './appControls'
```

Append:

```ts
  it('moves, adjusts, activates, and backs out of settings', () => {
    const settingsState = {
      screen: { type: 'settings', selectedItemIndex: 0, deleteConfirm: null },
      settings: DEFAULT_SETTINGS,
    } as const

    expect(applyControlIntent(settingsState, 'move-down')).toEqual({
      ...settingsState,
      screen: { type: 'settings', selectedItemIndex: 1, deleteConfirm: null },
    })
    expect(applyControlIntent(settingsState, 'move-up')).toEqual({
      ...settingsState,
      screen: { type: 'settings', selectedItemIndex: 9, deleteConfirm: null },
    })
    expect(applyControlIntent(settingsState, 'move-right')).toEqual({
      ...settingsState,
      settings: { ...DEFAULT_SETTINGS, masterVolume: 100 },
    })
    expect(applyControlIntent(settingsState, 'move-left')).toEqual({
      ...settingsState,
      settings: { ...DEFAULT_SETTINGS, masterVolume: 90 },
    })
    expect(applyControlIntent({ ...settingsState, screen: { type: 'settings', selectedItemIndex: 8, deleteConfirm: null } }, 'confirm')).toEqual({
      ...settingsState,
      screen: { type: 'settings', selectedItemIndex: 8, deleteConfirm: { selectedActionIndex: 0 } },
    })
    expect(applyControlIntent(settingsState, 'back')).toEqual({
      screen: { type: 'title-menu', selectedItemIndex: 1 },
      settings: DEFAULT_SETTINGS,
    })
  })

  it('handles delete confirmation controls in settings', () => {
    const state = {
      screen: { type: 'settings', selectedItemIndex: 8, deleteConfirm: { selectedActionIndex: 0 as const } },
      settings: DEFAULT_SETTINGS,
    }

    expect(applyControlIntent(state, 'move-right')).toEqual({
      ...state,
      screen: { type: 'settings', selectedItemIndex: 8, deleteConfirm: { selectedActionIndex: 1 } },
    })
    expect(applyControlIntent(state, 'back')).toEqual({
      ...state,
      screen: { type: 'settings', selectedItemIndex: 8, deleteConfirm: null },
    })
    expect(applyControlIntent(state, 'confirm')).toEqual({
      ...state,
      screen: { type: 'settings', selectedItemIndex: 8, deleteConfirm: null },
    })
  })
```

- [ ] **Step 6: Run application-control test to verify failure**

Run: `npm run test -- src/application/input/appControls.test.ts`

Expected: FAIL because settings intent application is not implemented.

- [ ] **Step 7: Implement settings intent application**

In `src/application/input/appControls.ts`, import:

```ts
  backFromSettings,
  cancelDeleteConfirm,
  moveSettingsDeleteConfirmSelection,
  moveSettingsScreenSelection,
  openSettingsDeleteConfirm,
```

and:

```ts
import { adjustSettingsRow, resetSettings, type GameSettings } from '../../domain/settings/settings'
import { projectData } from '../../domain/data/projectData'
```

Extend `AppState` handling by preserving additional `settings` property structurally:

```ts
type SettingsStateCarrier = AppState & {
  settings?: GameSettings
}
```

In `applyControlIntent`, before world-select handling:

```ts
  if (state.screen.type === 'settings') {
    const currentSettings = (state as SettingsStateCarrier).settings

    if (state.screen.deleteConfirm) {
      if (intent === 'move-left') return moveSettingsDeleteConfirmSelection(state, -1)
      if (intent === 'move-right') return moveSettingsDeleteConfirmSelection(state, 1)
      if (intent === 'back') return cancelDeleteConfirm(state)
      if (intent === 'confirm') return cancelDeleteConfirm(state)
      return state
    }

    if (intent === 'move-up') return moveSettingsScreenSelection(state, -1)
    if (intent === 'move-down') return moveSettingsScreenSelection(state, 1)
    if ((intent === 'move-left' || intent === 'move-right') && currentSettings) {
      return {
        ...state,
        settings: adjustSettingsRow(
          currentSettings,
          state.screen.selectedItemIndex,
          intent === 'move-left' ? -1 : 1,
          projectData.localize.languages.map((language) => language.code),
        ),
      }
    }
    if (intent === 'confirm') {
      if (state.screen.selectedItemIndex === 7 && currentSettings) {
        return { ...state, settings: resetSettings(currentSettings.fullscreen) }
      }
      if (state.screen.selectedItemIndex === 8) return openSettingsDeleteConfirm(state)
      if (state.screen.selectedItemIndex === 9) return backFromSettings(state)
      if (currentSettings) {
        return {
          ...state,
          settings: adjustSettingsRow(
            currentSettings,
            state.screen.selectedItemIndex,
            1,
            projectData.localize.languages.map((language) => language.code),
          ),
        }
      }
    }
    if (intent === 'back') return backFromSettings(state)
    return state
  }
```

- [ ] **Step 8: Run focused tests**

Run:

```bash
npm run test -- src/domain/app/appFlow.test.ts
npm run test -- src/application/input/appControls.test.ts
```

Expected: both PASS.

- [ ] **Step 9: Commit**

```bash
git add src/domain/app/appFlow.test.ts src/domain/app/appFlow.ts src/application/input/appControls.test.ts src/application/input/appControls.ts
git commit -m "feat: route settings controls"
```

## Task 4: Settings Svelte Screen And Styles

**Files:**
- Create: `src/ui/settings/SettingsScreen.svelte`
- Modify: `src/app.css`

- [ ] **Step 1: Create settings screen component**

Create `src/ui/settings/SettingsScreen.svelte`:

```svelte
<script lang="ts">
  import { onMount } from 'svelte'
  import type { SettingsScreen as SettingsScreenState } from '../../domain/app/appFlow'
  import {
    resolveLocalizedText,
    type LocaleCode,
    type LocalizeData,
    type LocalizationKey,
  } from '../../domain/data/localize/localize'
  import {
    mapGamepadControlIntents,
    mapKeyboardControlIntent,
    type ControlIntent,
    type GamepadControlSnapshot,
  } from '../../domain/input/controlIntents'
  import { SETTINGS_ROWS, type GameSettings, type SettingsRowId } from '../../domain/settings/settings'

  type Props = {
    screen: SettingsScreenState
    settings: GameSettings
    localizeData: LocalizeData
    locale: LocaleCode
    onControlIntent: (intent: ControlIntent) => void
    onSelectItem: (index: number) => void
    onAdjustItem: (index: number, direction: -1 | 1) => void
    onActivateItem: (index: number) => void
    onCancelDelete: () => void
    onConfirmDelete: () => void
  }

  let {
    screen,
    settings,
    localizeData,
    locale,
    onControlIntent,
    onSelectItem,
    onAdjustItem,
    onActivateItem,
    onCancelDelete,
    onConfirmDelete,
  }: Props = $props()

  let previousGamepadSnapshot: GamepadControlSnapshot | null = null

  const rowLabelRefs: Record<SettingsRowId, LocalizationKey> = {
    'master-volume': 'settings.masterVolume',
    'music-volume': 'settings.musicVolume',
    'sfx-volume': 'settings.sfxVolume',
    language: 'settings.language',
    fullscreen: 'settings.fullscreen',
    'screen-shake': 'settings.screenShake',
    vibration: 'settings.vibration',
    reset: 'settings.reset',
    'delete-save': 'settings.deleteSave',
    back: 'common.back',
  }

  function text(key: LocalizationKey): string {
    return resolveLocalizedText(localizeData, locale, key)
  }

  function settingValue(index: number): string {
    if (index === 0) return `${settings.masterVolume}%`
    if (index === 1) return `${settings.musicVolume}%`
    if (index === 2) return `${settings.sfxVolume}%`
    if (index === 3) return text(`language.${settings.language}`)
    if (index === 4) return text(settings.fullscreen ? 'common.on' : 'common.off')
    if (index === 5) return text(settings.screenShake ? 'common.on' : 'common.off')
    if (index === 6) return text(settings.vibration ? 'common.on' : 'common.off')
    return ''
  }

  function meterValue(index: number): number {
    if (index === 0) return settings.masterVolume
    if (index === 1) return settings.musicVolume
    if (index === 2) return settings.sfxVolume
    return 0
  }

  function controlContext() {
    return screen.deleteConfirm ? 'settings-delete-confirm' : 'settings'
  }

  function handleKeydown(event: KeyboardEvent) {
    const intent = mapKeyboardControlIntent(
      { key: event.key, repeat: event.repeat },
      controlContext(),
    )

    if (intent) {
      event.preventDefault()
      onControlIntent(intent)
    }
  }

  function readGamepadSnapshot(): GamepadControlSnapshot | null {
    const gamepads = navigator.getGamepads?.()
    const gamepad = Array.from(gamepads ?? []).find((candidate): candidate is Gamepad => Boolean(candidate))
    if (!gamepad) return null

    return {
      buttons: gamepad.buttons.map((button) => button.pressed),
      axes: [...gamepad.axes],
    }
  }

  onMount(() => {
    let frameId = 0

    function pollGamepad() {
      const currentSnapshot = readGamepadSnapshot()
      const intents = mapGamepadControlIntents(previousGamepadSnapshot, currentSnapshot, controlContext())

      for (const intent of intents) {
        onControlIntent(intent)
      }

      previousGamepadSnapshot = currentSnapshot
      frameId = requestAnimationFrame(pollGamepad)
    }

    frameId = requestAnimationFrame(pollGamepad)

    return () => cancelAnimationFrame(frameId)
  })
</script>

<svelte:window onkeydown={handleKeydown} />

<section class="settings-screen" aria-label={text('settings.aria.screen')}>
  <img src="/assets/title/project-almost-title-background.webp" alt="" />
  <div class="settings-backdrop" aria-hidden="true"></div>

  <div class="settings-panel">
    <span class="pause-kicker">{text('settings.systemMenu')}</span>
    <strong>{text('settings.title')}</strong>
    <div class="pause-rule"></div>

    <div class="settings-list" role="menu" aria-label={text('settings.aria.menu')}>
      {#each SETTINGS_ROWS as item, index}
        {#if item.kind === 'volume'}
          <div
            class:active={screen.selectedItemIndex === index}
            class="settings-row"
            role="menuitem"
            tabindex="0"
            onclick={() => onSelectItem(index)}
            onkeydown={(event) => {
              if (event.key === 'Enter' || event.code === 'Space') onSelectItem(index)
            }}
          >
            <span class="settings-index">{String(index + 1).padStart(2, '0')}</span>
            <b>{text(rowLabelRefs[item.id])}</b>
            <span class="settings-adjust">
              <button
                type="button"
                aria-label={text('settings.decrease').replace('{item}', text(rowLabelRefs[item.id]))}
                onclick={(event) => {
                  event.stopPropagation()
                  onSelectItem(index)
                  onAdjustItem(index, -1)
                }}
              >-</button>
              <span class="settings-value">{settingValue(index)}</span>
              <button
                type="button"
                aria-label={text('settings.increase').replace('{item}', text(rowLabelRefs[item.id]))}
                onclick={(event) => {
                  event.stopPropagation()
                  onSelectItem(index)
                  onAdjustItem(index, 1)
                }}
              >+</button>
            </span>
            <span class="settings-meter" aria-hidden="true">
              <i style={`width:${meterValue(index)}%`}></i>
            </span>
          </div>
        {:else}
          <button
            class:active={screen.selectedItemIndex === index}
            class:action={item.kind === 'action'}
            class:danger={item.kind === 'danger'}
            type="button"
            role="menuitem"
            onclick={() => {
              onSelectItem(index)
              onActivateItem(index)
            }}
          >
            <span class="settings-index">{String(index + 1).padStart(2, '0')}</span>
            <b>{text(rowLabelRefs[item.id])}</b>
            {#if settingValue(index)}
              <span class="settings-value">{settingValue(index)}</span>
            {:else}
              <span class="settings-action-mark">›</span>
            {/if}
          </button>
        {/if}
      {/each}
    </div>

    <p>
      <kbd>↑</kbd><kbd>↓</kbd> {text('common.select')} <kbd>←</kbd><kbd>→</kbd>
      {text('common.adjust')} <kbd>Esc</kbd> {text('common.back')}
    </p>
  </div>

  {#if screen.deleteConfirm}
    <div
      class="confirm-dialog"
      role="alertdialog"
      aria-modal="true"
      aria-label={text('settings.aria.deleteConfirm')}
    >
      <div>
        <span class="pause-kicker">{text('common.warning')}</span>
        <strong>{text('settings.deleteTitle')}</strong>
        <p>{text('settings.deleteBody')}</p>
        <nav>
          <button
            class:active={screen.deleteConfirm.selectedActionIndex === 0}
            type="button"
            onclick={onCancelDelete}
          >{text('common.cancel')}</button>
          <button
            class:active={screen.deleteConfirm.selectedActionIndex === 1}
            class="danger"
            type="button"
            onclick={onConfirmDelete}
          >{text('common.delete')}</button>
        </nav>
      </div>
    </div>
  {/if}
</section>
```

- [ ] **Step 2: Add prototype-equivalent CSS**

Append to `src/app.css` the settings styles copied from the prototype and scoped to the rebuild frame. Include these selectors exactly so `SettingsScreen.svelte` renders correctly:

```css
.settings-screen {
  position: relative;
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  overflow: hidden;
  color: var(--hud-ink);
}

.settings-screen > img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.settings-backdrop {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 35%, rgba(255, 255, 255, 0.18), transparent 32%),
    linear-gradient(180deg, rgba(8, 20, 42, 0.34), rgba(8, 20, 42, 0.68));
  backdrop-filter: blur(2px);
}

.settings-panel {
  position: relative;
  box-sizing: border-box;
  width: 40cqw;
  max-width: calc(100cqw - 4cqw);
  max-height: 92cqh;
  padding: 1.25cqh 1.25cqw 0.9cqh;
  border: 1.5px solid var(--hud-line);
  border-radius: 8px;
  background: color-mix(in srgb, var(--hud-panel) 94%, white);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.9) inset,
    0 0 0 4px rgba(255, 255, 255, 0.22),
    0 28px 70px rgba(6, 27, 62, 0.48);
  color: var(--hud-ink);
  text-align: center;
  animation: pause-menu-in 260ms cubic-bezier(0.2, 0.9, 0.25, 1.15) both;
}

.settings-panel::after {
  content: "";
  position: absolute;
  inset: 6px;
  border: 1px solid var(--hud-line-soft);
  border-radius: 4px;
  pointer-events: none;
}

.pause-kicker {
  display: block;
  color: var(--accent);
  font-family: "Share Tech Mono", monospace;
  font-size: clamp(10px, 0.78cqw, 16px);
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.pause-rule {
  width: 100%;
  height: 1px;
  margin: 1cqh 0;
  background: linear-gradient(90deg, transparent, var(--hud-line), transparent);
}

.settings-panel > strong {
  display: block;
  margin-top: 0.15cqh;
  font-size: 2.25cqw;
  letter-spacing: 0.12em;
  line-height: 1;
  text-transform: uppercase;
}

.settings-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.22cqh;
}

.settings-list > button,
.settings-row {
  position: relative;
  display: grid;
  grid-template-columns: 1.8cqw minmax(0, 1fr) auto;
  gap: 0.5cqw;
  align-items: center;
  min-height: clamp(27px, 3.75cqh, 42px);
  padding: 0.22cqh 0.65cqw;
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.4);
  color: var(--hud-ink);
  text-align: left;
  cursor: pointer;
}

.settings-row {
  grid-template-rows: minmax(24px, 2.65cqh) 0.35cqh;
  row-gap: 0.35cqh;
  min-height: clamp(34px, 4.25cqh, 48px);
  padding-bottom: 0.35cqh;
}

.settings-row > .settings-index,
.settings-row > b,
.settings-row > .settings-adjust {
  grid-row: 1;
}

.settings-list > button::before,
.settings-row::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: transparent;
}

.settings-list > button.active,
.settings-row.active {
  border-color: var(--hud-line);
  background: linear-gradient(90deg, rgba(110, 195, 255, 0.36), rgba(255, 255, 255, 0.76));
  box-shadow: 0 0 14px rgba(47, 111, 208, 0.14);
}

.settings-list > button.active::before,
.settings-row.active::before {
  background: var(--accent);
  box-shadow: 0 0 8px var(--glow);
}

.settings-list > button.danger {
  color: #9c3040;
}

.settings-list > button.danger.active {
  border-color: rgba(184, 49, 68, 0.55);
  background: linear-gradient(90deg, rgba(255, 184, 190, 0.48), rgba(255, 255, 255, 0.78));
}

.settings-index {
  color: var(--hud-soft);
  font-size: clamp(10px, 0.72cqw, 16px);
  font-weight: 700;
}

.settings-list > button b,
.settings-row > b {
  overflow: hidden;
  font-size: clamp(12px, 1cqw, 22px);
  letter-spacing: 0.06em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.settings-meter {
  grid-row: 2;
  grid-column: 2 / -1;
  width: 100%;
  height: 0.35cqh;
  overflow: hidden;
  border-radius: 2px;
  background: rgba(47, 111, 208, 0.14);
}

.settings-meter i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--accent), #79cfff);
}

.settings-value {
  min-width: 2.3cqw;
  color: var(--hud-soft);
  font-size: clamp(11px, 0.88cqw, 19px);
  font-weight: 700;
  text-align: right;
  text-transform: uppercase;
}

.settings-adjust {
  display: grid;
  grid-template-columns: 2.1cqw 3.2cqw 2.1cqw;
  gap: 0.28cqw;
  align-items: center;
}

.settings-adjust button {
  display: grid;
  width: 100%;
  min-width: 26px;
  height: 2.65cqh;
  min-height: 24px;
  padding: 0;
  place-items: center;
  border: 1px solid var(--hud-line);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.82);
  color: var(--hud-ink);
  font-size: clamp(14px, 1cqw, 22px);
  font-weight: 800;
  cursor: pointer;
}

.settings-adjust button:active {
  background: var(--accent-pale);
  scale: 0.95;
}

.settings-adjust .settings-value {
  min-width: 0;
  text-align: center;
}

.settings-action-mark {
  color: var(--accent);
  font-size: 1.25cqw;
  line-height: 1;
}

.settings-panel p {
  display: flex;
  gap: 0.38cqw;
  align-items: center;
  justify-content: center;
  margin: 0.7cqh 0 0;
  color: var(--hud-soft);
  font-size: clamp(9px, 0.62cqw, 14px);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.settings-panel kbd {
  display: grid;
  min-width: 1.35cqw;
  height: 2.15cqh;
  padding: 0 0.25cqw;
  place-items: center;
  border: 1px solid var(--hud-line);
  border-radius: 4px;
  background: white;
  color: var(--hud-ink);
  font-family: "Share Tech Mono", monospace;
}

.confirm-dialog {
  position: fixed;
  z-index: 60;
  display: grid;
  inset: 0;
  place-items: center;
  background: rgba(8, 20, 42, 0.62);
  backdrop-filter: blur(5px);
}

.confirm-dialog > div {
  width: min(30cqw, 520px);
  padding: 2.4cqh 1.8cqw;
  border: 1px solid rgba(184, 49, 68, 0.55);
  border-radius: 7px;
  background: rgba(248, 253, 255, 0.98);
  box-shadow: 0 28px 70px rgba(6, 27, 62, 0.5);
  color: var(--hud-ink);
  text-align: center;
}

.confirm-dialog strong {
  display: block;
  margin: 0.5cqh 0 1.2cqh;
  color: #922d3c;
  font-size: min(1.7cqw, 34px);
  text-transform: uppercase;
}

.confirm-dialog p {
  display: block;
  margin: 0 auto 2cqh;
  color: var(--hud-soft);
  font-size: min(0.75cqw, 15px);
  line-height: 1.55;
  text-transform: none;
}

.confirm-dialog nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8cqw;
}

.confirm-dialog button {
  min-height: 5cqh;
  border: 1px solid var(--hud-line);
  border-radius: 5px;
  background: white;
  color: var(--hud-ink);
  font-weight: 800;
  text-transform: uppercase;
}

.confirm-dialog button.active {
  outline: 3px solid rgba(47, 111, 208, 0.22);
  background: var(--accent-pale);
}

.confirm-dialog button.danger {
  border-color: rgba(184, 49, 68, 0.55);
  color: #922d3c;
}

.confirm-dialog button.danger.active {
  outline-color: rgba(184, 49, 68, 0.24);
  background: #ffe8eb;
}

@media (max-width: 760px) {
  .settings-panel {
    width: 86cqw;
  }

  .confirm-dialog > div {
    width: min(82cqw, 520px);
  }
}
```

- [ ] **Step 3: Run Svelte check to expose integration failures**

Run: `npm run check`

Expected: FAIL because `SettingsScreen.svelte` references localization keys and app-flow types that only pass after Tasks 2 and 3. If Tasks 2 and 3 are complete, expected PASS.

- [ ] **Step 4: Commit after check passes**

Run after `npm run check` passes:

```bash
git add src/ui/settings/SettingsScreen.svelte src/app.css
git commit -m "feat: add settings screen UI"
```

## Task 5: App Shell Persistence And Browser Adapters

**Files:**
- Modify: `src/App.svelte`
- Modify: `src/application/input/appControls.test.ts`

- [ ] **Step 1: Wire settings state in `App.svelte`**

Modify `src/App.svelte` imports:

```ts
  import { onMount } from 'svelte'
  import {
    backFromWorldSelect,
    cancelDeleteConfirm,
    confirmSelectedWorld,
    createInitialAppState,
    selectTitleMenuItem,
    selectWorld,
  } from './domain/app/appFlow'
  import {
    adjustSettingsRow,
    parseStoredSettings,
    resetSettings,
    SETTINGS_STORAGE_KEY,
    type GameSettings,
  } from './domain/settings/settings'
  import SettingsScreen from './ui/settings/SettingsScreen.svelte'
```

Replace the hard-coded locale with:

```ts
  let settings: GameSettings = $state(parseStoredSettings(null, false))
  let appState = $state({ ...createInitialAppState(), settings })
  let locale: LocaleCode = $derived(settings.language)
```

Add:

```ts
  function syncSettings(nextSettings: GameSettings) {
    settings = nextSettings
    appState = { ...appState, settings }
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  }

  function actualFullscreen() {
    return Boolean(document.fullscreenElement)
  }

  async function setFullscreen(enabled: boolean) {
    try {
      if (enabled && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      } else if (!enabled && document.fullscreenElement) {
        await document.exitFullscreen()
      }
    } finally {
      syncSettings({ ...settings, fullscreen: actualFullscreen() })
    }
  }

  function handleSelectSettingsItem(index: number) {
    if (appState.screen.type !== 'settings' || appState.screen.deleteConfirm) return
    appState = { ...appState, screen: { ...appState.screen, selectedItemIndex: index } }
  }

  function handleAdjustSettingsItem(index: number, direction: -1 | 1) {
    const nextSettings = adjustSettingsRow(
      settings,
      index,
      direction,
      projectData.localize.languages.map((language) => language.code),
    )
    syncSettings(nextSettings)
    if (index === 4) void setFullscreen(nextSettings.fullscreen)
  }

  function handleActivateSettingsItem(index: number) {
    if (index <= 6) {
      handleAdjustSettingsItem(index, 1)
      return
    }
    if (index === 7) {
      syncSettings(resetSettings(actualFullscreen()))
      return
    }
    if (index === 8 && appState.screen.type === 'settings') {
      appState = { ...appState, screen: { ...appState.screen, deleteConfirm: { selectedActionIndex: 0 } } }
      return
    }
    if (index === 9) {
      appState = { ...appState, screen: { type: 'title-menu', selectedItemIndex: 1 } }
    }
  }

  function handleCancelDelete() {
    appState = cancelDeleteConfirm(appState)
  }

  function handleConfirmDelete() {
    appState = cancelDeleteConfirm(appState)
  }
```

Update `handleControlIntent`:

```ts
  function handleControlIntent(intent: ControlIntent) {
    const nextState = applyControlIntent({ ...appState, settings }, intent)
    appState = nextState
    if ('settings' in nextState && nextState.settings) {
      syncSettings(nextState.settings)
      if (appState.screen.type === 'settings' && appState.screen.selectedItemIndex === 4) {
        void setFullscreen(nextState.settings.fullscreen)
      }
    }
  }
```

Add `onMount`:

```ts
  onMount(() => {
    syncSettings(parseStoredSettings(localStorage.getItem(SETTINGS_STORAGE_KEY), actualFullscreen()))

    const handleFullscreenChange = () => {
      syncSettings({ ...settings, fullscreen: actualFullscreen() })
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  })
```

Render settings:

```svelte
    {:else if appState.screen.type === 'settings'}
      <SettingsScreen
        screen={appState.screen}
        {settings}
        localizeData={projectData.localize}
        locale={locale}
        onControlIntent={handleControlIntent}
        onSelectItem={handleSelectSettingsItem}
        onAdjustItem={handleAdjustSettingsItem}
        onActivateItem={handleActivateSettingsItem}
        onCancelDelete={handleCancelDelete}
        onConfirmDelete={handleConfirmDelete}
      />
```

- [ ] **Step 2: Run Svelte check to verify failures**

Run: `npm run check`

Expected: FAIL if any prop, type, or Svelte syntax integration is wrong. Fix only the reported integration errors, keeping the behavior above intact.

- [ ] **Step 3: Run app tests and check**

Run:

```bash
npm run test -- src/application/input/appControls.test.ts
npm run check
```

Expected: both PASS.

- [ ] **Step 4: Commit**

```bash
git add src/App.svelte src/application/input/appControls.test.ts
git commit -m "feat: wire settings page in app shell"
```

## Task 6: Full Verification And Visual Pass

**Files:**
- Verify current worktree.

- [ ] **Step 1: Run domain and application tests**

Run: `npm run test`

Expected: PASS.

- [ ] **Step 2: Run Svelte and TypeScript checks**

Run: `npm run check`

Expected: PASS.

- [ ] **Step 3: Run production build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 4: Run whitespace sanity check**

Run: `git diff --check`

Expected: no output and exit code 0.

- [ ] **Step 5: Run local app for browser verification**

Run: `npm run dev`

Expected: Vite serves the app on `http://127.0.0.1:1420/`.

Manual/browser checks:

- Press any key on the title intro.
- Select Settings.
- Confirm opens settings.
- Up/down wraps across ten rows.
- Left/right adjusts volume, language, and toggles.
- Reset restores prototype defaults.
- Delete Save Data opens confirmation.
- Left/right changes Cancel/Delete.
- Escape cancels confirmation first, then backs to title menu.
- Mouse buttons and row clicks work.
- Language changes visible settings text immediately.
- The panel visually matches the prototype: same compact white system panel, numbered rows, volume meters, red delete row, and centered confirmation dialog.

- [ ] **Step 6: Stop dev server**

If the dev server is still running in this session, stop it with `Ctrl-C`.

- [ ] **Step 7: Inspect final diff**

Run: `git diff --stat`

Expected: changes are limited to settings domain, localization, input controls, app flow, application control bridge, settings UI, app shell, styles, and docs.

- [ ] **Step 8: Commit final verification fixes if needed**

If verification required small fixes, commit them:

```bash
git add src docs
git commit -m "fix: polish settings page verification"
```

## Self-Review

- Spec coverage: Tasks cover prototype row order, defaults, adjustment behavior, delete confirmation, localization, shared keyboard/gamepad controls, app navigation, persistence key, fullscreen adapter boundary, no-op delete boundary, Svelte UI, prototype styles, and required verification.
- Placeholder scan: The plan contains no deferred-work markers. Every code-changing step includes concrete file paths and code or exact replacement instructions.
- Type consistency: `GameSettings`, `SettingsScreen`, `DeleteConfirmState`, `ControlIntent`, and `LocaleCode` names match the planned imports and existing code style.
