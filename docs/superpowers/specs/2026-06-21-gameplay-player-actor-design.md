# Gameplay Player Actor Design

Date: 2026-06-21

## Scope

This slice brings the first controllable player actor from `__prototype__/` into the rebuild. It builds on the existing gameplay map renderer and keeps the implementation focused on:

- defining the player actor object structure in the domain layer
- copying the player idle and run spritesheets into root-level runtime assets
- rendering the player on stage `1-1`
- supporting left and right movement with prototype-style acceleration, drag, max speed, and facing direction

The slice does not add jump, crouch, attack, hurt, death, enemies, hazards, checkpoints, stage goals, health, sound effects, footstep timing, respawn, gamepad gameplay input, or gameplay HUD.

## Current Context

The rebuild already has:

- `src/domain/gameplay/gameplayMapTypes.ts` for map data
- `src/domain/gameplay/gameplayStageMaps.ts` for stage `1-1`
- `src/domain/gameplay/terrain.ts` for pure terrain-grid generation and validation
- `src/ui/gameplay/createGameplayRenderer.ts` for Phaser-backed background and terrain rendering
- runtime map and tile assets under `public/assets/`

The prototype provides the source values for this slice:

- player origin `{ x: 0.5, y: 0.5 }`
- player body `{ width: 34, height: 72, offsetX: 47, offsetY: 42 }`
- player center above surface `76`
- player scale `0.78`
- max horizontal speed `500`
- world gravity `1500`
- idle drag `1500`
- ground acceleration `950`
- idle animation frames `0..3`, 5 fps
- run animation frames `0..3`, 9 fps
- left input wins when left and right are both held

The rebuild must treat `__prototype__/` as read-only reference code and asset source. Runtime assets copied for the rebuild must live under root-level `public/`.

## Domain Model

Add a focused player actor module at `src/domain/gameplay/playerActor.ts`.

It owns pure data and deterministic decisions:

- `PlayerActorDefinition`
- `PlayerAnimationDefinition`
- `PlayerMovementInput`
- `PlayerHorizontalMovementDecision`
- `playerActorDefinition`
- `getPlayerCenterY(input)`
- `getPlayerHorizontalMovementDecision(input)`

The actor definition includes:

- sprite keys for idle and run
- asset refs for idle and run spritesheets
- frame dimensions
- animation frame ranges and frame rates
- origin, scale, body size, body offset
- center-above-surface spawn placement
- max velocity
- gravity and horizontal movement tuning

`getPlayerCenterY` calculates a center point from a stage surface Y coordinate. This slice supports normal downward gravity only, so the stage spawn is interpreted as standing on a platform surface.

`getPlayerHorizontalMovementDecision` receives booleans for `left` and `right` and returns:

- `direction`: `left`, `right`, or `none`
- `accelerationX`
- `dragX`

Rules:

- left only: direction `left`, acceleration `-950`, drag `1500`
- right only: direction `right`, acceleration `950`, drag `1500`
- both held: same as left
- neither held: direction `none`, acceleration `0`, drag `1500`

This keeps movement rules testable without Phaser, DOM, timers, or mutable state.

## Stage Data

Extend `GameplayStageMap` with a player actor spawn:

```ts
player: {
  actorId: 'player'
  spawn: {
    x: number
    surfaceY: number
  }
}
```

For stage `1-1`, spawn the player on the first platform. With tile size `64`, first platform row `8`, and surface Y `512`, the center Y is `512 - 76 = 436`.

The stage map still owns only static stage data. It does not own runtime velocity, current animation, input state, or Phaser objects.

## Assets

Copy only the spritesheets needed by this slice:

- from `__prototype__/public/assets/sprites/player_idle/sheet-transparent.webp`
- to `public/assets/sprites/player_idle/sheet-transparent.webp`
- from `__prototype__/public/assets/sprites/player_run/sheet-transparent.webp`
- to `public/assets/sprites/player_run/sheet-transparent.webp`

Other prototype player spritesheets stay out of scope until their gameplay slice needs them.

## Phaser Adapter

Update `src/ui/gameplay/createGameplayRenderer.ts` as the imperative adapter.

Responsibilities:

1. Preload map background layers, terrain tiles, and player idle/run spritesheets.
2. Create player idle/run animations from domain animation definitions.
3. Create terrain before the player.
4. Create the player sprite at the domain-calculated spawn center.
5. Apply domain actor values to Phaser: origin, scale, body size, body offset, drag, max velocity, depth, and world bounds.
6. Enable arcade gravity with y `1500`.
7. Add a collider between the player and terrain.
8. Poll keyboard state for ArrowLeft, ArrowRight, A, and D inside the Phaser scene.
9. Convert keyboard state into a pure domain movement decision.
10. Apply acceleration and drag to the player body.
11. Flip the sprite when a movement direction is active.
12. Play run animation while directional input is active; otherwise play idle.
13. Start the camera following the player so movement remains visible.

Keyboard polling remains in the UI adapter because it is a browser/Phaser side effect. Movement decisions remain in the domain layer.

## Reactive Boundary

The Svelte gameplay screen keeps the existing lifecycle boundary:

- create a Phaser game when gameplay mounts
- pass the selected immutable `GameplayStageMap`
- destroy the Phaser game when the component unmounts or the stage changes

No Svelte component owns per-frame movement state in this slice. The reactive boundary remains responsible for mounting and teardown, while Phaser owns its frame loop.

## Error Handling

The renderer should continue to fail with clear errors for invalid terrain or failed terrain layer creation.

The player creation path should fail clearly if:

- player spawn data is missing
- the terrain layer is unavailable when creating the player collider
- Phaser cannot create the expected player keyboard keys

These are developer/configuration errors, not recoverable runtime states.

## Tests

Use TDD for implementation.

Domain tests:

- player actor definition preserves prototype body, origin, scale, frame size, animation rates, gravity, drag, acceleration, and max speed
- `getPlayerCenterY` places the player center above the platform surface
- `getPlayerHorizontalMovementDecision` accelerates left, accelerates right, idles with drag, and gives left priority when both directions are held
- stage `1-1` includes a player spawn and uses player asset refs under `/assets/sprites/`

UI adapter tests:

- Phaser config uses arcade gravity y `1500`
- renderer config still creates a single gameplay scene for the stage
- the scene preload path includes player spritesheets through domain actor data where practical without over-mocking Phaser internals

Verification before completion:

- `npm run test`
- `npm run check`
- `npm run build`
- `git diff --check`

## Completion Criteria

The slice is complete when:

- root-level player idle/run spritesheets exist under `public/assets/sprites/`
- stage `1-1` has typed player spawn data
- domain tests prove player actor structure and horizontal movement decisions
- gameplay renderer preloads and renders the player
- the player stands on terrain through arcade physics and terrain collision
- ArrowLeft/A and ArrowRight/D move the player with acceleration and drag
- the player flips left/right and switches idle/run animations
- verification commands pass, except for known non-failing build warnings that are reported
