# Jump Availability Design Spec

## Purpose

Extract player jump availability and buffered-jump selection from `GameplayScene.ts` into a pure player domain rule.

This is P2 Slice 9 of the `GameplayScene` domain extraction effort. The slice keeps Phaser velocity, animation, crouch state, sound, and runtime counter mutations inside `GameplayScene`, while moving the decision between no jump, ground jump, and air jump into `src/domain/player/`.

## Problem

`GameplayScene.update()` currently embeds the jump availability rule:

- a jump only fires while the jump buffer is still active.
- grounded players can ground-jump.
- airborne players inside the coyote window can ground-jump.
- airborne players outside the coyote window can air-jump if they have remaining air jumps.
- otherwise no jump fires.

This rule directly affects movement feel and should be covered by focused tests before future coyote, jump buffer, and double-jump changes.

## Design

Add `src/domain/player/jumpRules.ts`:

```ts
export const COYOTE_TIME_MS = 120

export type JumpDecision =
  | { type: 'none' }
  | { type: 'ground-jump' }
  | { type: 'air-jump' }

export function getJumpDecision(input: {
  now: number
  grounded: boolean
  lastGroundedAt: number
  jumpBufferedUntil: number
  remainingAirJumps: number
  coyoteTimeMs?: number
}): JumpDecision
```

Behavior:

- if `jumpBufferedUntil < now`, return `none`.
- if grounded or `now - lastGroundedAt <= coyoteTimeMs`, return `ground-jump`.
- if `remainingAirJumps > 0`, return `air-jump`.
- otherwise return `none`.

`GameplayScene` calls this rule and keeps the existing side-effect split:

- both jump types set timer, clear crouch, set vertical velocity, clear buffer, reset last grounded time, play armor step, and update footstep cooldown.
- only `air-jump` clears attack state, resets player visual state, plays `player-jump`, and decrements `remainingAirJumps`.

`COYOTE_TIME_MS` should become a single source of truth imported from the domain module.

## Non-Goals

This slice does not:

- change coyote time, jump buffer time, jump velocity, gravity sign, or air-jump count.
- move jump buffer writes into the domain.
- move Phaser velocity, animation, sound, or visual state changes into the domain.
- change when `remainingAirJumps` refreshes.

## Tests

Add tests to `src/domain/player/jumpRules.test.ts`:

- default coyote time is `120`.
- unbuffered jump returns `none`, even while grounded.
- exact buffer boundary `jumpBufferedUntil === now` can jump.
- buffered grounded jump returns `ground-jump`.
- buffered coyote boundary `now - lastGroundedAt === 120` returns `ground-jump`.
- just outside coyote with remaining air jumps returns `air-jump`.
- just outside coyote with no remaining air jumps returns `none`.
- explicit coyote time can override the default for boundary checks.

## Verification

Required checks:

```bash
npm run test
npm run check
npm run build
git diff --check
```
