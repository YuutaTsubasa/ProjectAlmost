# Homing Nearest Target Selection Design Spec

## Purpose

Extract nearest eligible Homing target selection from `GameplayScene.ts` into pure player domain rules.

This is P2 Slice 13 of the `GameplayScene` domain extraction effort. The slice keeps Phaser sprite filtering, distance calculation, and sprite return values inside `GameplayScene`, while moving selection among plain target candidates into `src/domain/player/homingRules.ts`.

## Problem

`GameplayScene.findHomingTarget()` currently builds target candidates, filters each candidate with Homing eligibility, sorts by distance, and returns the nearest sprite:

```ts
.filter(...)
.sort((a, b) => a.distance - b.distance)[0]?.sprite
```

The sorting and selection are pure once candidates are plain data. Keeping this in the scene makes it harder to test nearest-target behavior independently from Phaser objects.

## Design

Add to `src/domain/player/homingRules.ts`:

```ts
export type HomingTargetCandidate<T> = {
  target: T
  targetX: number
  distance: number
}

export function selectNearestHomingTarget<T>(input: {
  playerX: number
  facing: -1 | 1
  candidates: HomingTargetCandidate<T>[]
}): T | undefined
```

Behavior:

- filter candidates through `isHomingTargetEligible()`.
- return the target with the smallest `distance`.
- return `undefined` when no candidate is eligible.
- preserve existing sort tie behavior by keeping the first candidate when distances are equal.

`GameplayScene.findHomingTarget()` still:

- filters defeated/inactive/invisible enemies.
- computes `distance` with Phaser.
- provides the sprite as the generic target payload.
- returns the selected sprite.

## Non-Goals

This slice does not:

- move Phaser distance calculation into the domain.
- change defeated, active, or visible enemy filtering.
- change Homing Attack range or reverse tolerance values.
- change Homing Attack resolution, boss reset, reticle behavior, or side effects.
- add target prioritization beyond nearest distance.

## Tests

Add tests to `src/domain/player/homingRules.test.ts`:

- returns `undefined` for an empty candidate list.
- returns `undefined` when all candidates are ineligible.
- returns the only eligible target.
- returns the nearest eligible target when multiple are eligible.
- ignores closer ineligible targets.
- keeps the first eligible target when distances tie.

## Verification

Required checks:

```bash
npm run test
npm run check
npm run build
git diff --check
```
