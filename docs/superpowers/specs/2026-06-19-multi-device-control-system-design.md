# Multi-Device Control System Design

## Target Behavior

Create the rebuild's first reusable control system so keyboard, mouse, touch, and gamepad inputs can drive the current title flow through the same application intents.

This slice wires the system to the existing title intro and title menu:

- Any supported confirm/open input opens the title menu from the intro.
- Directional inputs move the selected title menu item up or down.
- Confirm activates the selected title menu item.
- Back returns from the title menu to the intro through the existing `back` menu behavior.
- Mouse and touch use the same pointer path for opening the menu and selecting menu buttons.
- Gamepad support is digital in this slice: D-pad, left stick threshold, south face button, and east face button.

The control system must be reusable for later gameplay, but this slice does not implement player movement, attacks, homing, pause menus, rebinding, input buffering, or analog strength behavior.

## Layer Ownership

- `src/domain/input/`: pure input mapping. It translates device-specific snapshots or event descriptors into stable control intents. It has no DOM, Svelte, Tauri, timers, browser APIs, or hidden mutable state.
- `src/application/input/`: pure coordination from control intents to app state transitions. It depends on domain app-flow functions and contains no DOM or browser APIs.
- `src/ui/title/TitleScreen.svelte`: presentation and DOM event adapter. It emits input descriptors or control intents instead of owning menu rules.
- `src/App.svelte`: owns current app state and applies title flow transitions when control intents arrive.

The prototype may be used only as a reference. Runtime code must stay in the root rebuild and must not import from `__prototype__/`.

## Control Intents

The shared title/navigation intents for this slice are:

- `open`
- `move-up`
- `move-down`
- `confirm`
- `back`

The names are intentionally not title-specific. Later gameplay screens can map these same intents to menu navigation, while gameplay-specific actions can be added in a separate spec.

## Device Mapping

Keyboard:

- Any key opens the title menu from the intro.
- `ArrowDown` and `s` map to `move-down`.
- `ArrowUp` and `w` map to `move-up`.
- `Enter` and Space map to `confirm`.
- `Escape` maps to `back`.

Pointer and touch:

- Clicking or tapping the intro overlay maps to `open`.
- Clicking or tapping a menu item maps to direct selection. For this slice, only the `back` item activates immediately after selection because `start` and `settings` remain intentionally inactive.
- Pointer and touch events share the same adapter path because browser touch events can be represented through pointer events for this UI.

Gamepad:

- D-pad down or left stick Y above the positive threshold maps to `move-down`.
- D-pad up or left stick Y below the negative threshold maps to `move-up`.
- South face button maps to `open` on the intro and `confirm` on the menu.
- East face button maps to `back`.
- Held gamepad directions must not fire every frame. The adapter should emit an intent only when a relevant button or axis crosses from inactive to active.

## Architecture Notes

The pure domain should expose small functions that are easy to test, such as:

- map a keyboard descriptor to zero or one control intent
- map a gamepad snapshot transition to a list of control intents
- decide whether an axis value crosses the digital threshold

The UI adapter may use browser APIs such as `KeyboardEvent`, `PointerEvent`, `requestAnimationFrame`, and `navigator.getGamepads()`, but those APIs must not leak into the domain. The adapter converts browser data into plain descriptors before calling domain functions.

For the title flow, `src/application/input/titleControls.ts` should apply intents to existing app-flow functions:

- `open` opens the title menu when the screen is `title-intro`
- `move-up` calls `moveTitleMenuSelection(-1)` when the menu is open
- `move-down` calls `moveTitleMenuSelection(1)` when the menu is open
- `confirm` calls `activateTitleMenuItem()` when the menu is open
- `back` selects or activates the existing Back behavior when the menu is open

`App.svelte` should call the application input bridge instead of switching on control intents directly.

## Error Handling And Edge Cases

- Unknown keyboard keys should produce no navigation intent while the menu is open.
- Unsupported gamepad layouts should be ignored instead of throwing.
- Missing gamepad data should produce no intents.
- Repeated keyboard events should be ignored for menu movement and confirmation so held keys do not skip multiple items unexpectedly.
- Gamepad axis values inside the dead zone should be inactive.
- Pointer actions should not bubble into duplicate open or confirm intents.

## Tests To Write First

Focused tests must be written and watched fail before production code:

- Keyboard mapping returns `move-up`, `move-down`, `confirm`, and `back` for supported menu keys.
- Keyboard mapping returns `open` for any intro key.
- Keyboard mapping ignores unknown menu keys and repeated keydown events.
- Gamepad mapping returns movement intents when D-pad or left stick crosses the threshold.
- Gamepad mapping emits a button intent only on inactive-to-active transitions.
- Missing or unsupported gamepad data returns no intents.
- Application intent handling opens the title menu, moves selection, confirms the current item, and backs out to the intro.

Svelte/browser integration can be verified through `npm run check`, `npm run build`, and a manual browser pass. Domain and application behavior must be covered by automated tests.

## Files Expected To Change During Implementation

- Add `src/domain/input/controlIntents.test.ts`
- Add `src/domain/input/controlIntents.ts`
- Add `src/application/input/titleControls.test.ts`
- Add `src/application/input/titleControls.ts`
- Modify `src/ui/title/TitleScreen.svelte`
- Modify `src/App.svelte`

## Validation Commands

- `npm run test -- src/domain/input/controlIntents.test.ts`
- `npm run test -- src/application/input/titleControls.test.ts`
- `npm run test`
- `npm run check`
- `npm run build`
- `git diff --check`

Manual verification:

- Keyboard opens and navigates the title menu.
- Mouse click opens the title menu and can select menu items.
- Touch tap follows the same path as pointer input on a touch-capable browser or simulator.
- Connected gamepad can open, move, confirm, and go back in the title menu without repeated movement from one held direction.

## Out Of Scope

- Character movement or gameplay actions.
- Configurable key bindings.
- Save data for controls.
- Input buffering, hold duration, charge actions, or analog movement strength.
- Haptics.
- Multiplayer input ownership.
- Accessibility settings beyond preserving existing button semantics.
