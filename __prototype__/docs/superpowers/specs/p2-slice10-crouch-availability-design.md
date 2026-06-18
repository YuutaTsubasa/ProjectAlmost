# Crouch Availability Design Spec

## Purpose

Extract player crouch availability from `GameplayScene.ts` into a pure player domain rule.

This is P2 Slice 10 of the `GameplayScene` domain extraction effort. The slice keeps body size, body offset, animation, and visual Y offset side effects inside `GameplayScene.setCrouching()`, while moving the question "may the player enter crouch now?" into `src/domain/player/`.

## Problem

`GameplayScene.update()` currently embeds the crouch availability rule:

```ts
crouchHeld && grounded && !this.isAttacking && !this.isHurting
```

This rule is pure player-state logic. Keeping it in the scene makes it harder to test and easier to drift when jump, attack, or hurt state behavior changes.

## Design

Add `src/domain/player/crouchRules.ts`:

```ts
export function canCrouch(input: {
  crouchHeld: boolean
  grounded: boolean
  attacking: boolean
  hurting: boolean
}): boolean
```

Behavior:

- crouch input must be held.
- player must be grounded.
- player must not be attacking.
- player must not be hurting.

`GameplayScene.update()` calls `canCrouch()` and passes the result to `setCrouching()`.

## Non-Goals

This slice does not:

- change `setCrouching()` body size, body offset, animation, or visual Y offset.
- change forced crouch resets from jump, gravity changes, respawn, or death.
- change projectile crouch-block behavior.
- introduce a broader player-state machine.

## Tests

Add tests to `src/domain/player/crouchRules.test.ts`:

- all required conditions true returns `true`.
- missing crouch input returns `false`.
- airborne player returns `false`.
- attacking player returns `false`.
- hurting player returns `false`.

## Verification

Required checks:

```bash
npm run test
npm run check
npm run build
git diff --check
```
