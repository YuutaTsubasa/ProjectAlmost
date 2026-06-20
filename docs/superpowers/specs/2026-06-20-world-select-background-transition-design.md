# World Select Background Transition Design

## Goal

Restore the World Select selected-background transition so changing worlds has a visible gradual crossfade like the prototype instead of an instant image swap.

## Scope

This slice covers the shared image crossfade presentation primitive and its World Select use. It does not change app-flow selection behavior, audio, stage select, world data, or prototype files.

## Reference Behavior

The prototype World Select keeps a dedicated `.world-backdrop` with transition styling while the selected world theme changes. The rebuild's first attempt kept previous/current layers inside `WorldSelectScreen.svelte`, but the incoming layer was not keyed by the active image URL and could visually replace the image before a fade became visible.

## Design

`src/ui/shared/CrossFadeImage.svelte` owns the reusable image crossfade behavior. It receives a `src` string, keeps the previous `src` during one animation window, and keys the current layer by `currentSrc` so Svelte remounts the incoming layer and reliably restarts the fade-in animation.

`src/ui/world/WorldSelectScreen.svelte` derives the selected background URL from `world.assetRefs.stageSelectBackground` and passes it to `CrossFadeImage`. World Select should not manage backdrop timers or previous image state. This keeps animation state local to the presentation primitive and avoids leaking visual transition behavior into domain or application state.

`src/app.css` defines the shared CSS contract:

- `.crossfade-image` fills its parent.
- `.crossfade-image-layer` renders a cover background image from `--crossfade-image`.
- `.crossfade-image-layer.current` is visible as the destination image.
- `.crossfade-image-layer.previous` sits above the current layer while fading to transparent, creating the crossfade.
- `.world-backdrop-stack` owns World Select layout and cinematic dark overlays around the shared component.
- `prefers-reduced-motion: reduce` continues to collapse transition duration through the existing global reduced-motion rule.

## Testing

Add focused UI contract tests that import Svelte components as raw source and read the real stylesheet. The tests verify:

- `CrossFadeImage.svelte` exposes `src` and `durationMs` props.
- `CrossFadeImage.svelte` renders previous and current layers.
- `CrossFadeImage.svelte` keys the current layer by `currentSrc`.
- `CrossFadeImage.svelte` removes the outgoing previous layer after the configured duration.
- `WorldSelectScreen.svelte` imports and uses `CrossFadeImage`.
- `WorldSelectScreen.svelte` uses `world.assetRefs.stageSelectBackground` for the image URL.
- CSS contains opacity transitions for shared crossfade layers.
- CSS defines a previous-layer fade-out animation and keeps the current layer visible under it.

Run:

- `npm run test -- src/ui/shared/crossFadeImage.test.ts src/ui/world/worldSelectBackgroundTransition.test.ts`
- `npm run test`
- `npm run check`
- `npm run build`
- `git diff --check`

## Risks

The main risk is writing a decorative fade that does not actually keep the outgoing image in the DOM or accidentally leaving the active image transparent. The tests and browser verification check for a previous layer above a visible keyed current layer so the implementation preserves both images during the transition.
