# P2 Slice 18: Player Horizontal Movement Rule

## Target Behavior

Move the horizontal movement physics decision out of `GameplayScene` and into a pure player-domain rule.

Current behavior must be preserved:

- Normal grounded acceleration is `950`.
- Air acceleration is `720`.
- Ice grounded acceleration is `520`.
- Default drag is `1500`.
- Ice idle drag is `36`, only when on ice and no left/right input is held.
- Crouching always sets horizontal acceleration to `0`.
- Crouching stops horizontal velocity only when not on ice.
- Left input takes priority over right input when both are held, matching the existing `if left / else if right` branch.

## Domain API

Add `src/domain/player/movementRules.ts`:

```ts
export const GROUND_ACCELERATION = 950
export const AIR_ACCELERATION = 720
export const ICE_GROUND_ACCELERATION = 520
export const ICE_IDLE_DRAG_X = 36
export const DEFAULT_DRAG_X = 1500

export type HorizontalDirection = 'left' | 'right' | 'none'

export type HorizontalMovementDecision = {
  accelerationX: number
  dragX: number
  stopVelocityX: boolean
  direction: HorizontalDirection
}

export function getHorizontalMovementDecision(input: {
  left: boolean
  right: boolean
  grounded: boolean
  crouching: boolean
  onIce: boolean
}): HorizontalMovementDecision
```

## Ownership Boundary

Domain owns:

- Horizontal acceleration selection.
- Drag selection.
- Crouch stop-velocity decision.
- Direction priority.

`GameplayScene` keeps:

- Applying acceleration/drag/velocity to Phaser bodies.
- Starting the timer when movement input is accepted.
- Player flip direction and hurting guard.
- Animation and sound updates.

## Validation Plan

- Add failing tests before implementation.
- Verify tests fail because the new file/API does not exist.
- Implement the pure decision rule.
- Replace only the horizontal movement branch in `GameplayScene`.
- Run `npm run test -- src/domain/player/movementRules.test.ts`, `npm run test`, `npm run check`, `git diff --check`, and `npm run build`.

## Out Of Scope

- Do not change max velocity.
- Do not change jump, crouch availability, attack, Homing Attack, movement SFX, or animation rules.
