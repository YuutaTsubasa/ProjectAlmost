# P2 Slice 99: Enemy Patrol Update Eligibility

## Target Behavior

Move the scene-local guard clauses that decide whether an enemy should run patrol updates into the enemy domain layer.

Current behavior to preserve:

- defeated enemies do not update patrol
- Azure Cores do not update patrol
- guard enemies update patrol
- enemies without an explicit type behave as guards and update patrol

## Boundary

Domain owns only the pure eligibility decision.

Phaser scene keeps all side effects:

- reading sprite position
- calculating next patrol direction from current sprite position
- setting velocity
- setting flip direction
- all animation/body handling

## Files Expected To Change

- `src/domain/enemy/enemyRules.ts`
- `src/domain/enemy/enemyRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Risks

This slice must not change patrol movement behavior. It only replaces two scene guard clauses with one domain predicate.

Do not touch:

- patrol speed
- patrol direction rule
- initial patrol direction
- enemy respawn behavior
- Azure Core regeneration or score rules

## TDD Plan

1. Add tests for `shouldUpdateEnemyPatrol()`.
2. Run the focused enemy domain test and confirm RED because the function is missing.
3. Add the minimal pure function to `enemyRules.ts`.
4. Replace the scene guard clauses with the new function.
5. Run focused test, full test, type check, whitespace check, and build.

## Validation Plan

- `npm run test -- src/domain/enemy/enemyRules.test.ts`
- `npm run test`
- `npm run check`
- `git diff --check`
- `npm run build`
