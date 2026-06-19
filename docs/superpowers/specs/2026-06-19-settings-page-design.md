# Settings Page Design

## Target Behavior

Port the prototype settings page into the rebuilt project as a first-class settings screen. The rebuilt implementation must preserve the prototype's visible row order, labels, adjustment behavior, delete confirmation flow, and panel styling while using the rebuild's DDD, functional-core, and reactive UI boundaries.

The settings screen opens from the title menu's Settings item. It uses the current title background frame and displays the same system menu panel shape as `__prototype__/src/SettingsPanel.svelte`.

Rows:

- Master Volume: numeric volume, `0` to `100`, adjusted in steps of `10`.
- Music Volume: numeric volume, `0` to `100`, adjusted in steps of `10`.
- SFX Volume: numeric volume, `0` to `100`, adjusted in steps of `10`.
- Language: cycles through the existing supported locale list: `en`, `ja`, `zhHant`, `ko`.
- Fullscreen: toggle.
- Screen Shake: toggle.
- Controller Vibration: toggle.
- Reset to Default: restores default settings while preserving the actual fullscreen state reported by the browser adapter.
- Delete Save Data: opens the prototype-style confirmation dialog.
- Back: returns to the title menu with Settings selected.

The initial default settings match the prototype:

- `masterVolume: 100`
- `musicVolume: 80`
- `sfxVolume: 80`
- `language: "en"`
- `fullscreen: false`
- `screenShake: true`
- `vibration: true`

Settings are persisted in browser storage under the prototype key `project-almost:settings` so future slices can reuse existing saved preferences. Invalid or partial saved settings are merged safely with defaults. The current app locale is no longer hard-coded in `App.svelte`; it comes from settings and updates immediately when Language changes.

The rebuild does not yet have a save system. Confirming Delete Save Data should still exercise the UI flow and emit an explicit application/UI command boundary for save deletion, but the adapter can be a no-op until save data exists. Do not invent a save subsystem in this slice.

## Prototype Parity

Use the prototype as a reference only. Root rebuild code must not import from `__prototype__/`.

Prototype files to match:

- `__prototype__/src/SettingsPanel.svelte`
- `__prototype__/src/App.svelte` settings functions and input handling
- `__prototype__/src/i18n.ts` settings, common, and language copy
- `__prototype__/src/app.css` settings panel, rows, meters, and delete confirmation styles

The rebuilt Svelte component can use the same DOM shape where useful, but behavior is supplied through typed props and pure application transitions instead of local prototype-style mutable functions.

## Layer Ownership

### Domain

Path: `src/domain/settings/`

Owns pure setting types and deterministic behavior:

- `GameSettings`
- default settings
- settings row catalog
- volume clamping and step adjustment
- locale cycling from `LocalizeData.languages`
- toggle/reset behavior
- selected-row movement with wraparound
- delete confirmation selection movement
- activation decisions such as `request-fullscreen`, `open-delete-confirm`, `confirm-delete-save`, and `close-settings`

Domain code has no Svelte, DOM, fullscreen, browser storage, audio, or save-data imports.

### Application

Path: `src/application/`

Coordinates app state and commands:

- `appControls.ts` applies shared `ControlIntent`s to the settings screen.
- Settings transitions return updated `AppState` plus explicit commands when a side effect is needed.
- Side-effect commands include at least `persist-settings`, `set-fullscreen`, and `delete-save-data`.

The app flow owns navigation:

- Title menu Settings activates the settings screen.
- Settings Back returns to title menu with Settings selected.
- Escape/back while delete confirmation is open closes the confirmation first.

### Localization Data

Path: `src/domain/data/localize/`

Add typed localization keys for:

- common labels used by settings: select, confirm, adjust, back, on, off, cancel, delete, warning
- language labels for all supported locales
- settings labels and aria strings

All supported locales must have explicit settings strings. English must match the prototype. Japanese, Traditional Chinese, and Korean should reuse the prototype copy while adapting `zh-TW` to the rebuild's `zhHant` locale code.

### Input Domain

Path: `src/domain/input/`

Extend `ControlContext` with settings contexts:

- `settings`
- `settings-delete-confirm`

Keyboard behavior:

