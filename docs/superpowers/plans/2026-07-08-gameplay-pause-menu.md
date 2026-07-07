# Gameplay Pause Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the prototype-equivalent gameplay Pause Menu with real Phaser pause/resume, restart, pause-origin settings, and return-to-stage-select behavior.

**Architecture:** Pause state lives in a pure `src/domain/gameplay/gameplayPause.ts` module and is owned reactively by `GameplayScreen.svelte`. Phaser pausing is exposed through an explicit renderer controller, while the pause menu and pause-origin settings render as Svelte overlays over the still-mounted gameplay screen. Settings rows are extracted into a reusable panel so title-origin Settings and pause-origin Settings share behavior without routing away from gameplay.

**Tech Stack:** TypeScript, Vitest, Svelte 5 runes, Phaser, existing localization/settings/control-intent modules, existing `ControlHints`.

---

## File Structure

- Create `src/domain/gameplay/gameplayPause.ts`
  - Pure pause menu state, item list, selection movement, activation, and pause-settings return behavior.
- Create `src/domain/gameplay/gameplayPause.test.ts`
  - TDD coverage for all pure pause transitions.
- Modify `src/domain/input/controlIntents.ts`
  - Add `gameplay-active` and `gameplay-pause-menu` control contexts.
- Modify `src/domain/input/controlIntents.test.ts`
  - Verify keyboard/gamepad pause mappings and preserve existing menu mappings.
- Modify `src/domain/data/localize/localize.ts`
  - Add `pause.*` localization keys and values for all supported locales.
- Modify `src/domain/data/localize/localize.test.ts`
  - Verify pause copy resolves in every locale.
- Create `src/application/input/settingsControls.ts`
  - Pure reusable settings-control reducer for routed Settings and pause-origin Settings.
- Create `src/application/input/settingsControls.test.ts`
  - TDD coverage for settings movement, adjustment, delete-confirm, reset, fullscreen-change reporting, and exit requests.
- Modify `src/ui/gameplay/createGameplayRenderer.ts`
  - Return a controller with `game`, `pause`, `resume`, `resetTiming`, and `destroy`.
- Modify `src/ui/gameplay/createGameplayRenderer.test.ts`
  - Source-level contract for the explicit renderer controller boundary.
- Create `src/ui/settings/SettingsPanel.svelte`
  - Reusable settings panel/body extracted from `SettingsScreen.svelte`.
- Modify `src/ui/settings/SettingsScreen.svelte`
  - Render `SettingsPanel` for title-origin settings.
- Create `src/ui/settings/settingsPanelUi.test.ts`
  - Source-level tests ensuring settings UI is centralized in the reusable panel.
- Create `src/ui/gameplay/PauseMenu.svelte`
  - Presentational pause overlay matching prototype structure and animation.
- Create `src/ui/gameplay/pauseMenuUi.test.ts`
  - Source-level tests for pause menu structure, localization references, `ControlHints`, and CSS contracts.
- Modify `src/ui/gameplay/GameplayScreen.svelte`
  - Own pause state, renderer controller, pause/settings overlays, input precedence, and action callbacks.
- Modify `src/ui/gameplay/gameplayScreenResult.test.ts` or add `src/ui/gameplay/gameplayScreenPause.test.ts`
  - Source-level tests for pause integration and Stage Result input precedence.
- Modify `src/ui/controls/controlHints.test.ts`
  - Include `PauseMenu.svelte` in screens that must use shared `ControlHints`.
- Modify `src/App.svelte`
  - Pass settings/localization/control callbacks into `GameplayScreen`, and expose settings mutation callbacks already used by `SettingsScreen`.
- Modify `src/application/input/appControls.ts`
  - Keep routed title-origin Settings behavior intact while allowing the new reusable settings helper to be used by Gameplay.

---

### Task 1: Pure Pause Domain, Localization, And Input Contexts

**Files:**
- Create: `src/domain/gameplay/gameplayPause.test.ts`
- Create: `src/domain/gameplay/gameplayPause.ts`
- Modify: `src/domain/input/controlIntents.test.ts`
- Modify: `src/domain/input/controlIntents.ts`
- Modify: `src/domain/data/localize/localize.test.ts`
- Modify: `src/domain/data/localize/localize.ts`

- [ ] **Step 1: Write failing domain pause tests**

Create `src/domain/gameplay/gameplayPause.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  PAUSE_MENU_ITEMS,
  activatePauseMenuItem,
  backFromPauseSettings,
  movePauseMenuSelection,
  openPauseMenu,
  openPauseSettings,
  resumePauseMenu,
  selectPauseMenuItem,
  type GameplayPauseState,
} from './gameplayPause'

describe('gameplay pause menu domain', () => {
  it('declares the prototype pause menu item order', () => {
    expect(PAUSE_MENU_ITEMS).toEqual(['resume', 'restart-stage', 'settings', 'stage-select'])
  })

  it('opens pause from playing with Resume selected', () => {
    expect(openPauseMenu({ mode: 'playing' })).toEqual({ mode: 'paused', selectedItemIndex: 0 })
  })

  it('does not reopen pause when already paused or in pause settings', () => {
    const paused: GameplayPauseState = { mode: 'paused', selectedItemIndex: 2 }
    const settings: GameplayPauseState = { mode: 'settings', selectedItemIndex: 3 }

    expect(openPauseMenu(paused)).toBe(paused)
    expect(openPauseMenu(settings)).toBe(settings)
  })

  it('resumes from paused or pause settings back to playing', () => {
    expect(resumePauseMenu({ mode: 'paused', selectedItemIndex: 0 })).toEqual({ mode: 'playing' })
    expect(resumePauseMenu({ mode: 'settings', selectedItemIndex: 2 })).toEqual({ mode: 'playing' })
  })

  it('wraps pause menu selection up and down', () => {
    expect(movePauseMenuSelection({ mode: 'paused', selectedItemIndex: 0 }, -1)).toEqual({
      mode: 'paused',
      selectedItemIndex: 3,
    })
    expect(movePauseMenuSelection({ mode: 'paused', selectedItemIndex: 3 }, 1)).toEqual({
      mode: 'paused',
      selectedItemIndex: 0,
    })
  })

  it('ignores movement outside the paused menu', () => {
    const state: GameplayPauseState = { mode: 'playing' }

    expect(movePauseMenuSelection(state, 1)).toBe(state)
  })

  it('bounds direct pause menu selection to valid items', () => {
    expect(selectPauseMenuItem({ mode: 'paused', selectedItemIndex: 0 }, 2)).toEqual({
      mode: 'paused',
      selectedItemIndex: 2,
    })
    expect(selectPauseMenuItem({ mode: 'paused', selectedItemIndex: 0 }, -1)).toEqual({
      mode: 'paused',
      selectedItemIndex: 0,
    })
    expect(selectPauseMenuItem({ mode: 'paused', selectedItemIndex: 0 }, 4)).toEqual({
      mode: 'paused',
      selectedItemIndex: 0,
    })
  })

  it('activates pause menu items into pure actions', () => {
    expect(activatePauseMenuItem({ mode: 'paused', selectedItemIndex: 0 })).toEqual({
      state: { mode: 'playing' },
      action: 'resume',
    })
    expect(activatePauseMenuItem({ mode: 'paused', selectedItemIndex: 1 })).toEqual({
      state: { mode: 'playing' },
      action: 'restart-stage',
    })
    expect(activatePauseMenuItem({ mode: 'paused', selectedItemIndex: 2 })).toEqual({
      state: { mode: 'settings', selectedItemIndex: 2 },
      action: 'open-settings',
    })
    expect(activatePauseMenuItem({ mode: 'paused', selectedItemIndex: 3 })).toEqual({
      state: { mode: 'playing' },
      action: 'stage-select',
    })
  })

  it('returns from pause-origin settings with Settings selected', () => {
    expect(backFromPauseSettings({ mode: 'settings', selectedItemIndex: 1 })).toEqual({
      mode: 'paused',
      selectedItemIndex: 2,
    })
  })

  it('opens pause settings from the paused menu preserving Settings selection', () => {
    expect(openPauseSettings({ mode: 'paused', selectedItemIndex: 0 })).toEqual({
      mode: 'settings',
      selectedItemIndex: 2,
    })
  })
})
```

