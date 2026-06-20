# World Select Background Transition Design

## Goal

Restore the World Select selected-background behavior so changing worlds follows the prototype's stable single-backdrop approach instead of flashing through extra transition layers.

## Scope

This slice covers the World Select backdrop presentation. It does not change app-flow selection behavior, audio, stage select, world data, or prototype files.

## Reference Behavior

The prototype World Select keeps one dedicated `.world-backdrop` element. The selected world changes the `.world-select.theme-*` class, which updates `--world-background`; `.world-backdrop` uses that variable as its background image and draws the cinematic dark overlay with a pseudo-element. It does not render previous/current image layers, does not run requestAnimationFrame opacity state, and does not animate filters during world selection.

## Design

`src/ui/world/WorldSelectScreen.svelte` renders a single `<div class="world-backdrop" aria-hidden="true"></div>` inside the themed `.world-select` section. World Select does not manage backdrop timers, previous image state, shared crossfade components, or inline opacity state.

`src/app.css` defines the shared CSS contract:

- `.world-backdrop` fills the screen.
- `.world-backdrop` renders `var(--world-background) center / cover no-repeat`.
- `.world-backdrop::before` owns the cinematic dark overlay.
- `.world-select.theme-*` owns the background image variables and world color variables.
- There are no `.crossfade-image*` selectors, crossfade keyframes, previous/current layers, or requestAnimationFrame-driven image fades for World Select.

## Testing

Add focused UI contract tests that import Svelte components as raw source and read the real stylesheet. The tests verify:

- `WorldSelectScreen.svelte` renders `.world-backdrop`.
- `WorldSelectScreen.svelte` does not import or use `CrossFadeImage`.
- `WorldSelectScreen.svelte` does not derive `assetRefs.stageSelectBackground` for backdrop transition state.
- CSS contains `.world-backdrop`, `.world-backdrop::before`, and `background: var(--world-background) center / cover no-repeat`.
- CSS does not contain `.crossfade-image*` selectors or crossfade keyframes.

Run:

- `npm run test -- src/ui/world/worldSelectBackgroundTransition.test.ts`
- `npm run test`
- `npm run check`
- `npm run build`
- `git diff --check`

## Risks

The main risk is reintroducing extra image layers or JS-driven opacity animation and recreating the flashing behavior. The tests and browser verification check that World Select uses the prototype's single backdrop layer and that the background remains one stable element after world changes.