- Settings rows: `ArrowUp`/`w` move up, `ArrowDown`/`s` move down, `ArrowLeft`/`a` adjust backward, `ArrowRight`/`d` adjust forward, `Enter`/Space activate, `Escape` back.
- Delete confirmation: `ArrowLeft`/`a` and `ArrowRight`/`d` switch between Cancel and Delete, `Enter`/Space activates selected choice, `Escape` cancels.
- Repeated keydown events produce no intent.

Gamepad behavior:

- South face button confirms or activates.
- East face button backs or cancels.
- D-pad and left-stick threshold crossings map to movement and adjustment intents using the existing edge-trigger behavior.

### UI

Path: `src/ui/settings/SettingsScreen.svelte`

Renders only the settings presentation:

- receives settings, selected item, delete confirmation state, locale, `LocalizeData`, and event callbacks
- resolves visible text through `resolveLocalizedText`
- emits shared control intents or explicit pointer commands
- does not read or write localStorage
- does not directly delete save data
- may request fullscreen only by callback to `App.svelte`

`App.svelte` remains the browser adapter for:

- loading and saving settings from localStorage
- keeping locale in sync with settings
- reading actual fullscreen state
- requesting or exiting fullscreen
- handling no-op save deletion until a save system exists

## State Shape

`AppScreen` should include:

```ts
type SettingsScreen = {
  type: 'settings'
  selectedItemIndex: number
  deleteConfirm: null | {
    selectedActionIndex: 0 | 1
  }
}
```

Settings values can live beside `screen` in `AppState` if that keeps all control transitions pure:

```ts
type AppState = {
  screen: AppScreen
  settings: GameSettings
}
```

If implementation finds this too broad for the current app flow, `App.svelte` may own `settings` as reactive state and pass it into pure settings reducers. The reducer boundary must still be testable and deterministic.

## Error Handling

Storage parsing:

- Missing stored settings uses defaults.
- Malformed JSON uses defaults.
- Partial valid objects merge over defaults.
- Unknown locale falls back to `en`.
- Invalid numeric volumes are clamped to `0..100`.
- Invalid booleans use defaults.

Fullscreen:

- Fullscreen requests can fail or be unavailable.
- The domain only requests the change; the adapter updates `settings.fullscreen` from the actual browser fullscreen state.
- Reset to defaults preserves actual fullscreen state instead of assuming it can change synchronously.

Delete save:

- Until save data exists in the rebuild, confirmed deletion closes the dialog and emits the delete command to a no-op adapter.
- The command boundary must remain explicit so the future save slice can attach real behavior without changing settings domain rules.

## Testing

Write tests before production code.

Domain tests:

- default settings match the prototype
- volume adjustment clamps and steps by `10`
- language adjustment cycles through `LocalizeData.languages`
- fullscreen, screen shake, and vibration activation decisions are correct
- reset restores defaults while accepting the actual fullscreen value
- row selection wraps across the ten prototype rows
- delete confirmation opens, switches selection, cancels, and confirms

Localization tests:

- every settings/common/language key resolves for `en`, `ja`, `zhHant`, and `ko`
- English settings labels match prototype labels
- missing localized text still falls back to English

Input tests:

- settings keyboard mapping emits movement, adjustment, confirm, and back intents
- delete confirmation keyboard mapping emits horizontal selection, confirm, and back intents
- gamepad south/east/directional behavior works for settings contexts
- repeated keyboard events emit no intents

Application tests:

- title menu Settings opens settings
- settings Back returns to title menu with Settings selected
- settings control intents move, adjust, activate, and open delete confirmation
- delete confirmation control intents cancel and confirm through explicit command output
- locale changes when settings language changes

Svelte/browser verification:

- `npm run check`
- `npm run build`
- local browser pass for keyboard, pointer, and gamepad-capable control paths where feasible

## Validation Commands

- `npm run test -- src/domain/settings/settings.test.ts`
- `npm run test -- src/domain/data/localize/localize.test.ts`
- `npm run test -- src/domain/input/controlIntents.test.ts`
- `npm run test -- src/application/input/appControls.test.ts`
- `npm run test`
- `npm run check`
- `npm run build`
- `git diff --check`

## Out Of Scope

- Real save-data deletion because the rebuild save system does not exist yet.
- Audio playback or volume application beyond persisted setting values.
- Gameplay pause settings integration.
- Configurable key bindings.
- Runtime control rebinding.
- Any imports or runtime dependencies from `__prototype__/`.
