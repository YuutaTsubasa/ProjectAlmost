# Gameplay Movable Actor Jump Design

Date: 2026-06-21

## Scope

This slice adds a minimal movable actor state foundation and uses the player as its first runtime consumer. It completes the third gameplay migration step:

- add player jump
- add one air jump, producing a two-jump flow
- preserve prototype jump timing and velocity
- copy the player jump spritesheet into root-level runtime assets
- render the airborne player with the prototype jump frame

The state foundation is intentionally small. It supports the state and transitions needed for player jump only, while leaving room for future characters, enemies, and movable objects to reuse the same event/command style.

This slice does not add crouch, attack, hurt, death, homing attack, enemies, enemy AI, moving platforms, hazards, checkpoints, goals, health, sound effects, landing effects, gamepad gameplay input, virtual controls, pause, HUD, or localization text.

## Current Context

The rebuild already has:

- `src/domain/gameplay/playerActor.ts` for player actor values and horizontal movement decisions
- `src/ui/gameplay/createGameplayRenderer.ts` for the Phaser gameplay adapter
- `GameplayStageMap.player.spawn` for the first player spawn
- player idle and run spritesheets under root `public/assets/sprites/`
- Phaser arcade gravity `1500`, terrain collision, left/right movement, idle/run animations, and camera follow

The prototype jump behavior is split between pure rules and Phaser adapter state:

- `COYOTE_TIME_MS = 120`
- `JUMP_BUFFER_MS = 140`
- jump velocity `-640`
- one remaining air jump while airborne
- grounded or coyote-time jump is a `ground-jump`
- outside coyote time, one remaining air jump allows an `air-jump`
- expired jump buffer produces no jump
- landing resets remaining air jumps to `1`
- jump input comes from Space, ArrowUp, and W in the keyboard path
- airborne animation uses `player-jump`, frame `1`, frame rate `1`, repeat `0`

## Design Direction

Use a small shared state-machine foundation, not a complete player controller rewrite.

The goal is to introduce a reusable pattern for movable actors:

1. Renderer or adapter observes engine state and input.
2. Adapter converts those facts into domain inputs/events.
3. Domain pure functions return updated actor state and explicit commands.
4. Adapter applies commands to Phaser objects.

Only the jump-related subset of that pattern is implemented now.

## Domain Model

Add `src/domain/gameplay/movableActorState.ts`.

It owns generic movable actor jump state and transitions:

```ts
export type MovableActorGroundState = 'grounded' | 'airborne'

export type MovableActorJumpState = {
  groundState: MovableActorGroundState
  lastGroundedAt: number
  jumpBufferedUntil: number
  remainingAirJumps: number
}

export type MovableActorJumpConfig = {
  coyoteTimeMs: number
  jumpBufferMs: number
  maxAirJumps: number
}

export type MovableActorJumpDecision =
  | { type: 'none'; state: MovableActorJumpState }
  | { type: 'ground-jump'; state: MovableActorJumpState }
  | { type: 'air-jump'; state: MovableActorJumpState }
```

The module exposes pure functions:

- `createMovableActorJumpState(input)`
- `updateMovableActorGroundContact(input)`
- `bufferMovableActorJump(input)`
- `getMovableActorJumpDecision(input)`

Rules:

- When grounded, `groundState` becomes `grounded`, `lastGroundedAt` becomes `now`, and `remainingAirJumps` resets to `maxAirJumps`.
- When not grounded, `groundState` becomes `airborne` and air jumps are not reset.
- A jump press sets `jumpBufferedUntil = now + jumpBufferMs`.
- If `jumpBufferedUntil < now`, decision is `none`.
- If grounded, decision is `ground-jump`.
- If airborne and `now - lastGroundedAt <= coyoteTimeMs`, decision is `ground-jump`.
- If outside coyote time and `remainingAirJumps > 0`, decision is `air-jump` and decrements `remainingAirJumps`.
- A successful jump clears `jumpBufferedUntil` and `lastGroundedAt` to `0`, matching the prototype.

This module is not player-specific. It does not know about sprites, Phaser, velocity values, controls, enemies, attacks, or animation keys.

## Player Actor Additions

Extend `src/domain/gameplay/playerActor.ts` with player-specific jump configuration:

