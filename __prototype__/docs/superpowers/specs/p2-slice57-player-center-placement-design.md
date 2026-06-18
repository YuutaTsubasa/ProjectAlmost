# P2 Slice 57: Player Center Placement

## Target Behavior

Move player center placement for vertical gravity out of `GameplayScene` and into the pure placement domain.

The Phaser scene still owns sprite creation, spawn calls, checkpoint respawn, and runtime gravity direction. The domain receives a platform surface Y plus gravity direction and returns the player center Y.

## Domain Rule

`getPlayerCenterY(input)` returns:

- `surfaceY - objectDefinitions.player.centerAboveSurface` for `gravity === 'down'`.
- `surfaceY + objectDefinitions.player.centerAboveSurface` for `gravity === 'up'`.

This preserves the existing scene helper behavior while keeping object placement contracts in `domain/placement`.

## Files Expected To Change

- `src/domain/placement/objectDefinitions.ts`
- `src/domain/placement/objectDefinitions.test.ts`
- `src/game/objects/objectDefinitions.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Risks

- Do not change player body definition, spawn coordinates, checkpoint respawn behavior, or gravity switching.
- Do not move Phaser sprite creation into domain.
- Keep `GameplayScene` as the adapter that passes selected stage or checkpoint spawn data into the pure rule.

## Validation Plan

1. Add domain tests first and verify the missing function fails.
2. Implement the minimal pure function in placement domain and re-export it through the existing game object barrel.
3. Replace the local `GameplayScene` helper with the domain rule.
4. Run the focused placement domain test, full test suite, `npm run check`, `npm run build`, and `git diff --check`.