- [ ] **Step 2: Run domain pause tests and confirm RED**

Run: `npm run test -- src/domain/gameplay/gameplayPause.test.ts`

Expected: FAIL because `./gameplayPause` does not exist.

- [ ] **Step 3: Implement pure pause domain**

Create `src/domain/gameplay/gameplayPause.ts`:

```ts
export const PAUSE_MENU_ITEMS = ['resume', 'restart-stage', 'settings', 'stage-select'] as const

export type PauseMenuItem = (typeof PAUSE_MENU_ITEMS)[number]

export type GameplayPauseState =
  | { mode: 'playing' }
  | { mode: 'paused'; selectedItemIndex: number }
  | { mode: 'settings'; selectedItemIndex: number }

export type PauseAction = 'resume' | 'restart-stage' | 'open-settings' | 'stage-select'

export type PauseActivation = {
  state: GameplayPauseState
  action: PauseAction | null
}

const SETTINGS_ITEM_INDEX = 2

function wrapIndex(index: number): number {
  return (index + PAUSE_MENU_ITEMS.length) % PAUSE_MENU_ITEMS.length
}

export function openPauseMenu(state: GameplayPauseState): GameplayPauseState {
  if (state.mode !== 'playing') return state

  return { mode: 'paused', selectedItemIndex: 0 }
}

export function resumePauseMenu(_state: GameplayPauseState): GameplayPauseState {
  return { mode: 'playing' }
}

export function movePauseMenuSelection(
  state: GameplayPauseState,
  direction: -1 | 1,
): GameplayPauseState {
  if (state.mode !== 'paused') return state

  return {
    mode: 'paused',
    selectedItemIndex: wrapIndex(state.selectedItemIndex + direction),
  }
}

export function selectPauseMenuItem(
  state: GameplayPauseState,
  selectedItemIndex: number,
): GameplayPauseState {
  if (state.mode !== 'paused') return state
  if (selectedItemIndex < 0 || selectedItemIndex >= PAUSE_MENU_ITEMS.length) return state

  return { mode: 'paused', selectedItemIndex }
}

export function openPauseSettings(state: GameplayPauseState): GameplayPauseState {
  if (state.mode !== 'paused') return state

  return { mode: 'settings', selectedItemIndex: SETTINGS_ITEM_INDEX }
}

export function backFromPauseSettings(state: GameplayPauseState): GameplayPauseState {
  if (state.mode !== 'settings') return state

  return { mode: 'paused', selectedItemIndex: SETTINGS_ITEM_INDEX }
}

export function activatePauseMenuItem(state: GameplayPauseState): PauseActivation {
  if (state.mode !== 'paused') return { state, action: null }

  const item = PAUSE_MENU_ITEMS[state.selectedItemIndex]
  if (item === 'resume') return { state: resumePauseMenu(state), action: 'resume' }
  if (item === 'restart-stage') return { state: resumePauseMenu(state), action: 'restart-stage' }
  if (item === 'settings') return { state: openPauseSettings(state), action: 'open-settings' }
  if (item === 'stage-select') return { state: resumePauseMenu(state), action: 'stage-select' }

  return { state, action: null }
}
```

- [ ] **Step 4: Run domain pause tests and confirm GREEN**

Run: `npm run test -- src/domain/gameplay/gameplayPause.test.ts`

Expected: PASS.

- [ ] **Step 5: Write failing input mapping tests**

Modify `src/domain/input/controlIntents.test.ts` by adding these tests near existing keyboard context tests:

```ts
  it('maps active gameplay pause keys without taking over gameplay movement keys', () => {
    expect(mapKeyboardControlIntent({ key: 'Escape', repeat: false }, 'gameplay-active')).toBe('back')
    expect(mapKeyboardControlIntent({ key: 'p', repeat: false }, 'gameplay-active')).toBe('back')
    expect(mapKeyboardControlIntent({ key: 'ArrowUp', repeat: false }, 'gameplay-active')).toBeNull()
    expect(mapKeyboardControlIntent({ key: ' ', repeat: false }, 'gameplay-active')).toBeNull()
  })

  it('maps pause menu keys to vertical navigation, confirm, and resume back', () => {
    expect(mapKeyboardControlIntent({ key: 'ArrowUp', repeat: false }, 'gameplay-pause-menu')).toBe('move-up')
    expect(mapKeyboardControlIntent({ key: 'w', repeat: false }, 'gameplay-pause-menu')).toBe('move-up')
    expect(mapKeyboardControlIntent({ key: 'ArrowDown', repeat: false }, 'gameplay-pause-menu')).toBe('move-down')
    expect(mapKeyboardControlIntent({ key: 's', repeat: false }, 'gameplay-pause-menu')).toBe('move-down')
    expect(mapKeyboardControlIntent({ key: 'Enter', repeat: false }, 'gameplay-pause-menu')).toBe('confirm')
    expect(mapKeyboardControlIntent({ key: ' ', repeat: false }, 'gameplay-pause-menu')).toBe('confirm')
    expect(mapKeyboardControlIntent({ key: 'Escape', repeat: false }, 'gameplay-pause-menu')).toBe('back')
  })
```

Add this gamepad assertion near existing gamepad button tests:

```ts
    expect(
      mapGamepadControlIntents(
        { mapping: 'standard', buttons: [false, false], axes: [] },
        { mapping: 'standard', buttons: [false, true], axes: [] },
        'gameplay-active',
      ),
    ).toEqual(['back'])
```

- [ ] **Step 6: Run input tests and confirm RED**

Run: `npm run test -- src/domain/input/controlIntents.test.ts`

Expected: FAIL because `gameplay-active` and `gameplay-pause-menu` are not accepted contexts or do not map as expected.

- [ ] **Step 7: Implement input contexts**

Modify `src/domain/input/controlIntents.ts`:

```ts
export type ControlContext =
  | 'title-intro'
  | 'title-menu'
  | 'world-select'
  | 'stage-select'
  | 'settings'
  | 'settings-delete-confirm'
  | 'gameplay-active'
  | 'gameplay-pause-menu'
```

Inside `mapKeyboardControlIntent`, after `const key = descriptor.key.toLowerCase()`:

```ts
  if (context === 'gameplay-active') {
    if (descriptor.key === 'Escape' || key === 'p') return 'back'
    return null
  }

  if (context === 'gameplay-pause-menu') {
    if (descriptor.key === 'ArrowUp' || key === 'w') return 'move-up'
    if (descriptor.key === 'ArrowDown' || key === 's') return 'move-down'
    if (descriptor.key === 'Enter' || descriptor.key === ' ') return 'confirm'
    if (descriptor.key === 'Escape') return 'back'
    return null
  }
```

