# P2 Slice 76: Player Hurt Entry State Rule

## Target Behavior

When the player survives a damage hit, gameplay enters a short hurt state with a fixed set of boolean flags:

- `hurting: true`
- `invulnerable: true`
- `attacking: false`
- `homingAttacking: false`
- `crouching: false`
- `attackReady: false`

This preserves the current `GameplayScene.applyPlayerHit()` behavior while moving the pure state transition into `src/domain/player/hurtRules.ts`.

## Boundaries

Domain owns only the pure state values for the survived-hit entry state.

Phaser scene still owns all side effects:

- clearing `homingTarget`
- restoring Homing Attack collision
- visual state and animation
- hurt blink/tween
- knockback velocity
- hit SFX and HUD updates
- recovery timers

## TDD Plan

1. Add `getPlayerHurtEntryState()` tests in `src/domain/player/hurtRules.test.ts`.
2. Run the focused test and verify it fails because the function is missing.
3. Implement `PlayerHurtEntryState` and `getPlayerHurtEntryState()` in `src/domain/player/hurtRules.ts`.
4. Wire `GameplayScene.applyPlayerHit()` to read the domain state and assign the same scene fields.
5. Run focused tests, full tests, `npm run check`, `git diff --check`, and `npm run build`.

## Definition Of Done

- `getPlayerHurtEntryState()` is pure and does not import game, Phaser, Svelte, DOM, or browser APIs.
- Tests cover the full state shape and verify a fresh object is returned.
- `GameplayScene.applyPlayerHit()` no longer hard-codes those six hurt-entry boolean values inline.
- No behavior changes to damage, knockback, animation, collision, timers, or invulnerability recovery.
