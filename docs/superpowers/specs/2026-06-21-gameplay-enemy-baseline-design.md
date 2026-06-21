# Gameplay Enemy Baseline Design

## Goal

Port the first enemy slice from `__prototype__/` into the rebuilt gameplay scene by adding Armor Guard and Azure Core as visible, moving gameplay objects.

This slice is intentionally limited to spawn, rendering, placement, collision setup, and baseline movement:

- Armor Guard appears on a platform, uses the prototype guard walk/death spritesheets, collides with terrain, and patrols between authored bounds.
- Azure Core appears in the air, uses the prototype generated visual style, has no gravity, is immovable, and floats with a small tween.

This slice does not add player hurt, enemy defeat, attack handling, homing attack, Azure Core regeneration, scoring, HUD markers, boss behavior, sound effects, or localization text.

## Prototype Facts

The prototype models the two enemies through `guard` and `azure-core`.

Armor Guard prototype values:

- type default: omitted enemy type means guard semantics
- placement: grounded
- origin: `{ x: 0.5, y: 0.5 }`
- body: `{ width: 46, height: 54, offsetX: 41, offsetY: 54 }`
- center above surface: `70`
- rebuilt terrain visual lift: `16`
- gravity: `true`
- behavior: `patrol`
- initial patrol direction: `-1`
- patrol speed: `80`
- walk sprite key: `enemy-guard-walk`
- walk asset: `/assets/sprites/enemy_guard_walk/sheet-transparent.webp`
- walk frame size: `128x128`
- walk frames: `0..3`
- walk frame rate: `7`
- walk repeat: `-1`
- death sprite key: `enemy-guard-death`
- death asset: `/assets/sprites/enemy_guard_death/sheet-transparent.webp`
- death frame size: `128x128`
- death frames: `0..3`
- death frame rate: `8`
- death repeat: `0`

Azure Core prototype values:

- type: `azure-core`
- placement: airborne
- origin: `{ x: 0.5, y: 0.5 }`
- body: `{ width: 58, height: 58, offsetX: 9, offsetY: 9 }`
- gravity: `false`
- behavior: `homing-target`
- texture key: `azure-core`
- generated texture size: `76x76`
- scale: `1`
- depth: `9`
- immovable: `true`
- floating tween: `y` to `spawnY - 14`, `angle` to `10`, duration `950`, ease `Sine.easeInOut`, `yoyo: true`, `repeat: -1`

The rebuilt project must not import runtime code from `__prototype__/`. Prototype files are reference-only.

## Architecture

### Domain

Add `src/domain/gameplay/enemyActor.ts` as the pure enemy actor model.

It owns generic enemy metadata and pure decisions:

```ts
export type EnemyActorType = 'armor-guard' | 'azure-core'
export type EnemyPlacement = 'grounded' | 'airborne'
export type EnemyBehavior = 'patrol' | 'homing-target'
export type EnemyPatrolDirection = -1 | 1

export type EnemySpriteDefinition = {
  key: string
  assetRef: string
  frameWidth: number
  frameHeight: number
  frameStart: number
  frameEnd: number
  frameRate: number
  repeat: number
}

export type EnemyActorDefinition = {
  type: EnemyActorType
  placement: EnemyPlacement
  behavior: EnemyBehavior
  origin: { x: number; y: number }
  body: { width: number; height: number; offsetX: number; offsetY: number }
  gravity: boolean
  depth: number
  scale: number
  centerAboveSurface?: number
  sprites?: {
    walk?: EnemySpriteDefinition
    death?: EnemySpriteDefinition
  }
  generatedTexture?: {
    key: string
    width: number
    height: number
  }
  patrol?: {
    initialDirection: EnemyPatrolDirection
    speed: number
  }
  floating?: {
    yOffset: number
    angle: number
    durationMs: number
    ease: string
  }
}
```

Required domain exports:

- `enemyActorDefinitions`
- `getEnemySpawnY(enemy)`
- `getNextEnemyPatrolDirection(input)`
- `shouldUpdateEnemyPatrol(enemyType)`

`getEnemySpawnY` returns authored `y` for Azure Core and `surfaceY - centerAboveSurface - visualLiftY` for Armor Guard. The lift keeps the prototype guard art from overlapping the rebuilt platform tiles while preserving the prototype center-above-surface value.

`getNextEnemyPatrolDirection` matches the prototype rules:

- if `x < patrolMinX`, return `1`
- if `x > patrolMaxX`, return `-1`
- otherwise return the current direction

`shouldUpdateEnemyPatrol` returns `true` for Armor Guard and `false` for Azure Core.

The domain module must not import Phaser, Svelte, browser APIs, timers, random values, or `__prototype__`.

### Stage Map Data

Extend `GameplayStageMap` with:

```ts
enemies: readonly GameplayEnemySpawn[]
```