No special gamepad branch is needed if east already emits `back`, south emits `confirm`, and vertical movement emits `move-up`/`move-down`. Keep the gamepad implementation unchanged unless tests show a real gap.

- [ ] **Step 8: Run input tests and confirm GREEN**

Run: `npm run test -- src/domain/input/controlIntents.test.ts`

Expected: PASS.

- [ ] **Step 9: Write failing localization tests**

Modify `src/domain/data/localize/localize.test.ts` in the expected-by-locale fixture to include pause values for all locales, then add assertions near other common/settings assertions:

```ts
      expect(resolveLocalizedText(localize, locale, 'pause.paused')).toBe(expectedByLocale[locale].pausePaused)
      expect(resolveLocalizedText(localize, locale, 'pause.resume')).toBe(expectedByLocale[locale].pauseResume)
      expect(resolveLocalizedText(localize, locale, 'pause.restart')).toBe(expectedByLocale[locale].pauseRestart)
      expect(resolveLocalizedText(localize, locale, 'pause.stageSelect')).toBe(expectedByLocale[locale].pauseStageSelect)
      expect(resolveLocalizedText(localize, locale, 'pause.aria.menu')).toBe(expectedByLocale[locale].pauseAriaMenu)
```

Use these expected values:

```ts
pausePaused: 'Paused',
pauseResume: 'Resume',
pauseRestart: 'Restart Stage',
pauseStageSelect: 'Return to Stage Select',
pauseAriaMenu: 'Pause menu',
```

```ts
pausePaused: 'ポーズ',
pauseResume: '再開',
pauseRestart: 'ステージ再開',
pauseStageSelect: 'ステージ選択へ',
pauseAriaMenu: 'ポーズメニュー',
```

```ts
pausePaused: '暫停',
pauseResume: '繼續',
pauseRestart: '重新開始關卡',
pauseStageSelect: '返回選關畫面',
pauseAriaMenu: '暫停選單',
```

```ts
pausePaused: '일시 정지',
pauseResume: '계속',
pauseRestart: '스테이지 재시작',
pauseStageSelect: '스테이지 선택으로',
pauseAriaMenu: '일시 정지 메뉴',
```

- [ ] **Step 10: Run localization tests and confirm RED**

Run: `npm run test -- src/domain/data/localize/localize.test.ts`

Expected: FAIL because pause localization keys do not exist.

- [ ] **Step 11: Implement localization keys and values**

Modify `src/domain/data/localize/localize.ts`:

Add to `LocalizationKey`:

```ts
  | 'pause.paused'
  | 'pause.resume'
  | 'pause.restart'
  | 'pause.stageSelect'
  | 'pause.aria.menu'
```

Add the same values from Step 9 to the English, Japanese, Traditional Chinese, and Korean catalogs.

- [ ] **Step 12: Run focused checks for Task 1**

Run:

```bash
npm run test -- src/domain/gameplay/gameplayPause.test.ts src/domain/input/controlIntents.test.ts src/domain/data/localize/localize.test.ts
```

Expected: PASS.

- [ ] **Step 13: Commit Task 1**

```bash
git add src/domain/gameplay/gameplayPause.ts src/domain/gameplay/gameplayPause.test.ts src/domain/input/controlIntents.ts src/domain/input/controlIntents.test.ts src/domain/data/localize/localize.ts src/domain/data/localize/localize.test.ts
git commit -m "feat: add gameplay pause domain"
```

---

### Task 2: Reusable Settings Control Helper

**Files:**
- Create: `src/application/input/settingsControls.test.ts`
- Create: `src/application/input/settingsControls.ts`
- Modify: `src/application/input/appControls.ts`
- Modify: `src/application/input/appControls.test.ts`

- [ ] **Step 1: Write failing reusable settings-control tests**

Create `src/application/input/settingsControls.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { SettingsScreen } from '../../domain/app/appFlow'
import type { GameSettings } from '../../domain/settings/settings'
import { applySettingsControlIntent } from './settingsControls'

const settings: GameSettings = {
  locale: 'en',
  bgmVolume: 6,
  sfxVolume: 7,
  fullscreen: false,
}

const screen: SettingsScreen = {
  type: 'settings',
  selectedItemIndex: 0,
  deleteConfirm: null,
}

describe('settings control helper', () => {
  it('moves settings selection without routing away from the current owner', () => {
    expect(applySettingsControlIntent({ screen, settings }, 'move-down', ['en', 'ja', 'zh-Hant', 'ko'])).toMatchObject({
      screen: { type: 'settings', selectedItemIndex: 1, deleteConfirm: null },
      exitRequested: false,
    })
  })

  it('adjusts settings and reports fullscreen changes', () => {
    const fullscreenScreen: SettingsScreen = { type: 'settings', selectedItemIndex: 3, deleteConfirm: null }

    const result = applySettingsControlIntent(
      { screen: fullscreenScreen, settings },
      'adjust-right',
      ['en', 'ja', 'zh-Hant', 'ko'],
    )

    expect(result.settings.fullscreen).toBe(true)
    expect(result.fullscreenChanged).toBe(true)
    expect(result.exitRequested).toBe(false)
  })

  it('opens, moves, confirms, and cancels delete confirmation locally', () => {
    const deleteScreen: SettingsScreen = { type: 'settings', selectedItemIndex: 4, deleteConfirm: null }
    const opened = applySettingsControlIntent({ screen: deleteScreen, settings }, 'confirm', ['en', 'ja', 'zh-Hant', 'ko'])

    expect(opened.screen.deleteConfirm).toEqual({ selectedItemIndex: 1 })
    expect(applySettingsControlIntent(opened, 'move-left', ['en', 'ja', 'zh-Hant', 'ko']).screen.deleteConfirm).toEqual({
      selectedItemIndex: 0,
    })
    expect(applySettingsControlIntent(opened, 'back', ['en', 'ja', 'zh-Hant', 'ko']).screen.deleteConfirm).toBeNull()
  })

  it('requests owner exit on back when no delete confirmation is open', () => {
    expect(applySettingsControlIntent({ screen, settings }, 'back', ['en', 'ja', 'zh-Hant', 'ko'])).toMatchObject({
      screen,
      settings,
      exitRequested: true,
      fullscreenChanged: false,
    })
  })
})
```

- [ ] **Step 2: Run settings helper tests and confirm RED**

Run: `npm run test -- src/application/input/settingsControls.test.ts`

Expected: FAIL because `settingsControls.ts` does not exist.

- [ ] **Step 3: Implement reusable settings-control helper**

Create `src/application/input/settingsControls.ts` with this API:

```ts
export type SettingsControlState = {
  screen: SettingsScreen
  settings: GameSettings
}

export type SettingsControlResult = SettingsControlState & {
  exitRequested: boolean
  fullscreenChanged: boolean
  deleteConfirmed: boolean
}

export function applySettingsControlIntent(
  state: SettingsControlState,
  intent: ControlIntent,
  localeCodes: readonly LocaleCode[],
): SettingsControlResult
```

Implementation rules:

- Import and reuse existing pure settings/domain functions: `adjustSettingsRow`, `moveSettingsDeleteConfirmSelection`, `moveSettingsScreenSelection`, `openSettingsDeleteConfirm`, and `resetSettings`.
- Return `exitRequested: true` for `back` only when no delete-confirm dialog is open.
- Return `deleteConfirmed: true` only when delete-confirm is open, the selected confirm item is the destructive confirm item, and `confirm` is received.
- Return `fullscreenChanged: true` only when an adjustment or reset changes `settings.fullscreen`.
- Do not call Svelte, DOM, storage, fullscreen, audio, or app-route side effects.

