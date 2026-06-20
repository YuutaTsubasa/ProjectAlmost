# World Select Background Transition Design

## Goal

Restore the World Select selected-background transition so changing worlds has a visible gradual crossfade like the prototype instead of an instant image swap.

## Scope

This slice covers the shared image crossfade presentation primitive and its World Select use. It does not change app-flow selection behavior, audio, stage select, world data, or prototype files.

## Reference Behavior

The prototype World Select keeps a dedicated `.world-backdrop` with transition styling while the selected world theme changes. The rebuild's first attempt kept previous/current layers inside `WorldSelectScreen.svelte`, but the incoming layer was not keyed by the active image URL and could visually replace the image before a fade became visible.

## Design

`src/ui/shared/CrossFadeImage.svelte` owns the reusable image crossfade behavior. It receives a `src` string, preloads and decodes the incoming image before starting the transition, keeps the previous `src` during one animation window, and keys the current layer by `currentSrc` so Svelte remounts the incoming layer when needed. The outgoing layer starts at opacity 1, then `requestAnimationFrame` advances an explicit `previousOpacity` state down to 0 before removing the layer. This avoids relying on CSS transition/keyframe interpolation for the old image, which previously left the outgoing layer fully opaque until it was removed.

`src/ui/world/WorldSelectScreen.svelte` derives the selected background URL from `world.assetRefs.stageSelectBackground` and passes it to `CrossFadeImage`. World Select should not manage backdrop timers or previous image state. This keeps animation state local to the presentation primitive and avoids leaking visual transition behavior into domain or application state.

`src/app.css` defines the shared CSS contract:

- `.crossfade-image` fills its parent.
- `.crossfade-image-layer` renders a cover background image from `--crossfade-image`.
- `.crossfade-image-layer` explicitly disables CSS transitions so opacity interpolation comes only from component state.
- `.crossfade-image-layer.current` is visible as the destination image and does not animate opacity, brightness, contrast, or saturation.
- `.crossfade-image-layer.previous` sits above the current layer; its opacity is driven inline by the component's reactive `previousOpacity` state.
- The crossfade only changes previous-layer opacity. It does not animate filters, current-layer properties, CSS transitions, or keyframes because brightness/saturation shifts and delayed transition interpolation can read as a flash.
- `.world-backdrop-stack` owns World Select layout and cinematic dark overlays around the shared component.
- `prefers-reduced-motion: reduce` collapses the component-driven fade duration to 0 because CSS reduced-motion rules cannot affect `requestAnimationFrame` state updates.

## Testing

Add focused UI contract tests that import Svelte components as raw source and read the real stylesheet. The tests verify:

- `CrossFadeImage.svelte` exposes `src` and `durationMs` props.
- `CrossFadeImage.svelte` preloads the incoming `src` before moving it into `currentSrc`.
- `CrossFadeImage.svelte` renders previous and current layers.
- `CrossFadeImage.svelte` keys the current layer by `currentSrc`.
- `CrossFadeImage.svelte` removes the outgoing previous layer after the configured duration.
- `WorldSelectScreen.svelte` imports and uses `CrossFadeImage`.
- `WorldSelectScreen.svelte` uses `world.assetRefs.stageSelectBackground` for the image URL.
- CSS keeps the current layer visible under the previous layer without transition or keyframe animations.
- `CrossFadeImage.svelte` advances previous-layer opacity with `requestAnimationFrame` and removes the previous layer only after opacity reaches 0.
- `CrossFadeImage.svelte` checks `prefers-reduced-motion: reduce` when computing the effective fade duration.

Run:

- `npm run test -- src/ui/shared/crossFadeImage.test.ts src/ui/world/worldSelectBackgroundTransition.test.ts`
- `npm run test`
- `npm run check`
- `npm run build`
- `git diff --check`

## Risks

The main risk is writing a decorative fade that does not actually keep the outgoing image in the DOM, accidentally leaving the active image transparent, starting the fade before the incoming image is decoded, or introducing filter animations that look like a brightness flash. The tests and browser verification check for a previous layer above a visible keyed current layer, and the component preloads the incoming image before swapping state.
