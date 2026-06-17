# P2 Slice 51: Player Grounded Contact

## Target Behavior

Move the player grounded contact decision out of `GameplayScene` and into the pure player domain.

The Phaser scene still owns Arcade Physics bodies and reads `blocked` / `touching` contact flags. The domain receives the current vertical gravity direction plus contact booleans and decides whether the player is grounded.

## Domain Rule

`isPlayerGroundedByContact(input)` returns:

- For `direction === 'down'`, true when the down side is blocked or touching.
- For `direction === 'up'`, true when the up side is blocked or touching.

The rule deliberately ignores the opposite side. The domain does not import Phaser, Svelte, DOM APIs, or game scene types.

## Files Expected To Change

- `src/domain/player/groundRules.ts`
- `src/domain/player/groundRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Risks

- Do not change coyote time, jump buffering, or remaining air jump behavior.
- Do not change gravity-zone switching or vertical velocity formulas.
- Keep `GameplayScene` as the adapter that reads Phaser body flags and passes plain booleans into the domain.

## Validation Plan

1. Add domain tests first and verify the missing function fails.
2. Implement the minimal pure function.
3. Wire `GameplayScene.isPlayerGrounded()` to call the domain rule.
4. Run the focused player domain test, full test suite, `npm run check`, `npm run build`, and `git diff --check`.
