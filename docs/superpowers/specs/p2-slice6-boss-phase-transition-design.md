# Boss Phase Transition Design Spec

## Purpose

Extract the boss hit phase transition from `GameplayScene.ts` into a pure boss domain module.

This is P2 Slice 6 of the `GameplayScene` domain extraction effort. The slice keeps Phaser animation, goal reveal timing, projectile clearing, status messages, player reset, camera flash, and timer side effects inside `GameplayScene`, while moving the hit outcome decision into `src/domain/boss/`.

## Problem

`GameplayScene.hitBossPrototype()` currently owns the core boss state transition:

- boss phases start at `0`.
- a boss hit increments `bossPhase` by `1`.
- when the incremented phase is greater than or equal to `4`, the boss is defeated and the goal opens.
- otherwise, the boss is hurt and the next pattern phase starts after the existing delay.

This is pure domain behavior. Keeping it embedded in the scene makes the boss phase count and off-by-one behavior harder to test.

## Design

Add `src/domain/boss/bossRules.ts`:

```ts
export const BOSS_PHASE_COUNT = 4

export type BossHitOutcome =
  | { type: 'advance-phase'; nextPhase: number }
  | { type: 'defeated'; nextPhase: number }

export function getBossHitOutcome(input: {
  currentPhase: number
  phaseCount?: number
}): BossHitOutcome
```

Behavior:

- `nextPhase` is `currentPhase + 1`.
- if `nextPhase >= phaseCount`, return `{ type: 'defeated', nextPhase }`.
- otherwise return `{ type: 'advance-phase', nextPhase }`.
- default `phaseCount` is `BOSS_PHASE_COUNT`.

`GameplayScene.hitBossPrototype()` computes the outcome before mutating `this.bossPhase`, then assigns `this.bossPhase = outcome.nextPhase` where the old increment happened. The following `dispatchHudState()` therefore observes the same phase value as before.

`BOSS_PHASE_COUNT` should become a single source of truth imported from the domain module.

## Non-Goals

This slice does not:

- change boss projectile patterns or timing.
- change boss animations.
- change goal reveal delay or behavior.
- change player health reset, player position reset, camera flash, or homing cleanup.
- change other boss phase condition sites beyond using the imported constant.

## Tests

Add tests to `src/domain/boss/bossRules.test.ts`:

- `BOSS_PHASE_COUNT` is `4`.
- current phases `0`, `1`, and `2` advance to phases `1`, `2`, and `3`.
- current phase `3` is defeated with next phase `4`.
- explicit `phaseCount` can override the default for boundary checks.

## Verification

Required checks:

```bash
npm run test
npm run check
npm run build
git diff --check
```
