# Task 5 Report: Pause Menu Presentational Component

## Status

Completed on branch `codex/gameplay-hud-ui`.

## RED Evidence

Command:

```bash
npm run test -- src/ui/gameplay/pauseMenuUi.test.ts src/ui/controls/controlHints.test.ts
```

Observed result:

- `src/ui/gameplay/pauseMenuUi.test.ts` failed with `ENOENT` for `./PauseMenu.svelte`
- `src/ui/controls/controlHints.test.ts` failed with `ENOENT` for `../gameplay/PauseMenu.svelte`

This confirmed the new Pause Menu contract tests were exercising missing implementation.

## GREEN Evidence

Command:

```bash
npm run test -- src/ui/gameplay/pauseMenuUi.test.ts src/ui/controls/controlHints.test.ts src/domain/data/localize/localize.test.ts
```

Observed result:

- `3` test files passed
- `19` tests passed

Additional verification:

```bash
npm run check
git diff --check
```

Observed result:

- `npm run check` passed with `0` errors and `0` warnings
- `git diff --check` passed with no output

## Files Changed

- `src/ui/gameplay/PauseMenu.svelte`
- `src/ui/gameplay/pauseMenuUi.test.ts`
- `src/ui/controls/controlHints.test.ts`

## Implementation Summary

- Added presentational `PauseMenu.svelte` using `PAUSE_MENU_ITEMS`, localized label references, and shared `ControlHints`.
- Matched the required overlay/panel structure and animation/style contract from the task brief.
- Extended the shared control-hints contract coverage to include `PauseMenu`.
- Adjusted the control-hints contract to reflect the current code boundary where `SettingsScreen.svelte` composes `SettingsPanel.svelte`, and `SettingsPanel.svelte` owns the `ControlHints` import/rendering.

## Tests Run

- `npm run test -- src/ui/gameplay/pauseMenuUi.test.ts src/ui/controls/controlHints.test.ts`
- `npm run test -- src/ui/gameplay/pauseMenuUi.test.ts src/ui/controls/controlHints.test.ts src/domain/data/localize/localize.test.ts`
- `npm run check`
- `git diff --check`

## Self-Review

- The component stays presentational and does not wire into `GameplayScreen`, which remains for Task 6.
- Localization is resolved through `text(...)`; no inline pause menu copy was introduced.
- The component uses shared `ControlHints` rather than inline keycap markup.
- Styling is scoped to the pause menu and matches the briefed source contract values.

## Concerns

- The task brief assumed `SettingsScreen.svelte` directly imported `ControlHints`, but the current code delegates that responsibility to `SettingsPanel.svelte`. The contract test was updated to preserve the shared-control-hints intent without changing existing screen composition.