- [ ] **Step 4: Run helper tests and confirm GREEN**

Run: `npm run test -- src/application/input/settingsControls.test.ts`

Expected: PASS.

- [ ] **Step 5: Route title-origin Settings through the same helper**

Modify `src/application/input/appControls.ts` so its `screen.type === 'settings'` branch calls `applySettingsControlIntent`. Convert helper results into the existing routed behavior:

- `exitRequested: true` returns to the existing title/menu destination used by current Settings back behavior.
- `fullscreenChanged` is surfaced through the same settings change path that existing `appControls` tests assert.
- `deleteConfirmed: true` keeps the current delete-save command behavior.

Run: `npm run test -- src/application/input/appControls.test.ts src/application/input/settingsControls.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit Task 2**

```bash
git add src/application/input/settingsControls.ts src/application/input/settingsControls.test.ts src/application/input/appControls.ts src/application/input/appControls.test.ts
git commit -m "feat: add reusable settings controls"
```

---

### Task 3: Renderer Pause Controller Boundary

**Files:**
- Modify: `src/ui/gameplay/createGameplayRenderer.test.ts`
- Modify: `src/ui/gameplay/createGameplayRenderer.ts`

- [ ] **Step 1: Write failing renderer source contract tests**

Modify `src/ui/gameplay/createGameplayRenderer.test.ts` by adding a test against the raw source:

```ts
import rendererSource from './createGameplayRenderer.ts?raw'

describe('gameplay renderer pause controller contract', () => {
  it('exposes explicit pause, resume, reset timing, and destroy controls', () => {
    expect(rendererSource).toContain('export type GameplayRendererController')
    expect(rendererSource).toContain('pause: () => void')
    expect(rendererSource).toContain('resume: () => void')
    expect(rendererSource).toContain('resetTiming: () => void')
    expect(rendererSource).toContain('destroy: () => void')
    expect(rendererSource).toContain("game.scene.pause(sceneKey)")
    expect(rendererSource).toContain("game.scene.resume(sceneKey)")
    expect(rendererSource).toContain('game.loop.resetDelta()')
    expect(rendererSource).not.toContain('pause.resume')
    expect(rendererSource).not.toContain('pause.stageSelect')
  })
})
```

If `createGameplayRenderer.test.ts` already imports raw source with a different variable name, reuse the existing import instead of adding a duplicate.

- [ ] **Step 2: Run renderer tests and confirm RED**

Run: `npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts`

Expected: FAIL because the controller type and methods are missing.

- [ ] **Step 3: Implement renderer controller**

Modify `src/ui/gameplay/createGameplayRenderer.ts`:

```ts
export type GameplayRendererController = {
  game: Phaser.Game
  pause: () => void
  resume: () => void
  resetTiming: () => void
  destroy: () => void
}
```

Replace the existing `createGameplayRenderer` return implementation with:

```ts
export function createGameplayRenderer(input: GameplayRendererInput): GameplayRendererController {
  const sceneKey = `GameplayMapScene:${input.stage.id}`
  const game = new Phaser.Game(createGameplayRendererConfig(input))

  return {
    game,
    pause: () => {
      game.scene.pause(sceneKey)
    },
    resume: () => {
      game.scene.resume(sceneKey)
    },
    resetTiming: () => {
      game.loop.resetDelta()
    },
    destroy: () => {
      game.destroy(true)
    },
  }
}
```

Keep the scene key construction aligned with `GameplayMapScene` constructor.

- [ ] **Step 4: Update existing call sites for `destroy`**

Modify `src/ui/gameplay/GameplayScreen.svelte` cleanup from:

```ts
      game.destroy(true)
```

to:

```ts
      game.destroy()
```

Do not add pause UI logic in this task.

- [ ] **Step 5: Run renderer tests and confirm GREEN**

Run: `npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit Task 3**

```bash
git add src/ui/gameplay/createGameplayRenderer.ts src/ui/gameplay/createGameplayRenderer.test.ts src/ui/gameplay/GameplayScreen.svelte
git commit -m "feat: expose gameplay renderer pause controls"
```

---

### Task 4: Reusable Settings Panel For Pause-Origin Settings

**Files:**
- Create: `src/ui/settings/settingsPanelUi.test.ts`
- Create: `src/ui/settings/SettingsPanel.svelte`
- Modify: `src/ui/settings/SettingsScreen.svelte`

- [ ] **Step 1: Write failing settings panel source tests**

Create `src/ui/settings/settingsPanelUi.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import settingsPanelSource from './SettingsPanel.svelte?raw'
import settingsScreenSource from './SettingsScreen.svelte?raw'

describe('SettingsPanel UI contract', () => {
  it('centralizes settings rows for title and pause overlays', () => {
    expect(settingsPanelSource).toContain('type Props = {')
    expect(settingsPanelSource).toContain('screen: SettingsScreen')
    expect(settingsPanelSource).toContain('settings: GameSettings')
    expect(settingsPanelSource).toContain('SETTINGS_ROWS')
    expect(settingsPanelSource).toContain('class="settings-panel"')
    expect(settingsPanelSource).toContain('<ControlHints')
  })

  it('keeps SettingsScreen as a routed shell around SettingsPanel', () => {
    expect(settingsScreenSource).toContain("import SettingsPanel from './SettingsPanel.svelte'")
    expect(settingsScreenSource).toContain('<SettingsPanel')
    expect(settingsScreenSource).toContain('class="settings-screen"')
    expect(settingsScreenSource).not.toContain('{#each SETTINGS_ROWS as item, index}')
  })
})
```

- [ ] **Step 2: Run settings panel tests and confirm RED**

Run: `npm run test -- src/ui/settings/settingsPanelUi.test.ts`

Expected: FAIL because `SettingsPanel.svelte` does not exist.

- [ ] **Step 3: Extract `SettingsPanel.svelte`**

Create `src/ui/settings/SettingsPanel.svelte` by moving the existing panel markup and helper logic from `SettingsScreen.svelte`.

Use this public prop shape:

```ts
  import type { SettingsScreen } from '../../domain/app/appFlow'
  import type { LocalizationKey, LocaleCode, LocalizeData } from '../../domain/data/localize/localize'
  import { resolveLocalizedText } from '../../domain/data/localize/localize'
  import { SETTINGS_ROWS, type GameSettings } from '../../domain/settings/settings'
  import ControlHints from '../controls/ControlHints.svelte'

  type Props = {
    screen: SettingsScreen
    settings: GameSettings
    localizeData: LocalizeData
    locale: LocaleCode
    onSelectItem: (index: number) => void
    onAdjustItem: (index: number, direction: -1 | 1) => void
    onActivateItem: (index: number) => void
    onCancelDelete: () => void
    onConfirmDelete: () => void
    onBackLabel?: LocalizationKey
  }
```

Inside the component, keep `text`, `rowLabelRefs`, `settingValue`, `meterValue`, the `.settings-panel` markup, and the delete confirmation markup. For `ControlHints`, use:

```svelte
    <ControlHints
      className="settings-controls"
      hints={[
        { keys: ['↑', '↓'], label: text('common.select') },
        { keys: ['←', '→'], label: text('common.adjust') },
        { keys: ['Esc'], label: text(onBackLabel) },
      ]}
    />
```

Set `onBackLabel = 'common.back'` by default in props destructuring.

