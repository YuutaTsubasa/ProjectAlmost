# P2 Slice 103: Enemy Freeze Update Eligibility

## Target Behavior

Move the enemy runtime eligibility guard in `GameplayScene.setEnemiesFrozen()` into the enemy domain rules.

Current behavior to preserve:

- defeated enemies are skipped when freezing or unfreezing enemies
- inactive enemy sprites are skipped when freezing or unfreezing enemies
- an enemy is updated only when it is not defeated and its sprite is active

## Boundary

Domain owns only the pure eligibility decision.

Phaser scene keeps all side effects and adapter work:

- reading sprite state
- setting velocity and acceleration
- setting gravity
- pausing and resuming animation
- restoring patrol velocity

## Files Expected To Change

- `src/domain/enemy/enemyRules.ts`
- `src/domain/enemy/enemyRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Risks

This slice must not change freeze behavior. It only replaces:

```ts
if (enemy.defeated || !enemy.sprite.active) continue
```

with a domain predicate.

## TDD Plan

1. Add tests for `shouldUpdateEnemyFreezeState()`.
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
