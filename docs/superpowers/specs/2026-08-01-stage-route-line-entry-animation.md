# Stage Select Route Line Entry Animation

## Context

The stage select screen draws SVG route lines between consecutive stage nodes.
The previous behavior (commit "Animate unlocked stage route lines") only played
the draw-in animation on a segment when **both** its endpoints were unlocked
(`isLiveStage(index)` → `.live`). Locked segments rendered as static dashed
lines with no animation.

## Decision

Every route segment should play the same draw-in entry animation whenever the
stage select screen appears, regardless of clear/unlock progress. The lock state
is already communicated by the stage nodes themselves (`◆` vs. the stage id, plus
`.locked` / `.cleared` node styling), so the lines no longer need a separate
locked/unlocked visual.

## Behavior

- All `.stage-paths line` elements use the solid stroke + `stage-path-live-draw`
  keyframe (`stroke-dashoffset: 1 → 0`), staggered by `--path-index`.
- There is no `.live` class and no `isLiveStage` gating.
- `prefers-reduced-motion: reduce` disables the animation for all lines and
  leaves them fully drawn (`stroke-dashoffset: 0`).

## Verification

- `stageSelectLocalization.test.ts` asserts the uniform markup/CSS (no
  `class:live`, animation defined on the base `.stage-paths line`).
- Manual: entering stage select draws every segment in on a fresh save.
