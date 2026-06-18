# P2 Slice 19: Movement Footstep SFX Rule

## Target Behavior

Move the movement footstep timing decision out of `GameplayScene` and into a pure player-domain rule.

Current behavior must be preserved:

- Landing on the ground after being airborne triggers `armor-step`.
- Landing sets the next footstep time to `now + 180`.
- Running on ground triggers `armor-step` when:
  - player is grounded,
  - movement input is active,
  - absolute horizontal velocity is greater than `80`,
  - `now >= nextFootstepAt`.
- Running sets the next footstep time to `now + 270`.
- The original two independent `if` statements are preserved with mutation order: if landing and running input both happen in one frame, the landing branch first sets the next footstep time to `now + 180`, so the running branch does not immediately fire.
- `wasGrounded` is always updated to the current `grounded` value.

## Domain API

Extend `src/domain/player/movementRules.ts`:

```ts
export const LANDING_FOOTSTEP_DELAY_MS = 180
export const RUNNING_FOOTSTEP_INTERVAL_MS = 270
export const RUNNING_FOOTSTEP_MIN_SPEED_X = 80

export type MovementFootstepDecision = {
  playSfx: boolean
  nextFootstepAt: number
  wasGrounded: boolean
}

export function getMovementFootstepDecision(input: {
  now: number
  grounded: boolean
  wasGrounded: boolean
  moving: boolean
  velocityX: number
  nextFootstepAt: number
}): MovementFootstepDecision
```

## Ownership Boundary

Domain owns:

- Footstep timing and threshold constants.
- Landing/running footstep decision, including the original mutation order.
- The next `wasGrounded` value.

`GameplayScene` keeps:

- Reading Phaser velocity and time.
- Dispatching `projectrun:sfx`.
- Writing `this.nextFootstepAt` and `this.wasGrounded`.

## Validation Plan

- Add failing tests before implementation.
- Verify tests fail because the new constants/function do not exist.
- Implement the pure decision rule.
- Replace only `updateMovementSfx()` condition logic.
- Run `npm run test -- src/domain/player/movementRules.test.ts`, `npm run test`, `npm run check`, `git diff --check`, and `npm run build`.

## Out Of Scope

- Do not change jump, attack, Homing, or coin SFX.
- Do not change the actual SFX event name.
- Do not change movement velocity or acceleration rules.
