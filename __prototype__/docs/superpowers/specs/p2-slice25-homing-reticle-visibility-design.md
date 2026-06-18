# P2 Slice 25: Homing Reticle Visibility

## Target Behavior

Extract the first-layer visibility guard from `GameplayScene.updateHomingReticle(grounded)` into a pure Homing-domain rule.

The rule answers whether the scene is allowed to search for a Homing target and show/update the reticle.

Current behavior must be preserved:

- grounded player hides the reticle
- cleared stage hides the reticle
- dead player hides the reticle
- attacking player hides the reticle
- hurting player hides the reticle
- active Homing Attack hides the reticle
- otherwise the scene may search for a target and show the reticle if a target exists

## Files Expected To Change

- `src/domain/player/homingRules.ts`
- `src/domain/player/homingRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Boundary

Domain owns only the pure visibility eligibility decision.

Phaser scene keeps:

- `findHomingTarget()`
- reticle image creation
- reticle position, visibility, angle, blend mode, and depth
- the no-target hide branch

## TDD Plan

1. Add a failing domain test for `canShowHomingReticle`.
2. Implement the minimal pure function.
3. Replace only the first guard in `GameplayScene.updateHomingReticle`.
4. Verify the full test/check/build gates.

## Acceptance Criteria

- Domain function imports no Phaser, Svelte, DOM, or browser APIs.
- Each guard input is necessary and tested independently.
- No Homing target selection, sorting, range, reticle rendering, or Homing Attack movement logic changes in this slice.
