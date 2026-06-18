# P2 Slice 55: Active Surface Zone

## Target Behavior

Move surface-zone point containment and typed active-zone selection out of `GameplayScene` and into the pure world domain.

The Phaser scene still owns player coordinates and gameplay decisions such as applying ice movement. The domain receives a point, a desired surface type, and structural surface zones, then returns the first matching zone containing the point.

## Domain Rule

`findActiveSurfaceZone(input)` returns:

- The first zone where `type` matches `surfaceType`.
- And `pointX` is between `x` and `x + width`, inclusive.
- And `pointY` is between `y` and `y + height`, inclusive.
- `undefined` when no matching zone contains the point.

Inclusive edges and first-match semantics preserve the current scene behavior.

## Files Expected To Change

- `src/domain/world/surfaceRules.ts`
- `src/domain/world/surfaceRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Risks

- Do not change movement, ice acceleration, or grounded checks.
- Do not import stage data or Phaser types into the domain.
- Keep `GameplayScene` as the adapter that passes player coordinates and selected stage surface zones into the pure rule.

## Validation Plan

1. Add domain tests first and verify the missing function fails.
2. Implement the minimal pure function.
3. Replace the inline `surfaceZones.find(...)` containment expression in `GameplayScene`.
4. Run the focused world domain test, full test suite, `npm run check`, `npm run build`, and `git diff --check`.
