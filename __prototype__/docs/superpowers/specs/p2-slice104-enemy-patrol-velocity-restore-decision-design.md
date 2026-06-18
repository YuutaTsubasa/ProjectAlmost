# P2 Slice 104: Enemy Patrol Velocity Restore Decision

## Target Behavior

Move the decision for restoring patrol velocity after enemy freeze state changes into the enemy domain rules.

Current behavior to preserve:

- frozen enemies do not restore patrol velocity
- unfrozen patrol enemies restore patrol velocity
- unfrozen non-patrol enemies do not restore patrol velocity

## Boundary

Domain owns only the pure decision.

Phaser scene keeps all side effects and adapter work:

- reading object definition behavior
- resuming animations
- setting velocity
- using the current runtime patrol direction and speed

## Files Expected To Change

- `src/domain/enemy/enemyRules.ts`
- `src/domain/enemy/enemyRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Risks

This slice must not change freeze/unfreeze behavior. It only replaces:

```ts
if (definition.behavior === 'patrol') {
  enemy.sprite.setVelocityX(enemy.direction * 80)
}
```

with a pure domain predicate. The speed value and direction calculation stay in the Phaser scene.

## TDD Plan

1. Add tests for `shouldRestoreEnemyPatrolVelocity()`.
2. Run the focused enemy domain test and confirm RED because the function is missing.
3. Add the minimal pure function to `enemyRules.ts`.
4. Replace the scene `definition.behavior === 'patrol'` guard with the new function.
5. Run focused test, full test, type check, whitespace check, and build.

## Validation Plan

- `npm run test -- src/domain/enemy/enemyRules.test.ts`
- `npm run test`
- `npm run check`
- `git diff --check`
- `npm run build`
