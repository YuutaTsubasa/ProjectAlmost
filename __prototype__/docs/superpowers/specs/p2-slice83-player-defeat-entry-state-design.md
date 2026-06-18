# P2 Slice 83: Player Defeat Entry State Rule

## Target Behavior

When `GameplayScene.defeatPlayer()` accepts a defeat, it currently enters a fixed player defeat state:

- `dead: true`
- `hurting: false`
- `invulnerable: true`
- `attacking: false`
- `homingAttacking: false`
- `crouching: false`
- `attackReady: false`

Preserve that behavior by moving the pure defeat entry state into `src/domain/player/hurtRules.ts`.

## Boundaries

Domain owns only the defeat entry state values.

Phaser scene still owns all side effects:

- death SFX
- fall count from `getPlayerDefeatOutcome()`
- crouch body reset through `setCrouching(false)`
- Homing target and reticle clearing
- boss projectile cleanup
- hurt blink cleanup
- collision changes
- player velocity, animation, status, camera, and respawn timing

## TDD Plan

1. Add `getPlayerDefeatEntryState()` tests in `src/domain/player/hurtRules.test.ts`.
2. Run the focused hurt test and verify it fails because the function is missing.
3. Implement `getPlayerDefeatEntryState()` in `src/domain/player/hurtRules.ts`.
4. Wire `GameplayScene.defeatPlayer()` to apply the domain state.
5. Run focused tests, full tests, `npm run check`, `git diff --check`, and `npm run build`.

## Definition Of Done

- `getPlayerDefeatEntryState()` is pure and does not import game, Phaser, Svelte, DOM, or browser APIs.
- Tests cover the full state shape and fresh object behavior.
- `GameplayScene.defeatPlayer()` no longer hard-codes those defeat entry boolean values inline.
- No behavior changes to defeat outcome, boss cleanup, crouch body reset, Homing cleanup, animation, velocity, or respawn timing.
