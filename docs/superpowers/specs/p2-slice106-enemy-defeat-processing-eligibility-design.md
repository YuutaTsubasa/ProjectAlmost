# P2 Slice 106: Enemy Defeat Processing Eligibility

## Target Behavior

Move the first guard in `GameplayScene.defeatEnemy()` into the enemy domain rules.

Current behavior to preserve:

- do not process enemy defeat when no runtime enemy was found for the sprite
- do not process enemy defeat when the enemy is already defeated
- process enemy defeat only when a runtime enemy exists and is not defeated

## Boundary

Domain owns only the pure eligibility decision.

Phaser scene keeps all side effects and adapter work:

- resolving a sprite to an enemy runtime object
- boss prototype handling
- score updates
- sound effects
- sprite velocity/body/animation/tween changes
- status messages and regeneration scheduling

## Files Expected To Change

- `src/domain/enemy/enemyRules.ts`
- `src/domain/enemy/enemyRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Risks

This slice must not change enemy defeat behavior. It only replaces:

```ts
if (!enemy || enemy.defeated) return
```

with a pure domain predicate. The boss branch remains in the Phaser scene.

## TDD Plan

1. Add tests for `shouldProcessEnemyDefeat()`.
2. Run the focused enemy domain test and confirm RED because the function is missing.
3. Add the minimal pure function to `enemyRules.ts`.
4. Replace the scene guard with the new function.
5. Run focused test, full test, type check, whitespace check, and build.

## Validation Plan

- `npm run test -- src/domain/enemy/enemyRules.test.ts`
- `npm run test`
- `npm run check`
- `git diff --check`
- `npm run build`
