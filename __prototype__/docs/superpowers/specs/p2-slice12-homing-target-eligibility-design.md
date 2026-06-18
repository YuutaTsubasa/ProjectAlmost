# Homing Target Eligibility Design Spec

## Purpose

Extract the single-target Homing Attack eligibility predicate from `GameplayScene.ts` into pure player domain rules.

This is P2 Slice 12 of the `GameplayScene` domain extraction effort. The slice keeps Phaser distance calculation, enemy sprite filtering, sorting, nearest-target selection, boss reset behavior, and Homing Attack resolution inside `GameplayScene`, while moving the per-target eligibility predicate into `src/domain/player/homingRules.ts`.

## Problem

`GameplayScene.findHomingTarget()` currently embeds this predicate:

```ts
const targetDirection = Math.sign(sprite.x - this.player.x) || facing
return distance <= 360 && (targetDirection === facing || Math.abs(sprite.x - this.player.x) <= 48)
```

This rule is pure target eligibility logic:

- target distance must be within Homing Attack range.
- targets in the facing direction are eligible.
- targets behind the player are eligible only within a small reverse tolerance.
- targets with the same X coordinate are treated as being in the facing direction.

The distance is a precomputed Euclidean distance from Phaser; X direction is evaluated separately.

## Design

Add to `src/domain/player/homingRules.ts`:

```ts
export const HOMING_ATTACK_RANGE = 360
export const HOMING_TARGET_REVERSE_TOLERANCE_X = 48

export function isHomingTargetEligible(input: {
  playerX: number
  targetX: number
  facing: -1 | 1
  distance: number
  range?: number
  reverseToleranceX?: number
}): boolean
```

Behavior:

- if `distance > range`, return `false`.
- compute target direction with `Math.sign(targetX - playerX) || facing`.
- return `true` when target direction matches facing.
- otherwise return `true` only when `Math.abs(targetX - playerX) <= reverseToleranceX`.

`GameplayScene.findHomingTarget()` calls this predicate inside the existing `.filter()` and keeps the rest of the target selection pipeline unchanged.

## Non-Goals

This slice does not:

- change Homing Attack range or reverse tolerance values.
- move Phaser distance calculation into the domain.
- change defeated, active, or visible enemy filtering.
- change target sorting or nearest-target selection.
- change Homing Attack resolution, dash, reticle, boss reset, or side effects.

## Tests

Add tests to `src/domain/player/homingRules.test.ts`:

- default Homing Attack range is `360`.
- default reverse tolerance is `48`.
- distance equal to range is eligible when facing the target.
- distance above range is not eligible.
- target in facing direction and in range is eligible.
- target behind the player beyond tolerance is not eligible.
- target behind the player at tolerance boundary is eligible.
- target behind the player just outside tolerance is not eligible.
- target with the same X coordinate is eligible in range.
- explicit range and reverse tolerance overrides work for boundary checks.

## Verification

Required checks:

```bash
npm run test
npm run check
npm run build
git diff --check
```
