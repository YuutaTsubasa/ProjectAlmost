# P2 Slice 53: Player Gravity Flip Y

## Target Behavior

Move the player vertical flip decision for gravity direction out of `GameplayScene` and into the pure world domain.

The Phaser scene still owns `setFlipY` as a rendering side effect. The domain receives the current vertical gravity direction and returns whether the player sprite should be vertically flipped.

## Domain Rule

`shouldFlipPlayerYForGravity(input)` returns:

- `false` when `direction === 'down'`.
- `true` when `direction === 'up'`.

This preserves the current behavior where upward gravity visually flips the player sprite.

## Files Expected To Change

- `src/domain/world/gravityRules.ts`
- `src/domain/world/gravityRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Risks

- Do not change gravity-zone switching, body gravity, velocity formulas, or animation selection.
- Do not move Phaser `setFlipY` into domain.
- Keep `GameplayScene` as the adapter that applies the pure decision to the Phaser sprite.

## Validation Plan

1. Add domain tests first and verify the missing function fails.
2. Implement the minimal pure function.
3. Replace the inline `direction === 'up'` flip decision in `GameplayScene`.
4. Run the focused world domain test, full test suite, `npm run check`, `npm run build`, and `git diff --check`.
