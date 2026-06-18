# Title Prototype Style Menu Design

## Target Behavior

Migrate the title screen's visual style from the preserved prototype into the rebuilt root app.

The rebuilt title flow has two states:

1. Intro state:
   - Shows the prototype-style background, logo, copyright, and `Press Any Button` prompt.
   - Pressing any key or clicking/tapping the screen opens the title menu.
2. Menu state:
   - Shows the prototype-style title menu.
   - Menu items are `Start Game`, `Settings`, and `Back`.
   - `Start Game` and `Settings` are visible but intentionally inactive.
   - `Back` returns to the intro state.

## Layer Ownership

- `src/domain/app/appFlow.ts`: pure title state transitions.
- `src/ui/title/TitleScreen.svelte`: Svelte adapter for input and rendering.
- `src/App.svelte`: holds current app state and passes it to the title component.
- `src/app.css`: title visuals copied and adapted from the prototype.
- `public/assets/title/`: root runtime copy of the title background image.

## Architecture Notes

The root app may use the prototype as a design and asset reference, but runtime code must not import from `__prototype__`.

The menu behavior belongs in the pure app-flow domain. Svelte may listen for clicks and keyboard events, but it should call pure transition functions instead of embedding route behavior.

The menu does not navigate yet. Inactive menu items return the current state unchanged, making their temporary no-op behavior explicit and testable.

## Domain API

The app-flow domain exposes:

- `openTitleMenu(state)`
- `moveTitleMenuSelection(state, direction)`
- `activateTitleMenuItem(state)`

Title menu items are represented as stable ids:

- `start`
- `settings`
- `back`

## Files Expected To Change

- Modify `src/domain/app/appFlow.test.ts`
- Modify `src/domain/app/appFlow.ts`
- Modify `src/ui/title/TitleScreen.svelte`
- Modify `src/App.svelte`
- Modify `src/app.css`
- Add `public/assets/title/project-almost-title-background.webp`

## Tests To Write First

Focused tests cover:

- Initial state is intro.
- Opening the title menu selects the first item.
- Menu selection wraps up and down.
- Activating `start` leaves state unchanged.
- Activating `settings` leaves state unchanged.
- Activating `back` returns to intro.

## Side Effects And Adapters

The only side effects are DOM rendering and event listeners in Svelte.

The title background is copied from the prototype into root `public/assets/title/` so the rebuilt app owns its runtime asset path.

## Validation Commands

- `npm run test -- src/domain/app/appFlow.test.ts`
- `npm run test`
- `npm run check`
- `npm run build`
- `git diff --check`

Also verify in the browser:

- Intro screen renders the migrated background and `Press Any Button`.
- Any keyboard key opens the menu.
- `Back` returns to intro.
- `Start Game` and `Settings` remain on the menu.

## Out Of Scope

- No stage select.
- No settings screen.
- No save data.
- No audio.
- No localization system.
- No route transitions.
- No prototype runtime imports.
