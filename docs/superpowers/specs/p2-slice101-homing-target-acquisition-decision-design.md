# P2 Slice 101: Homing Target Acquisition Decision

## Target Behavior

Move the target-existence decision in `GameplayScene.tryHomingAttack()` into the Homing Attack domain rules.

Current behavior to preserve:

- Homing Attack startup fails when no target is found
- Homing Attack startup continues when a target is found

## Boundary

Domain owns only the pure decision based on whether a target exists.

Phaser scene keeps all side effects and object work:

- finding the actual target sprite
- setting attack state
- hiding the reticle
- changing animation/frame
- resolving Homing Attack movement, trail, coin collection, enemy defeat, and boss reset

The domain must receive a plain `hasTarget` boolean so it does not know about Phaser sprites.

## Files Expected To Change

- `src/domain/player/homingRules.ts`
- `src/domain/player/homingRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Risks

This slice must not change target selection, target priority, Homing Attack range, or any Homing Attack side effects. It only replaces:

```ts
if (!target) return false
```

with a domain decision.

## TDD Plan

1. Add tests for `getHomingTargetAcquisitionDecision()`.
2. Run the focused Homing domain test and confirm RED because the function is missing.
3. Add the minimal pure function to `homingRules.ts`.
4. Replace the scene target-existence guard with the new function.
5. Run focused test, full test, type check, whitespace check, and build.

## Validation Plan

- `npm run test -- src/domain/player/homingRules.test.ts`
- `npm run test`
- `npm run check`
- `git diff --check`
- `npm run build`
