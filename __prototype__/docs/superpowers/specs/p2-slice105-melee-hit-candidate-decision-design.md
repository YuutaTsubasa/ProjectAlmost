# P2 Slice 105: Melee Hit Candidate Decision

## Target Behavior

Move the melee hit candidate decision out of `GameplayScene.tryAttack()` and into player attack domain rules.

Current behavior to preserve:

- defeated enemies are not melee hit candidates
- enemies whose bounds do not intersect the melee hitbox are not melee hit candidates
- enemies are melee hit candidates only when they are not defeated and intersect the melee hitbox

## Boundary

Domain owns only the pure candidate decision.

Phaser scene keeps all side effects and adapter work:

- creating and destroying the hitbox image
- reading enemy sprite bounds
- calculating rectangle intersection with Phaser
- defeating the enemy sprite

## Files Expected To Change

- `src/domain/player/attackRules.ts`
- `src/domain/player/attackRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Risks

This slice must not change melee hitbox geometry, timing, SFX, animation, or enemy defeat behavior. It only replaces:

```ts
!enemy.defeated && Phaser.Geom.Intersects.RectangleToRectangle(...)
```

with a pure domain predicate that receives the Phaser-computed intersection result.

## TDD Plan

1. Add tests for `isMeleeHitCandidate()`.
2. Run the focused attack domain test and confirm RED because the function is missing.
3. Add the minimal pure function to `attackRules.ts`.
4. Replace the scene `find()` predicate with the new function.
5. Run focused test, full test, type check, whitespace check, and build.

## Validation Plan

- `npm run test -- src/domain/player/attackRules.test.ts`
- `npm run test`
- `npm run check`
- `git diff --check`
- `npm run build`
