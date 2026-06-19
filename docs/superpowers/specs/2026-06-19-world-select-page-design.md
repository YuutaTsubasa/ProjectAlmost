# World Select Page Design

## Goal

Add a world selection page to the rebuild now that world catalog data exists. The title menu's Start Game action opens this page, the page visually follows the old prototype's cinematic world select, and the rebuild uses copied runtime assets from `__prototype__/public/assets/maps/` under root `public/assets/maps/`.

## Scope

This slice covers:

- Title menu navigation from Start Game to world select.
- A rebuild-native world select screen using `projectData.worlds`.
- World selection movement and direct selection state in the pure app flow.
- Back navigation from world select to the title menu.
- Copying the six stage-select map backgrounds referenced by world data into root `public/assets/maps/`.

This slice does not cover entering stage select or gameplay. Confirming a world may preserve the selected world state until the stage-select route exists.

## Architecture

`src/domain/app/appFlow.ts` remains the deterministic application state machine. It gains a `world-select` screen with `selectedWorldIndex`, plus pure functions for moving, selecting, confirming, and backing out of world select. `Start Game` in the title menu transitions into `world-select` with the first world selected.

`src/App.svelte` remains the top-level coordinator. It imports `projectData.worlds`, renders `WorldSelectScreen` for `world-select`, and wires UI events to app-flow functions.

`src/ui/world/WorldSelectScreen.svelte` is a presentation component. It receives the world catalog, the selected index, and callbacks. It renders the catalog in catalog order and never imports prototype code.

## Visual Direction

The rebuild should reference the prototype's cinematic world select:

- Full-frame selected-world background using each world's `assetRefs.stageSelectBackground`.
- Dark cinematic overlays so text remains readable.
- Large selected-world copy on the left: world number, localized title, and localized subtitle.
- Bottom horizontal world rail with all six worlds, selected state, world symbol, localized title, and number, matching the final prototype treatment.
- The world rail glass treatment should not depend only on browser-native backdrop rendering. Keep the prototype-style `backdrop-filter`, and layer a blurred copy of the selected world background inside each rail option so Chromium and Safari show comparable frosted depth.
- Compact control hints at the lower right using the final prototype `select-controls world-controls` treatment.

The styling should be rebuilt in `src/app.css` and fit inside the existing `ResolutionFrame`.

## Controls

Keyboard controls:

- `ArrowDown`, `ArrowRight`, `S`, and `D` move selection forward with wrapping.
- `ArrowUp`, `ArrowLeft`, `W`, and `A` move selection backward with wrapping.
- `Enter` and `Space` confirm the selected world, preserving the world-select screen for now.
- `Escape` returns to the title menu.

Pointer controls:

- Clicking a world rail item selects that world.
- Double-clicking a world rail item selects and confirms it.
- Clicking Back returns to the title menu.

## Data And Assets

The screen reads `projectData.worlds`, which already contains localized title/subtitle refs, theme, symbol, stage count, and stage-select background refs.

Copy these prototype assets into `public/assets/maps/`:

- `white_palace_stage_select.webp`
- `emerald_sanctuary_stage_select.webp`
- `cerulean_depths_stage_select.webp`
- `frostveil_peaks_stage_select.webp`
- `emberfall_caldera_stage_select.webp`
- `abyssal_hollow_stage_select.webp`

The prototype remains read-only except for reading and copying assets out of it.

## Testing

Use TDD for app behavior in `src/domain/app/appFlow.test.ts`:

- Start Game opens world select at index 0.
- Settings stays inactive.
- Back from title menu returns to title intro.
- World selection wraps forward and backward.
- Direct world selection updates the selected index.
- Back from world select returns to title menu.
- Confirming a world preserves the selected world-select state until stage select exists.

Run the required checks after implementation:

- `npm run test`
- `npm run check`
- `npm run build`
- `git diff --check`

## Risks

The main risk is letting UI state leak into Svelte. Keep selection behavior in `appFlow.ts` so navigation remains deterministic and testable. A secondary risk is missing copied assets; verify the six files exist under root `public/assets/maps/` because the world data already points there.
