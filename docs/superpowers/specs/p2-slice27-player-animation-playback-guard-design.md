# P2 Slice 27: Player Animation Playback Guard

## Target Behavior

Extract the pure playback guard from `GameplayScene.playPlayerAnimation(key, respectAttackLock)`.

The rule answers whether the scene should call `player.play(key)`.

Current behavior must be preserved:

- when `respectAttackLock` is true and the player is attacking, do not play
- when `respectAttackLock` is true and the player is hurting, do not play
- otherwise play if the current animation key differs from the requested key
- otherwise play if the current texture key differs from the requested key
- otherwise skip playback

## Files Expected To Change

- `src/domain/player/animationRules.ts`
- `src/domain/player/animationRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Boundary

Domain owns only the pure boolean decision.

Phaser scene keeps:

- reading `this.player.anims.currentAnim?.key`
- reading `this.player.texture.key`
- calling `this.player.play(key)`

## TDD Plan

1. Add a failing domain test for `shouldPlayPlayerAnimation`.
2. Implement the minimal pure function.
3. Replace only the guard inside `GameplayScene.playPlayerAnimation`.
4. Verify the full test/check/build gates.

## Acceptance Criteria

- Domain function imports no Phaser, Svelte, DOM, or browser APIs.
- Preserve the attack/hurt lock behavior only when `respectAttackLock` is true.
- Preserve the duplicate-play behavior exactly: play when either current animation key or current texture key differs.