Move all CSS selectors used by the panel markup into `SettingsPanel.svelte`, including `.settings-panel`, settings rows, meters, footer control hints, and delete-confirm dialog selectors. Keep only the full-screen `.settings-screen`, background image, and backdrop shell CSS in `SettingsScreen.svelte`.

- [ ] **Step 4: Replace SettingsScreen panel markup**

Modify `src/ui/settings/SettingsScreen.svelte`:

1. Keep keyboard/gamepad input handling, props, shell `<section>`, background image, and backdrop.
2. Import `SettingsPanel`.
3. Replace panel/delete dialog markup with:

```svelte
  <SettingsPanel
    {screen}
    {settings}
    {localizeData}
    {locale}
    {onSelectItem}
    {onAdjustItem}
    {onActivateItem}
    {onCancelDelete}
    {onConfirmDelete}
  />
```

- [ ] **Step 5: Run settings panel tests and check existing settings behavior**

Run:

```bash
npm run test -- src/ui/settings/settingsPanelUi.test.ts src/domain/settings/settings.test.ts src/application/input/appControls.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run Svelte check for extraction**

Run: `npm run check`

Expected: PASS.

- [ ] **Step 7: Commit Task 4**

```bash
git add src/ui/settings/SettingsPanel.svelte src/ui/settings/SettingsScreen.svelte src/ui/settings/settingsPanelUi.test.ts
git commit -m "refactor: extract reusable settings panel"
```

---

### Task 5: Pause Menu Presentational Component

**Files:**
- Create: `src/ui/gameplay/pauseMenuUi.test.ts`
- Create: `src/ui/gameplay/PauseMenu.svelte`
- Modify: `src/ui/controls/controlHints.test.ts`

- [ ] **Step 1: Write failing PauseMenu UI source tests**

Create `src/ui/gameplay/pauseMenuUi.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import pauseMenuSource from './PauseMenu.svelte?raw'

describe('PauseMenu UI contract', () => {
  it('renders the prototype-equivalent pause menu structure', () => {
    expect(pauseMenuSource).toContain('class="pause-overlay"')
    expect(pauseMenuSource).toContain('class="pause-menu"')
    expect(pauseMenuSource).toContain('class="pause-kicker"')
    expect(pauseMenuSource).toContain('class="pause-rule"')
    expect(pauseMenuSource).toContain('aria-label={text(\\'pause.aria.menu\\')}')
    expect(pauseMenuSource).toContain('PAUSE_MENU_ITEMS')
  })

  it('uses localized pause labels instead of inline menu copy', () => {
    expect(pauseMenuSource).toContain("'resume': 'pause.resume'")
    expect(pauseMenuSource).toContain("'restart-stage': 'pause.restart'")
    expect(pauseMenuSource).toContain("'settings': 'settings.title'")
    expect(pauseMenuSource).toContain("'stage-select': 'pause.stageSelect'")
    expect(pauseMenuSource).not.toContain('Restart Stage</b>')
    expect(pauseMenuSource).not.toContain('Return to Stage Select</b>')
  })

  it('renders indexed active rows and shared control hints', () => {
    expect(pauseMenuSource).toContain('class:active={selectedItemIndex === index}')
    expect(pauseMenuSource).toContain("String(index + 1).padStart(2, '0')")
    expect(pauseMenuSource).toContain('<ControlHints')
    expect(pauseMenuSource).not.toContain('<kbd>')
  })

  it('uses prototype-equivalent frame-relative overlay styling and animation', () => {
    expect(pauseMenuSource).toContain('container-type: size')
    expect(pauseMenuSource).toContain('width: min(31cqw, 520px)')
    expect(pauseMenuSource).toContain('backdrop-filter: blur(4px) saturate(78%)')
    expect(pauseMenuSource).toContain('animation: pause-menu-in 260ms')
    expect(pauseMenuSource).toContain('animation: pause-item-in 220ms')
    expect(pauseMenuSource).toContain('@keyframes pause-backdrop-in')
    expect(pauseMenuSource).toContain('@keyframes pause-menu-in')
    expect(pauseMenuSource).toContain('@keyframes pause-item-in')
  })
})
```

If a quote escaping issue appears, use double-quoted strings around the `toContain` arguments.

- [ ] **Step 2: Add PauseMenu to shared control hints contract**

Modify `src/ui/controls/controlHints.test.ts`:

```ts
import pauseMenuSource from '../gameplay/PauseMenu.svelte?raw'
```

Add `['PauseMenu', pauseMenuSource]` to `screenSources`.

- [ ] **Step 3: Run UI tests and confirm RED**

Run:

```bash
npm run test -- src/ui/gameplay/pauseMenuUi.test.ts src/ui/controls/controlHints.test.ts
```

Expected: FAIL because `PauseMenu.svelte` does not exist.

- [ ] **Step 4: Implement PauseMenu.svelte**

Create `src/ui/gameplay/PauseMenu.svelte`:

```svelte
<script lang="ts">
  import { PAUSE_MENU_ITEMS, type PauseAction, type PauseMenuItem } from '../../domain/gameplay/gameplayPause'
  import type { LocalizationKey, LocaleCode, LocalizeData } from '../../domain/data/localize/localize'
  import { resolveLocalizedText } from '../../domain/data/localize/localize'
  import ControlHints from '../controls/ControlHints.svelte'

  type Props = {
    selectedItemIndex: number
    localizeData: LocalizeData
    locale: LocaleCode
    onSelectItem: (index: number) => void
    onAction: (action: PauseAction) => void
  }

  let { selectedItemIndex, localizeData, locale, onSelectItem, onAction }: Props = $props()

  const pauseLabelRefs: Record<PauseMenuItem, LocalizationKey> = {
    resume: 'pause.resume',
    'restart-stage': 'pause.restart',
    settings: 'settings.title',
    'stage-select': 'pause.stageSelect',
  }

  const pauseActionByItem: Record<PauseMenuItem, PauseAction> = {
    resume: 'resume',
    'restart-stage': 'restart-stage',
    settings: 'open-settings',
    'stage-select': 'stage-select',
  }

  function text(key: LocalizationKey): string {
    return resolveLocalizedText(localizeData, locale, key)
  }

  function handleClick(item: PauseMenuItem, index: number): void {
    onSelectItem(index)
    onAction(pauseActionByItem[item])
  }
</script>

