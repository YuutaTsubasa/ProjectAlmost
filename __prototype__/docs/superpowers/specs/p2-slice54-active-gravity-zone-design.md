# P2 Slice 54: Active Gravity Zone

## Target Behavior

Move gravity-zone point containment and active-zone selection out of `GameplayScene` and into the pure world domain.

The Phaser scene still owns player coordinates, death/clear guards, and the `applyPlayerGravityDirection` side effect. The domain receives a point and structural gravity zones, then returns the first zone containing the point.

## Domain Rule

`findActiveGravityZone(input)` returns:

- The first zone where `pointX` is between `x` and `x + width`, inclusive.
- And `pointY` is between `y` and `y + height`, inclusive.
- `undefined` when no zone contains the point.

Inclusive edges preserve the current scene behavior.

## Files Expected To Change

- `src/domain/world/gravityRules.ts`
- `src/domain/world/gravityRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Risks

- Do not change death/stage-clear guards.
- Do not change gravity direction application or preserve-velocity behavior.
- Do not import stage data or Phaser types into the domain.
- Preserve first-match semantics for overlapping zones.

## Validation Plan

1. Add domain tests first and verify the missing function fails.
2. Implement the minimal pure function.
3. Replace the inline `gravityZones.find(...)` containment expression in `GameplayScene`.
4. Run the focused world domain test, full test suite, `npm run check`, `npm run build`, and `git diff --check`.
