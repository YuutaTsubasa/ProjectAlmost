# Homing Attack Availability Design Spec

## Purpose

Extract Homing Attack start availability from `GameplayScene.ts` into a pure player domain rule.

This is P2 Slice 11 of the `GameplayScene` domain extraction effort. The slice keeps target selection, Homing Attack state mutation, animation, texture changes, reticle visibility, and movement resolution inside `GameplayScene`, while moving the first-layer player-state guard into `src/domain/player/`.

## Problem

`GameplayScene.tryHomingAttack()` currently embeds the Homing Attack availability guard:

```ts
!this.attackReady || this.isHurting || this.isHomingAttacking || this.isDead
```

This rule is pure player-state logic and differs from the melee attack guard, which does not check `isDead`. Keeping the Homing guard embedded in the scene makes it easier to accidentally drift or conflate with melee attack behavior.

## Design

Add `src/domain/player/homingRules.ts`:

```ts
export function canStartHomingAttack(input: {
  attackReady: boolean
  hurting: boolean
  homingAttacking: boolean
  dead: boolean
}): boolean
```

Behavior:

- attack must be ready.
- player must not be hurting.
- player must not already be homing attacking.
- player must not be dead.

`GameplayScene.tryHomingAttack()` calls `canStartHomingAttack()` for only the Homing guard.

## Non-Goals

This slice does not:

- change melee attack availability.
- change `findHomingTarget()`.
- change target distance, facing, sorting, boss reset behavior, or Homing Attack resolution.
- change any Homing Attack side effects after the availability guard.

## Tests

Add tests to `src/domain/player/homingRules.test.ts`:

- all required conditions satisfied returns `true`.
- `attackReady: false` returns `false`.
- `hurting: true` returns `false`.
- `homingAttacking: true` returns `false`.
- `dead: true` returns `false`.

## Verification

Required checks:

```bash
npm run test
npm run check
npm run build
git diff --check
```