<div class="pause-overlay" role="presentation">
  <div class="pause-menu">
    <span class="pause-kicker">{text('settings.systemMenu')}</span>
    <strong>{text('pause.paused')}</strong>
    <div class="pause-rule"></div>

    <nav aria-label={text('pause.aria.menu')}>
      {#each PAUSE_MENU_ITEMS as item, index}
        <button
          class:active={selectedItemIndex === index}
          type="button"
          onclick={() => handleClick(item, index)}
          onmouseenter={() => onSelectItem(index)}
        >
          <span>{String(index + 1).padStart(2, '0')}</span>
          <b>{text(pauseLabelRefs[item])}</b>
        </button>
      {/each}
    </nav>

    <ControlHints
      className="pause-controls"
      hints={[
        { keys: ['↑', '↓'], label: text('common.select') },
        { keys: ['Enter'], label: text('common.confirm') },
        { keys: ['Esc'], label: text('pause.resume') },
      ]}
    />
  </div>
</div>

<style>
  .pause-overlay {
    position: absolute;
    inset: 0;
    z-index: 22;
    display: grid;
    place-items: center;
    container-type: size;
    background:
      linear-gradient(90deg, rgba(7, 22, 48, 0.2), rgba(7, 22, 48, 0.62), rgba(7, 22, 48, 0.2)),
      rgba(12, 42, 82, 0.2);
    pointer-events: auto;
    backdrop-filter: blur(4px) saturate(78%);
    animation: pause-backdrop-in 220ms ease-out both;
  }

  .pause-menu {
    --accent: #2f6fd0;
    --accent-pale: color-mix(in oklab, var(--accent) 16%, #ffffff);
    --glow: color-mix(in oklab, var(--accent) 40%, #ffffff);
    --hud-ink: color-mix(in oklab, var(--accent) 64%, #08152e);
    --hud-soft: color-mix(in oklab, var(--accent) 50%, #38507a);
    --hud-line: color-mix(in srgb, var(--accent) 55%, transparent);
    --hud-line-soft: color-mix(in srgb, var(--accent) 30%, transparent);
    --hud-panel: color-mix(in srgb, color-mix(in srgb, var(--accent) 13%, #ffffff) 72%, transparent);
    position: relative;
    width: min(31cqw, 520px);
    padding: 2.4cqh 1.5cqw 1.6cqh;
    border: 1.5px solid var(--hud-line);
    border-radius: 8px;
    background: color-mix(in srgb, var(--hud-panel) 92%, white);
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.9) inset,
      0 0 0 4px rgba(255, 255, 255, 0.22),
      0 28px 70px rgba(6, 27, 62, 0.48);
    color: var(--hud-ink);
    text-align: center;
    animation: pause-menu-in 260ms cubic-bezier(0.2, 0.9, 0.25, 1.15) both;
  }

  .pause-menu::after {
    content: "";
    position: absolute;
    inset: 6px;
    border: 1px solid var(--hud-line-soft);
    border-radius: 4px;
    pointer-events: none;
  }

  .pause-kicker {
    display: block;
    color: var(--hud-soft);
    font-size: min(0.68cqw, 13px);
    font-weight: 700;
    letter-spacing: 0.24em;
    text-transform: uppercase;
  }

  .pause-menu > strong {
    display: block;
    margin-top: 0.4cqh;
    color: var(--hud-ink);
    font-size: min(3cqw, 58px);
    letter-spacing: 0.12em;
    line-height: 1;
    text-transform: uppercase;
  }

  .pause-rule {
    height: 1px;
    margin: 1.8cqh 0 1.25cqh;
    background: linear-gradient(90deg, transparent, var(--hud-line), transparent);
  }

  .pause-menu nav {
    display: grid;
    gap: 0.7cqh;
  }

  .pause-menu nav button {
    position: relative;
    display: grid;
    min-height: 5.1cqh;
    grid-template-columns: 2.4cqw 1fr auto;
    gap: 0.65cqw;
    align-items: center;
    padding: 0.55cqh 0.8cqw;
    overflow: hidden;
    border: 1px solid transparent;
    border-radius: 5px;
    background: rgba(255, 255, 255, 0.38);
    color: var(--hud-ink);
    cursor: pointer;
    text-align: left;
    animation: pause-item-in 220ms ease-out both;
  }

  .pause-menu nav button:nth-child(1) { animation-delay: 80ms; }
  .pause-menu nav button:nth-child(2) { animation-delay: 115ms; }
  .pause-menu nav button:nth-child(3) { animation-delay: 150ms; }
  .pause-menu nav button:nth-child(4) { animation-delay: 185ms; }

  .pause-menu nav button::before {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: 4px;
    background: transparent;
  }

  .pause-menu nav button.active {
    border-color: var(--hud-line);
    background: linear-gradient(90deg, rgba(110, 195, 255, 0.34), rgba(255, 255, 255, 0.7));
    box-shadow: 0 0 14px rgba(47, 111, 208, 0.14);
  }

  .pause-menu nav button.active::before {
    background: var(--accent);
    box-shadow: 0 0 8px var(--glow);
  }

  .pause-menu nav button span {
    color: var(--hud-soft);
    font-family: Rajdhani, sans-serif;
    font-size: min(0.73cqw, 14px);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .pause-menu nav button b {
    font-size: min(1.15cqw, 22px);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .pause-controls {
    margin-top: 1.6cqh;
  }

  @keyframes pause-backdrop-in {
    from { opacity: 0; backdrop-filter: blur(0) saturate(100%); }
    to { opacity: 1; backdrop-filter: blur(4px) saturate(78%); }
  }

  @keyframes pause-menu-in {
    from { opacity: 0; scale: 0.92; translate: 0 10px; }
    to { opacity: 1; scale: 1; translate: 0 0; }
  }

  @keyframes pause-item-in {
    from { opacity: 0; translate: 0 8px; }
    to { opacity: 1; translate: 0 0; }
  }
</style>
```

- [ ] **Step 5: Verify pause ARIA localization key**

Confirm `pause.aria.menu` was added by Task 1 and is used by `PauseMenu.svelte` through `text('pause.aria.menu')`.

- [ ] **Step 6: Run UI and localization tests**

Run:

```bash
npm run test -- src/ui/gameplay/pauseMenuUi.test.ts src/ui/controls/controlHints.test.ts src/domain/data/localize/localize.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit Task 5**

```bash
git add src/ui/gameplay/PauseMenu.svelte src/ui/gameplay/pauseMenuUi.test.ts src/ui/controls/controlHints.test.ts src/domain/data/localize/localize.ts src/domain/data/localize/localize.test.ts
git commit -m "feat: add gameplay pause menu UI"
```

---

### Task 6: GameplayScreen Pause Integration

**Files:**
- Create: `src/ui/gameplay/gameplayScreenPause.test.ts`
- Modify: `src/ui/gameplay/GameplayScreen.svelte`
- Modify: `src/App.svelte`

- [ ] **Step 1: Write failing GameplayScreen pause source tests**

Create `src/ui/gameplay/gameplayScreenPause.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import gameplayScreenSource from './GameplayScreen.svelte?raw'

describe('GameplayScreen pause integration contract', () => {
  it('owns gameplay pause state and renders PauseMenu before result-only handling', () => {
    expect(gameplayScreenSource).toContain('GameplayPauseState')
    expect(gameplayScreenSource).toContain("let pauseState = $state<GameplayPauseState>({ mode: 'playing' })")
    expect(gameplayScreenSource).toContain('<PauseMenu')
    expect(gameplayScreenSource).toContain('{#if pauseState.mode === \\'paused\\' && !hudState?.result}')
  })

  it('gives Stage Result input precedence over Pause Menu input', () => {
    expect(gameplayScreenSource.indexOf('if (hudState?.result)')).toBeLessThan(
      gameplayScreenSource.indexOf("const context = pauseState.mode === 'paused'"),
    )
  })

  it('uses gameplay-specific control contexts', () => {
    expect(gameplayScreenSource).toContain("'gameplay-active'")
    expect(gameplayScreenSource).toContain("'gameplay-pause-menu'")
  })

  it('coordinates renderer pause resume and timing reset through explicit controller methods', () => {
    expect(gameplayScreenSource).toContain('renderer.pause()')
    expect(gameplayScreenSource).toContain('renderer.resume()')
    expect(gameplayScreenSource).toContain('renderer.resetTiming()')
    expect(gameplayScreenSource).toContain('renderer.destroy()')
  })

  it('renders pause-origin settings over gameplay with a pause back label', () => {
    expect(gameplayScreenSource).toContain('<SettingsPanel')
    expect(gameplayScreenSource).toContain("onBackLabel=\"pause.resume\"")
    expect(gameplayScreenSource).toContain('backFromPauseSettings')
  })
})
```

- [ ] **Step 2: Run GameplayScreen pause tests and confirm RED**

Run: `npm run test -- src/ui/gameplay/gameplayScreenPause.test.ts`

Expected: FAIL because pause integration is missing.

- [ ] **Step 3: Extend GameplayScreen props**

Modify `src/ui/gameplay/GameplayScreen.svelte` props:

```ts
    settings: GameSettings
    localizeData: LocalizeData
    locale: LocaleCode
    localeCodes: readonly LocaleCode[]
    onSettingsChange: (settings: GameSettings, fullscreenChanged: boolean) => void
    onConfirmSettingsDelete: () => void
```

Import needed types:

```ts
  import type { SettingsScreen } from '../../domain/app/appFlow'
  import type { LocaleCode, LocalizeData } from '../../domain/data/localize/localize'
  import type { GameSettings } from '../../domain/settings/settings'
  import { applySettingsControlIntent } from '../../application/input/settingsControls'
```

Add `SettingsPanel`, `PauseMenu`, and pause domain imports:

```ts
  import {
    activatePauseMenuItem,
    backFromPauseSettings,
    movePauseMenuSelection,
    openPauseMenu,
    resumePauseMenu,
    selectPauseMenuItem,
    type GameplayPauseState,
    type PauseAction,
  } from '../../domain/gameplay/gameplayPause'
  import PauseMenu from './PauseMenu.svelte'
  import SettingsPanel from '../settings/SettingsPanel.svelte'
```

- [ ] **Step 4: Add reactive pause state and settings screen projection**

Inside `GameplayScreen.svelte`:

```ts
  let pauseState = $state<GameplayPauseState>({ mode: 'playing' })
  let renderer: ReturnType<typeof createGameplayRenderer> | null = null
  let pauseSettingsScreen = $state<SettingsScreen>({
    type: 'settings',
    selectedItemIndex: 0,
    deleteConfirm: null,
  })
```

- [ ] **Step 5: Add pause action helpers**

In `GameplayScreen.svelte`:

```ts
  function pauseGameplay(): void {
    if (hudState?.result || pauseState.mode !== 'playing' || !renderer) return
    pauseState = openPauseMenu(pauseState)
    renderer.pause()
  }

  function resumeGameplay(): void {
    if (!renderer) return
    pauseState = resumePauseMenu(pauseState)
    renderer.resume()
    renderer.resetTiming()
  }

  function handlePauseAction(action: PauseAction): void {
    if (action === 'resume') {
      resumeGameplay()
      return
    }

    if (action === 'restart-stage') {
      pauseState = { mode: 'playing' }
      onRetry()
      return
    }

    if (action === 'open-settings') {
      pauseState = { mode: 'settings', selectedItemIndex: 2 }
      pauseSettingsScreen = {
        type: 'settings',
        selectedItemIndex: 0,
        deleteConfirm: null,
      }
      return
    }

    if (action === 'stage-select') {
      pauseState = { mode: 'playing' }
      onStageSelect()
    }
  }

  function activateSelectedPauseItem(): void {
    const activation = activatePauseMenuItem(pauseState)
    pauseState = activation.state
    if (activation.action) handlePauseAction(activation.action)
  }
```

- [ ] **Step 6: Update keyboard handling with input precedence**

Replace `handleKeydown` with logic shaped as:

```ts
  function handleKeydown(event: KeyboardEvent): void {
    if (hudState?.result) {
      const intent = mapKeyboardControlIntent(
        { key: event.key, repeat: event.repeat },
        'stage-select',
      )

      if (!intent || !isStageResultControlIntent(intent)) return

      event.preventDefault()
      handleResultControlIntent(intent)
      return
    }

    if (pauseState.mode === 'settings') {
      const intent = mapKeyboardControlIntent(
        { key: event.key, repeat: event.repeat },
        'settings',
      )
      if (!intent) return
      event.preventDefault()
      handlePauseSettingsControlIntent(intent)
      return
    }

    const context = pauseState.mode === 'paused' ? 'gameplay-pause-menu' : 'gameplay-active'
    const intent = mapKeyboardControlIntent(
      { key: event.key, repeat: event.repeat },
      context,
    )
    if (!intent) return

    event.preventDefault()
    handlePauseControlIntent(intent)
  }
```

Add `handlePauseSettingsControlIntent` before `handlePauseControlIntent`:

```ts
  function handlePauseSettingsControlIntent(intent: ControlIntent): void {
    const result = applySettingsControlIntent(
      { screen: pauseSettingsScreen, settings },
      intent,
      localeCodes,
    )

    pauseSettingsScreen = result.screen
    if (result.settings !== settings) onSettingsChange(result.settings, result.fullscreenChanged)
    if (result.deleteConfirmed) onConfirmSettingsDelete()
    if (result.exitRequested) pauseState = backFromPauseSettings(pauseState)
  }
```

Add `handlePauseControlIntent`:

```ts
  function handlePauseControlIntent(intent: ControlIntent): void {
    if (pauseState.mode === 'playing') {
      if (intent === 'back') pauseGameplay()
      return
    }

    if (pauseState.mode !== 'paused') return

    if (intent === 'move-up') {
      pauseState = movePauseMenuSelection(pauseState, -1)
      return
    }
    if (intent === 'move-down') {
      pauseState = movePauseMenuSelection(pauseState, 1)
      return
    }
    if (intent === 'back') {
      resumeGameplay()
      return
    }
    if (intent === 'confirm') activateSelectedPauseItem()
  }
```

- [ ] **Step 7: Update gamepad polling**

In `pollGamepad`, preserve Stage Result precedence. Otherwise select context by pause state:

```ts
      const context = hudState?.result
        ? 'stage-select'
        : pauseState.mode === 'paused'
          ? 'gameplay-pause-menu'
          : pauseState.mode === 'settings'
            ? 'settings'
            : 'gameplay-active'
```

Route intents:

```ts
      for (const intent of intents) {
        if (hudState?.result) {
          handleResultControlIntent(intent)
        } else if (pauseState.mode === 'settings') {
          handlePauseSettingsControlIntent(intent)
        } else {
          handlePauseControlIntent(intent)
        }
      }
```

- [ ] **Step 8: Store and cleanup renderer controller**

In `onMount`, replace local `game` with `renderer`:

```ts
    renderer = createGameplayRenderer({
      parent: container,
      stage,
      onHudUpdate: (patch) => {
        hudState = applyGameplayHudPatch(hudState ?? createInitialGameplayHudState(stage), patch)
      },
    })
```

Cleanup:

```ts
      cancelAnimationFrame(frameId)
      renderer?.destroy()
      renderer = null
```

- [ ] **Step 9: Render PauseMenu and SettingsPanel**

After `GameplayHud` and before `StageResult`, render:

```svelte
    {#if pauseState.mode === 'paused' && !hudState?.result}
      <PauseMenu
        selectedItemIndex={pauseState.selectedItemIndex}
        {localizeData}
        {locale}
        onSelectItem={(index) => {
          pauseState = selectPauseMenuItem(pauseState, index)
        }}
        onAction={handlePauseAction}
      />
    {:else if pauseState.mode === 'settings' && !hudState?.result}
      <div class="pause-overlay settings-pause-overlay">
        <SettingsPanel
          screen={pauseSettingsScreen}
          {settings}
          {localizeData}
          {locale}
          onSelectItem={(index) => {
            pauseSettingsScreen = { ...pauseSettingsScreen, selectedItemIndex: index }
          }}
          onAdjustItem={(index, direction) => {
            pauseSettingsScreen = { ...pauseSettingsScreen, selectedItemIndex: index }
            handlePauseSettingsControlIntent(direction === -1 ? 'adjust-left' : 'adjust-right')
          }}
          onActivateItem={(index) => {
            pauseSettingsScreen = { ...pauseSettingsScreen, selectedItemIndex: index }
            handlePauseSettingsControlIntent('confirm')
          }}
          onCancelDelete={() => {
            pauseSettingsScreen = { ...pauseSettingsScreen, deleteConfirm: null }
          }}
          onConfirmDelete={onConfirmSettingsDelete}
          onBackLabel="pause.resume"
        />
      </div>
    {/if}
```

Add this exact scoped CSS in `GameplayScreen.svelte`:

```css
  .settings-pause-overlay {
    position: absolute;
    inset: 0;
    z-index: 22;
    display: grid;
    place-items: center;
    container-type: size;
    background:
      linear-gradient(90deg, rgba(7, 22, 48, 0.2), rgba(7, 22, 48, 0.62), rgba(7, 22, 48, 0.2)),
      rgba(12, 42, 82, 0.2);
    pointer-events: auto;
    backdrop-filter: blur(4px) saturate(78%);
    animation: pause-backdrop-in 220ms ease-out both;
  }

  @keyframes pause-backdrop-in {
    from {
      opacity: 0;
      backdrop-filter: blur(0) saturate(100%);
    }
    to {
      opacity: 1;
      backdrop-filter: blur(4px) saturate(78%);
    }
  }
```

- [ ] **Step 10: Update App.svelte to pass settings props**

Modify the `GameplayScreen` usage in `src/App.svelte`:

```svelte
        <GameplayScreen
          stage={gameplayStageMap}
          {settings}
          localizeData={projectData.localize}
          {locale}
          localeCodes={projectData.localize.languages.map((language) => language.code)}
          onRetry={handleRetryGameplayStage}
          onStageSelect={handleReturnFromGameplayToStageSelect}
          onSettingsChange={handleGameplaySettingsChange}
          onConfirmSettingsDelete={handleConfirmDelete}
        />
```

Add this handler in `App.svelte` near the existing settings handlers:

```ts
  function handleGameplaySettingsChange(nextSettings: GameSettings, fullscreenChanged: boolean): void {
    settings = nextSettings
    saveSettings(nextSettings)
    syncMusic()
    if (fullscreenChanged) void setFullscreen(nextSettings.fullscreen)
  }
```

- [ ] **Step 11: Run focused integration checks**

Run:

```bash
npm run test -- src/ui/gameplay/gameplayScreenPause.test.ts src/ui/gameplay/pauseMenuUi.test.ts src/ui/settings/settingsPanelUi.test.ts
npm run check
```

Expected: PASS.

- [ ] **Step 12: Commit Task 6**

```bash
git add src/ui/gameplay/GameplayScreen.svelte src/ui/gameplay/gameplayScreenPause.test.ts src/App.svelte
git commit -m "feat: wire gameplay pause menu"
```

---

### Task 7: Full Verification And Browser QA

**Files:**
- Modify only files already touched by Tasks 1-6 when verification exposes a defect.

- [ ] **Step 1: Run full automated verification**

Run:

```bash
npm run test
npm run check
npm run build
git diff --check
rg -n "__prototype__" src public package.json
```

Expected:

- `npm run test`: all tests pass.
- `npm run check`: 0 errors and 0 warnings.
- `npm run build`: succeeds; existing Vite large chunk warning is acceptable if unchanged.
- `git diff --check`: no output.
- prototype-boundary scan: no rebuild runtime imports from `__prototype__`.

- [ ] **Step 2: Start dev server for browser verification**

Run:

```bash
npm run dev -- --host 127.0.0.1 --port 1422
```

Expected: Vite serves `http://127.0.0.1:1422/`.

- [ ] **Step 3: Verify Pause Menu manually in the in-app browser**

Use the in-app browser at `http://127.0.0.1:1422/`.

Verify:

- Navigate to gameplay `1-1`.
- Press `Escape`; Pause Menu appears.
- Phaser simulation and HUD timer stop while paused.
- `ArrowDown`/`ArrowUp` wraps selection.
- `Enter` on Resume closes menu and gameplay continues without a visible timer jump.
- Reopen menu, choose Restart Stage; stage remounts and counters reset.
- Reopen menu, choose Settings; settings panel appears over paused gameplay.
- Press `Escape` from pause-origin settings; returns to Pause Menu with Settings selected.
- Reopen menu, choose Return to Stage Select; returns to the current world/stage selection.
- Clear the stage or use an existing result harness path; Pause Menu does not open over Stage Result.

- [ ] **Step 4: Visual parity check**

Compare against prototype reference:

- Pause overlay covers the gameplay frame only.
- Backdrop uses dark blue gradient and blur.
- Panel is centered and about one third of the frame width.
- Kicker, title, rule, indexed rows, active strip, and control hints match prototype hierarchy.
- Row animation is staggered and frame-relative sizing holds at desktop and smaller 16:9 sizes.

- [ ] **Step 5: Fix verification defects with TDD**

For any defect:

1. Add or update the smallest failing test that captures the defect.
2. Run the focused test and confirm RED.
3. Implement the smallest fix.
4. Run focused test and confirm GREEN.
5. Re-run Step 1 checks.

- [ ] **Step 6: Commit verification fixes if any**

If Step 5 changed files:

```bash
git status --short
git add src/domain/gameplay/gameplayPause.ts src/domain/gameplay/gameplayPause.test.ts src/domain/input/controlIntents.ts src/domain/input/controlIntents.test.ts src/domain/data/localize/localize.ts src/domain/data/localize/localize.test.ts src/application/input/settingsControls.ts src/application/input/settingsControls.test.ts src/application/input/appControls.ts src/application/input/appControls.test.ts src/ui/gameplay/createGameplayRenderer.ts src/ui/gameplay/createGameplayRenderer.test.ts src/ui/settings/SettingsPanel.svelte src/ui/settings/SettingsScreen.svelte src/ui/settings/settingsPanelUi.test.ts src/ui/gameplay/PauseMenu.svelte src/ui/gameplay/pauseMenuUi.test.ts src/ui/controls/controlHints.test.ts src/ui/gameplay/GameplayScreen.svelte src/ui/gameplay/gameplayScreenPause.test.ts src/App.svelte
git commit -m "fix: verify gameplay pause menu"
```

If no files changed, do not create an empty commit.

---

## Plan Self-Review

- Spec coverage:
  - Prototype behavior: Tasks 1, 5, 6, 7.
  - Clean-room TDD implementation: every task starts with failing tests before implementation.
  - Pure domain/application pause rules: Task 1.
  - Reusable settings application behavior: Task 2.
  - Renderer pause/resume/reset boundary: Task 3.
  - Reactive Svelte Pause Menu and pause-origin Settings: Tasks 4, 5, 6.
  - Localization: Tasks 1 and 5.
  - Visual/animation parity: Tasks 5 and 7.
  - Stage Result precedence: Task 6.
  - Verification gates: Task 7.
- Placeholder scan:
  - No `TBD`, `TODO`, `implement later`, or unspecified "write tests" steps.
- Type consistency:
  - `GameplayPauseState`, `PauseAction`, `PAUSE_MENU_ITEMS`, `SettingsPanel`, `PauseMenu`, and renderer controller names are consistent across tasks.
