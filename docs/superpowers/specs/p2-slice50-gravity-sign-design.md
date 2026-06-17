# P2 Slice 50: Vertical Gravity Sign

## Target Behavior

Move the vertical gravity sign rule out of `GameplayScene` and into the pure world domain.

The Phaser scene still owns player physics, gravity zones, velocity application, and animation side effects. The domain receives the current vertical gravity direction and returns the numeric sign used by scene velocity formulas.

## Domain Rule

`getVerticalGravitySign(input)` returns:

- `1` when `direction === 'down'`.
- `-1` when `direction === 'up'`.

The domain type is a local `'down' | 'up'` union so the world domain does not import stage data or scene types.

## Files Expected To Change

- `src/domain/world/gravityRules.ts`
- `src/domain/world/gravityRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Risks

- Do not change jump, knockback, death bounce, or Homing Attack bounce velocity values.
- Do not change out-of-bounds, gravity-zone detection, or moving platform logic.
- Keep `GameplayScene` as the adapter that reads `playerGravityDirection` and applies the returned sign to Phaser velocity calls.

## Validation Plan

1. Add domain tests first and verify the missing function fails.
2. Implement the minimal pure function.
3. Wire `GameplayScene.gravitySign` to call the domain rule.
4. Run the focused world domain test, full test suite, `npm run check`, `npm run build`, and `git diff --check`.
