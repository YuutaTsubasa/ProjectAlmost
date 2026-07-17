# Gameplay Moving Platforms Design

## Goal

Implement the first new World 2 gameplay system: moving platforms. The system must follow the rebuilt project's TDD, DDD, FP, and Reactive conventions while matching the prototype behavior at the player-facing level.

This slice focuses on a reusable gameplay platform system, not a one-off 2-1 patch.

## Context

World 2 is Emerald Sanctuary. The rebuilt project already has stage source data for `2-1` through `2-6`, including `movingPlatforms` entries such as vertical vine lifts and horizontal ferries. The current converter keeps this data in `GameplayStageSource`, but it still treats moving platforms as unsupported for runtime gameplay maps.

Prototype files under `__prototype__/` are reference-only. This feature must not import prototype source code or copy prototype runtime implementation.

## Requirements

- `GameplayStageMap` must include converted moving platform definitions.
- `GameplayStageSourceMovingPlatform` fields must be preserved:
  - `id`
  - `col`
  - `row`
  - `width`
  - `height`
  - `axis`
  - `distance`
  - `durationMs`
  - optional `phase`
- Moving platform motion must be deterministic and pure in the domain layer.
- A platform moves between its authored tile-grid origin and origin plus `distance` on the configured axis.
- Movement loops as a ping-pong path: start -> end -> start.
- `phase` offsets the starting point in the loop; missing phase is `0`.
- Renderer code must consume the domain-computed platform state instead of hiding motion rules inside Phaser tweens.
- Player/platform collision must be handled through the existing Phaser adapter layer.
- Existing static platforms must keep working unchanged.
- `2-1` must become a representative converted stage with runtime moving platforms and no `unsupported-moving-platform` diagnostic.

## Domain Model

Add a focused moving platform model under `src/domain/gameplay/`.

Proposed types:

```ts
export type MovingPlatformAxis = 'x' | 'y'

export type MovingPlatformPath = {
  origin: { x: number; y: number }
  axis: MovingPlatformAxis
  distance: number
  durationMs: number
  phase: number
}

export type MovingPlatformPosition = {
  x: number
  y: number
  progress: number
  direction: -1 | 1
}
```

Domain functions:

- `getMovingPlatformOrigin(...)`: convert tile-grid `col` and `row` into world coordinates.
- `getMovingPlatformPositionAtTime(...)`: compute position from path and elapsed milliseconds.
- `normalizeMovingPlatformPhase(...)`: clamp/wrap unsafe phase values into a stable `0..1` loop offset.

These functions must be pure and deterministic. They cannot depend on Phaser, DOM, browser clocks, timers, random values, or mutable global state.

## Runtime Map Contract

Extend `GameplayStageMap`:

```ts
movingPlatforms: readonly GameplayMovingPlatformSpawn[]
```

`GameplayMovingPlatformSpawn` should include the preserved stage source fields plus world-space convenience values if needed by renderer and tests. If world-space values are added, they must be derived in the converter/domain layer rather than in the renderer.

The converter should stop emitting `unsupported-moving-platform` for moving platforms it can represent. It may still emit diagnostics for unsupported future fields if those appear later.

## Renderer Contract

`createGameplayRenderer.ts` should remain an adapter:

- create a physics platform sprite/body for each `stageMap.movingPlatforms` entry
- use the same terrain tileset visual language as static platforms
- on each update, call the domain position function with gameplay elapsed time
- set the platform body/sprite position from the returned value
- keep collision setup explicit and local to renderer

Renderer code may manage Phaser objects and body updates, but not own the movement math.

## Reactive Boundary

The gameplay loop is the reactive driver. Each tick projects current elapsed time into platform positions. The source of truth is the immutable stage map plus elapsed time, not a chain of mutable tween callbacks.

This keeps replay, tests, checkpoint resets, and future pause/resume behavior easier to reason about.

## Testing Strategy

Use TDD for every behavior change.

Domain tests:

- a vertical platform at elapsed `0` starts at its origin when phase is `0`
- at half-duration it reaches origin plus `distance`
- at full duration it returns to origin
- horizontal and vertical axes affect only their configured coordinate
- phase offsets the loop position
- invalid phase values are normalized

Converter tests:

- `GameplayStageSource.movingPlatforms` converts into `GameplayStageMap.movingPlatforms`
- `2-1` preserves its three authored moving platforms
- `unsupported-moving-platform` is no longer emitted for supported moving platform data

Renderer tests:

- preloading/creation creates moving platform render objects from stage map data
- `update()` advances platform position according to the domain function
- player/platform collision is registered
- static platform behavior remains unchanged

Integration checks:

- representative stage `2-1` loads with moving platform data
- full verification passes:
  - `npm run test`
  - `npm run check`
  - `npm run build`
  - `git diff --check`

## Out Of Scope

- New art generation.
- One-way platforms.
- Rotating platforms.
- Breakable platforms.
- Moving hazards attached to platforms.
- Player carry/friction refinements beyond normal Arcade collision behavior.
- Boss behavior.
- Full 2-1 polish pass.
- Importing or copying prototype runtime code.

## Acceptance Criteria

- Moving platform motion is defined by pure domain functions with failing tests written first.
- `GameplayStageMap` exposes moving platform data.
- `2-1` no longer reports moving platforms as unsupported.
- Renderer displays and updates moving platforms from domain-computed positions.
- Existing gameplay stage rendering and static terrain tests remain green.
- Runtime code contains no `__prototype__` imports or asset references.
