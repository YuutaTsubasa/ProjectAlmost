# P2 Slice 102: Homing Target Availability

## Target Behavior

Move Homing target candidate availability out of `GameplayScene.findHomingTarget()` and into the Homing domain rules.

Current behavior to preserve:

- defeated enemies are not Homing candidates
- inactive enemy sprites are not Homing candidates
- invisible enemy sprites are not Homing candidates
- an enemy is a Homing candidate only when it is not defeated, active, and visible

## Boundary

Domain owns only the pure availability decision.

Phaser scene keeps all side effects and adapter work:

- reading sprite state
- reading sprite coordinates
- calculating player-to-target distance
- selecting the nearest eligible target

## Files Expected To Change

- `src/domain/player/homingRules.ts`
- `src/domain/player/homingRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Risks

This slice must not change Homing target distance, facing direction, reverse tolerance, or nearest-target selection. It only replaces the candidate filter:

```ts
!enemy.defeated && enemy.sprite.active && enemy.sprite.visible
```

with a domain predicate.

## TDD Plan

1. Add tests for `isHomingTargetAvailable()`.
2. Run the focused Homing domain test and confirm RED because the function is missing.
3. Add the minimal pure function to `homingRules.ts`.
4. Replace the scene filter with the new function.
5. Run focused test, full test, type check, whitespace check, and build.

## Validation Plan

- `npm run test -- src/domain/player/homingRules.test.ts`
- `npm run test`
- `npm run check`
- `git diff --check`
- `npm run build`
