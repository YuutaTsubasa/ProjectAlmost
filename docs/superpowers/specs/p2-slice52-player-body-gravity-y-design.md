# P2 Slice 52: Player Body Gravity Y

## Target Behavior

Move the player body gravity Y calculation out of `GameplayScene` and into the pure world domain.

The Phaser scene still owns Arcade Physics bodies, `allowGravity`, collision toggles, and `setGravityY` side effects. The domain receives the current vertical gravity direction and world gravity value, then returns the numeric body gravity Y that should be applied to the player body.

## Domain Rule

`getPlayerBodyGravityY(input)` returns:

- `0` when `direction === 'down'`.
- `-worldGravityY * 2` when `direction === 'up'`.

This preserves the current behavior where upward gravity is simulated by applying twice the negative world gravity to the player body.

## Files Expected To Change

- `src/domain/world/gravityRules.ts`
- `src/domain/world/gravityRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Risks

- Do not change `WORLD_GRAVITY_Y`, velocity formulas, Homing Attack collision behavior, or gravity-zone switching.
- Do not move Phaser body calls into domain.
- Keep `GameplayScene` as the adapter that passes the selected direction and world gravity into the pure rule.

## Validation Plan

1. Add domain tests first and verify the missing function fails.
2. Implement the minimal pure function.
3. Replace the two inline body gravity expressions in `GameplayScene`.
4. Run the focused world domain test, full test suite, `npm run check`, `npm run build`, and `git diff --check`.
