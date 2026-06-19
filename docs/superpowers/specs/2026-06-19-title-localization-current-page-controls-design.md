# Title Localization Current Page Controls Design

## Target Behavior

Apply the existing localization data system to the rebuilt `TitleScreen` and finish the shared control path for the two currently existing pages: title and world select.

The title page should no longer hard-code its visible menu and prompt copy inside the Svelte component. It should receive a `LocaleCode` and `LocalizeData`, resolve title UI strings through the domain localization resolver, and preserve the current English presentation when the app locale is `en`.

The current app locale is centralized in `App.svelte`. This slice uses `en` as the default because no language switching UI exists yet and the current visible behavior is English. Runtime language switching, persistence, and settings UI remain out of scope.

The existing two pages must be operable by keyboard, mouse, touch, and gamepad:

- Title intro opens with keyboard, pointer/touch, or gamepad confirm.
- Title menu moves, confirms, and backs out through shared control intents.
- World select moves, confirms, and backs out through shared control intents.
- Pointer/touch actions on buttons continue to use native button semantics and call the same application commands as keyboard/gamepad activation.

## Layer Ownership

- `src/domain/data/localize/`: owns localized text keys and pure resolution.
- `src/domain/input/`: owns pure device descriptor to control-intent mapping. It has no browser APIs.
- `src/application/input/`: owns pure conversion from shared intents to app-flow transitions.
- `src/App.svelte`: owns current `AppState`, current `LocaleCode`, and connects page events to application input functions.
- `src/ui/title/TitleScreen.svelte`: browser adapter and localized title presentation.
- `src/ui/world/WorldSelectScreen.svelte`: browser adapter and localized world presentation.

Root rebuild code must not import from `__prototype__/`.

## Localization Model Changes

The existing `LocalizationKey` union should expand beyond world keys to include title UI keys:

- `title.prompt.pressAnyButton`
- `title.menu.start`
- `title.menu.settings`
- `title.menu.back`
- `title.controls.select`
- `title.controls.confirm`
- `title.controls.back`
- `title.aria.screen`
- `title.aria.openMenu`
- `title.aria.menu`

The catalog should include values for all supported locales: `en`, `ja`, `zhHant`, and `ko`. English values must match the current UI labels to preserve existing presentation.

## Control Intent Model

Shared intents:

- `open`
- `move-up`
- `move-down`
- `move-left`
- `move-right`
- `confirm`
- `back`

Keyboard mapping:

- Any non-repeat key maps to `open` on the title intro.
- Title menu: `ArrowUp`/`w` map to `move-up`; `ArrowDown`/`s` map to `move-down`; `Enter`/Space map to `confirm`; `Escape` maps to `back`.
- World select: `ArrowRight`/`ArrowDown`/`d`/`s` map to forward movement; `ArrowLeft`/`ArrowUp`/`a`/`w` map to backward movement; `Enter`/Space map to `confirm`; `Escape` maps to `back`.
- Repeated keydown events produce no intent.

Gamepad mapping:

- South face button maps to `open` on title intro and `confirm` on menu pages.
- East face button maps to `back`.
- D-pad up/down/left/right and left stick axis threshold crossings map to directional intents.
- Held buttons or axes emit only on inactive-to-active transitions.
- Missing gamepad data emits no intents.

## Application Input Bridge

`src/application/input/appControls.ts` should apply shared control intents to the current app state:

- `open` opens the title menu only from title intro.
- `move-up` and `move-down` move title menu selection while on title menu.
- World select treats `move-right`/`move-down` as forward and `move-left`/`move-up` as backward.
- `confirm` activates the title menu or confirms the selected world.
- `back` returns title menu to the intro and returns world select to title menu.

Pointer/touch does not need a separate domain descriptor in this slice because Svelte pointer events call explicit app commands. Browser pointer events cover mouse and touch for the current buttons and intro overlay.

## Tests To Write First

- Localization tests for title key references and supported-locale title UI values.
- Domain input tests for title keyboard mapping, world keyboard mapping, gamepad button/axis edge mapping, and missing gamepad data.
- Application input tests for title intro/menu transitions and world select movement/confirm/back transitions from shared intents.

Svelte/browser integration should be verified with `npm run check`, `npm run build`, and a local browser pass where feasible.

## Validation Commands

- `npm run test -- src/domain/data/localize/localize.test.ts`
- `npm run test -- src/domain/input/controlIntents.test.ts`
- `npm run test -- src/application/input/appControls.test.ts`
- `npm run test`
- `npm run check`
- `npm run build`
- `git diff --check`

## Out Of Scope

- Runtime language selector.
- Persisted locale preference.
- Settings page.
- Gameplay controls.
- Configurable key bindings.
- Gamepad rebinding or analog-strength behavior.
