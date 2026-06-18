# P2 Slice 32: Player Coin Scan Availability

## Target Behavior

Extract the pure guard from `GameplayScene.updateCoins()`.

Current behavior must be preserved:

- do not scan collectible coins after stage clear
- do not scan collectible coins while the player is dead
- otherwise the scene may read player position and collect eligible coins

## Files Expected To Change

- `src/domain/player/coinPickupRules.ts`
- `src/domain/player/coinPickupRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Boundary

Domain owns only the pure boolean decision.

Phaser scene keeps:

- reading player center from Phaser
- iterating coin sprites
- skipping already-collected coins
- calling `collectCoin`
- all SFX, tween, HUD, and mutation side effects

## TDD Plan

1. Add a failing domain test for `shouldScanPlayerCoins`.
2. Implement the minimal pure function.
3. Replace only the guard in `GameplayScene.updateCoins`.
4. Verify the full test/check/build gates.

## Acceptance Criteria

- Domain function imports no Phaser, Svelte, DOM, or browser APIs.
- Preserve exact guard semantics: `!stageCleared && !dead`.
- No pickup radius, coin collection, tween, or HUD behavior changes in this slice.