Enemy spawn types:

```ts
export type GameplayEnemySpawn =
  | {
      id: string
      type: 'armor-guard'
      x: number
      surfaceY: number
      patrolMinX: number
      patrolMaxX: number
    }
  | {
      id: string
      type: 'azure-core'
      x: number
      y: number
      patrolMinX: number
      patrolMaxX: number
    }
```

The rebuilt `1-1` map should include both enemy types so the slice is visible in the current playable stage:

- Armor Guard on an existing platform with patrol bounds inside that platform span.
- Azure Core at an authored airborne point. It should be visible while traversing the current 1-1 route.

The exact stage positions can be tuned to current rebuilt terrain, but must keep these constraints:

- Guard `surfaceY` must match an existing platform top.
- Guard patrol bounds must stay inside or near the same platform span.
- Azure Core must use authored `y`, not `surfaceY`.
- Every enemy id must be stable and unique inside the stage.

### Runtime Adapter

Extend `src/ui/gameplay/createGameplayRenderer.ts`.

Preload:

- Load all enemy spritesheet assets declared in `enemyActorDefinitions`.
- Azure Core is generated at runtime, so there is no image asset to preload for it.

Create:

- Generate the Azure Core texture using the prototype drawing style in a private renderer helper.
- Register Armor Guard walk/death animations from domain metadata.
- Create enemy sprites after terrain and before player colliders are finalized.
- Store enemy runtimes in scene state:

```ts
type EnemyRuntime = {
  sprite: Phaser.Physics.Arcade.Sprite
  spawn: GameplayEnemySpawn
  direction: EnemyPatrolDirection
}
```

Armor Guard runtime:

- texture: `enemy-guard-walk`
- origin from domain definition
- scale from domain definition
- depth from domain definition
- body size and offset from domain definition
- gravity enabled by Phaser default
- collide world bounds
- initial velocity X: `initialDirection * speed`
- play walk animation
- collider with terrain

Azure Core runtime:

- texture: `azure-core`
- origin from domain definition
- scale from domain definition
- depth `9`
- body size and offset from domain definition
- `body.allowGravity = false`
- `setImmovable(true)`
- no terrain collider
- floating tween from domain metadata

Update:

- Keep the existing parallax and player movement behavior.
- Update Armor Guard patrol every frame using `getNextEnemyPatrolDirection`.
- Set Guard velocity X to `direction * speed`.
- Flip Guard right-facing when direction is `1`.
- Do not update Azure Core patrol.

### Assets

Copy these files from the prototype into root public assets:

- `__prototype__/public/assets/sprites/enemy_guard_walk/sheet-transparent.webp`
- `__prototype__/public/assets/sprites/enemy_guard_death/sheet-transparent.webp`

Destination:

- `public/assets/sprites/enemy_guard_walk/sheet-transparent.webp`
- `public/assets/sprites/enemy_guard_death/sheet-transparent.webp`

No runtime asset may reference `__prototype__`.

## Tests

Use TDD for each behavior slice.

Domain tests:

- Armor Guard definition matches prototype placement/body/origin/center/gravity/patrol/sprite metadata.
- Azure Core definition matches prototype placement/body/origin/gravity/depth/generated texture/floating metadata.
- `getEnemySpawnY` uses `surfaceY - 70 - 16` for Armor Guard.
- `getEnemySpawnY` uses authored `y` for Azure Core.
- `getNextEnemyPatrolDirection` turns right below min, left above max, and preserves current direction inside bounds.
- `shouldUpdateEnemyPatrol` returns true for Armor Guard and false for Azure Core.

Stage map tests:

- `1-1` has both enemy types.
- Enemy ids are unique.
- Guard spawn data uses an existing platform surface and bounded patrol.
- Enemy asset refs use root `/assets/` paths and never include `__prototype__`.

Renderer tests:

- Preloads Armor Guard walk/death spritesheets from domain definitions.
- Registers Armor Guard walk/death animations from domain definitions.
- Generates Azure Core texture.
- Creates Armor Guard with grounded spawn Y, body setup, depth, scale, walk animation, initial velocity, and terrain collider.
- Creates Azure Core with authored `y`, generated texture, body setup, no gravity, immovable, depth, no terrain collider, and floating tween.
- Updates Guard patrol direction, velocity, and flip.
- Does not update Azure Core patrol velocity.
- Keeps existing player movement/jump tests passing.

## Completion Criteria

- Armor Guard and Azure Core are visible in rebuilt `1-1`.
- Armor Guard patrols between authored bounds.
- Azure Core floats in place without gravity.
- Enemy assets live under root `public/assets`, not under `__prototype__`.
- Domain code remains pure.
- Runtime adapter owns Phaser side effects only.
- `npm run test` passes.
- `npm run check` passes.
- `npm run build` passes.
- `git diff --check` passes.