- `sprites.jump`
- `jump.coyoteTimeMs = 120`
- `jump.jumpBufferMs = 140`
- `jump.maxAirJumps = 1`
- `jump.velocityY = -640`

Extend `PlayerAnimationKey` to include `jump`.

Add player jump sprite metadata:

- key `player-jump`
- asset ref `/assets/sprites/player_jump/sheet-transparent.webp`
- frame width `128`
- frame height `128`
- frame start `1`
- frame end `1`
- frame rate `1`
- repeat `0`

The existing player horizontal movement rules stay in `playerActor.ts`.

## Assets

Copy the prototype jump spritesheet into the rebuild runtime assets:

- from `__prototype__/public/assets/sprites/player_jump/sheet-transparent.webp`
- to `public/assets/sprites/player_jump/sheet-transparent.webp`

Do not copy attack, crouch, hurt, death, or other player spritesheets in this slice.

## Phaser Adapter

Update `src/ui/gameplay/createGameplayRenderer.ts`.

The scene keeps runtime state because Phaser owns the frame loop and collision contacts:

- `playerJumpState`
- `wasJumpDown`

Keyboard controls expand to:

- ArrowLeft / ArrowRight / A / D for horizontal movement
- Space / ArrowUp / W for jump press detection

Per frame:

1. Read grounded from `player.body.blocked.down || player.body.touching.down`.
2. Update domain jump state with current grounded contact and `this.time.now`.
3. Detect jump press rising edge from Space, ArrowUp, or W.
4. Buffer jump input through the domain state function.
5. Ask domain for jump decision.
6. If decision is `ground-jump` or `air-jump`, apply `player.setVelocityY(playerActorDefinition.jump.velocityY)`.
7. Store returned jump state.
8. Continue applying horizontal movement through the existing domain horizontal movement decision.
9. Use `player-jump` animation while airborne.
10. Use run or idle animation only while grounded.

The adapter does not implement gamepad input, sfx, effects, HUD, or attack/crouch interactions in this slice.

## Animation Rules

Keep animation selection simple and explicit for the current scope:

- airborne: `player-jump`
- grounded and moving left/right: `player-run`
- grounded and not moving: `player-idle`

This does not become the final full player animation state machine. A later crouch/attack/hurt slice can promote animation selection into a richer domain state transition once those states exist.

## Error Handling

Existing renderer errors remain:

- invalid terrain
- failed terrain layer creation
- missing keyboard controls

No recoverable player jump errors are expected. Missing player jump asset should surface through Phaser asset loading in development.

## Tests

Use TDD for implementation.

Domain tests:

- movable actor starts grounded or airborne with configured air jumps
- grounded contact resets remaining air jumps and last grounded time
- airborne contact does not reset air jumps
- jump press buffers until `now + jumpBufferMs`
- expired buffer produces `none`
- grounded buffered jump produces `ground-jump`
- coyote-time buffered jump produces `ground-jump`
- outside coyote time with one remaining air jump produces `air-jump` and consumes it
- outside coyote time with no remaining air jumps produces `none`
- successful jumps clear buffer and last grounded time

Player actor tests:

- player jump config preserves prototype values
- player jump animation metadata points to root public asset path

Renderer tests:

- preloads the player jump spritesheet through domain actor data
- registers the player jump animation from domain actor data
- maps Space, ArrowUp, and W to jump press rising edge
- applies jump velocity on grounded jump
- applies jump velocity on air jump and consumes the air jump
- does not apply a third jump when no air jumps remain
- resets air jump after grounded contact
- uses jump animation while airborne and idle/run while grounded

Asset verification:

- copied jump spritesheet exists
- copied jump spritesheet is byte-identical to the prototype source

Verification before completion:

- `npm run test`
- `npm run check`
- `npm run build`
- `git diff --check`

## Completion Criteria

The slice is complete when:

- root-level `public/assets/sprites/player_jump/sheet-transparent.webp` exists
- domain movable actor jump state foundation is pure and covered by tests
- player actor exposes prototype jump tuning and jump animation metadata
- renderer supports Space, ArrowUp, and W jump presses
- player can ground-jump and then air-jump once
- a third jump is rejected until landing resets air jumps
- airborne player uses `player-jump`
- grounded player still uses idle/run behavior from the previous slice
- no systems listed as out of scope are introduced
- required verification commands pass, except for known non-failing build warnings that are reported
