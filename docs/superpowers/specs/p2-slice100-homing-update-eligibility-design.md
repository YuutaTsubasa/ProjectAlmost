# P2 Slice 100: Homing Attack Update Eligibility

## Target Behavior

Move the first guard in `GameplayScene.updateHomingAttack()` into the Homing Attack domain rules.

Current behavior to preserve:

- do not update Homing Attack when the player is not in Homing Attack state
- do not update Homing Attack when no Homing target exists
- update Homing Attack only when both Homing Attack state and target are present

## Boundary

Domain owns only the pure eligibility decision.

Phaser scene keeps all side effects and object reads:

- target lost checks against sprite state
- finishing Homing Attack
- player movement and collision changes
- Homing trail, coin collection, enemy defeat, and boss reset behavior

## Files Expected To Change

- `src/domain/player/homingRules.ts`
- `src/domain/player/homingRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Risks

This must not change Homing Attack behavior. It only replaces this scene guard:

```ts
if (!this.isHomingAttacking || !this.homingTarget) return
```

The scene should pass a plain `hasTarget` boolean so the domain does not know about Phaser sprites.

## TDD Plan

1. Add tests for `shouldUpdateHomingAttack()`.
2. Run the focused Homing domain test and confirm RED because the function is missing.
3. Add the minimal pure function to `homingRules.ts`.
4. Replace the scene guard with the new function.
5. Run focused test, full test, type check, whitespace check, and build.

## Validation Plan

- `npm run test -- src/domain/player/homingRules.test.ts`
- `npm run test`
- `npm run check`
- `git diff --check`
- `npm run build`
