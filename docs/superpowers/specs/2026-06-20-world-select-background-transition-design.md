# World Select Background Transition Design

## Goal

Restore the World Select selected-background transition so changing worlds has a gradual visual fade like the prototype instead of an instant image swap.

## Scope

This slice covers only the World Select background transition in the rebuild. It does not change app-flow selection behavior, audio, stage select, world data, or prototype files.

## Reference Behavior

The prototype World Select keeps a dedicated `.world-backdrop` with transition styling while the selected world theme changes. The rebuild currently uses one backdrop whose `--world-background` variable changes with the selected theme, which makes browsers replace the image immediately.

## Design

`src/ui/world/WorldSelectScreen.svelte` should keep the previously selected world's stage-select background long enough to render it as a fading layer. The selected world background is rendered as the active layer. When `selectedWorldIndex` changes, the previous layer receives the outgoing background URL and fades out while the active layer fades in.

The component should derive background image URLs from `world.assetRefs.stageSelectBackground` rather than duplicating theme-to-file mappings. This keeps the presentation tied to catalog data and avoids adding selection state to the domain layer.

`src/app.css` should define a small, testable CSS contract:

- `.world-backdrop-stack` fills the screen behind the existing content.
- `.world-backdrop-layer` renders a cover background image from `--world-backdrop-image`.
- `.world-backdrop-layer.previous` is visible at first and fades to transparent.
- `.world-backdrop-layer.current` fades in with the selected background.
- The existing cinematic dark overlays remain on the current visible backdrop stack.
- `prefers-reduced-motion: reduce` continues to collapse transition duration through the existing global reduced-motion rule.

## Testing

Add a focused UI contract test that imports `WorldSelectScreen.svelte?raw` and `app.css?raw`. The test should verify:

- The component renders a `world-backdrop-stack`.
- The component renders a keyed previous backdrop layer.
- The component uses `world.assetRefs.stageSelectBackground` for background image URLs.
- CSS contains opacity transitions for backdrop layers.
- CSS defines a previous-layer fade-out animation.

Run:

- `npm run test -- src/ui/world/worldSelectBackgroundTransition.test.ts`
- `npm run test`
- `npm run check`
- `npm run build`
- `git diff --check`

## Risks

The main risk is writing a decorative fade that does not actually keep the outgoing image in the DOM. The test checks for a previous keyed layer so the implementation preserves both images during the transition.
