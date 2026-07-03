# Gameplay Checkpoints / Respawn Design

## Goal

Port the first rebuilt Checkpoint / respawn spawn point gameplay slice from `__prototype__/` into the rebuilt gameplay scene.

This slice makes these behaviors true in rebuilt gameplay:

- Stage data can place checkpoint beacons on a gameplay map.
- The first rebuilt stage can include prototype-inspired checkpoint positions.
- The player activates checkpoints by crossing their authored X position.
- Activating a checkpoint updates the current respawn point.
- Death and fall respawn use the latest activated checkpoint spawn point instead of always returning to the stage start.
- Checkpoint rules remain in pure domain code.
- Phaser owns checkpoint visuals, activation presentation, runtime checkpoint state, and respawn placement mutation.

## Scope

This slice is gameplay-only.

It includes:

- Pure checkpoint progression rules.
- Pure checkpoint actor presentation metadata.
- Rebuild-owned checkpoint stage data.
- Rebuild-owned copy of `white_palace_checkpoint.webp`.
- Checkpoint beacon rendering.
- Prototype-inspired checkpoint glow and ring presentation.
- Checkpoint activation when the player reaches or passes a checkpoint X coordinate.
- Active checkpoint index tracking.
- Runtime respawn point tracking.
- Respawn at the latest activated checkpoint spawn point.
- Renderer tests proving checkpoint activation and respawn placement.

It intentionally does not include:

- HUD checkpoint counter.
- Checkpoint sound effects.
- Status message localization.
- Score, rank, save data, or progression persistence.
- Stage clear or goal behavior.
- 2-1 stage migration.
- Moving platforms.
- Gravity-changing checkpoints beyond preserving the optional data shape for future use.
- Restoring defeated enemies, collected coins, hazards, or moving platform phases on respawn.

## Prototype Reference

Prototype behavior lives mainly in:

- `__prototype__/src/domain/stage/checkpointRules.ts`
- `__prototype__/src/domain/stage/checkpointRules.test.ts`
- `__prototype__/src/domain/placement/objectDefinitions.ts`
- `__prototype__/src/game/stages/stageTypes.ts`
- `__prototype__/src/game/stages/1-1.json`
- `__prototype__/src/game/scenes/GameplayScene.ts`
- `__prototype__/public/assets/props/white_palace_checkpoint.webp`

Prototype values and behavior to preserve:

- Checkpoint stage shape:

```ts
type CheckpointPoint = {
  id: string
  x: number
  surfaceY: number
  spawnX: number
  spawnSurfaceY: number
  spawnGravity?: 'down' | 'up'
}
```

- Checkpoint placement:
  - grounded
  - origin `{ x: 0.5, y: 1 }`
  - display size `{ width: 76, height: 114 }`
  - visual bottom inset `0`
  - no gravity
- Checkpoint bottom Y is `surfaceY + visualBottomInset`.
- Player activation uses X crossing, not physics overlap.
- A checkpoint counts as reached when `playerX >= checkpoint.x`.
- Already activated checkpoints and earlier checkpoints are ignored.
- `findNextCheckpointIndex` returns the first checkpoint after `activeCheckpointIndex` that the player has reached.
- `activeCheckpointIndex = -1` means no checkpoint has been activated.
- Reached checkpoint count is `activeCheckpointIndex + 1`.
- Checkpoint target count is `checkpoints.length`.
- Activating a checkpoint sets the respawn point to:
  - `x = checkpoint.spawnX`
  - `surfaceY = checkpoint.spawnSurfaceY`
  - `gravity = checkpoint.spawnGravity ?? current player gravity`

Prototype 1-1 includes three checkpoints:

```json
[
  {
    "id": "combat-gate",
    "x": 2540,
    "surfaceY": 512,
    "spawnX": 2600,
    "spawnSurfaceY": 512
  },
  {
    "id": "final-ascent",
    "x": 4320,
    "surfaceY": 512,
    "spawnX": 4380,
    "spawnSurfaceY": 512
  },
  {
    "id": "final-trial",
    "x": 7300,
    "surfaceY": 512,
    "spawnX": 7360,
    "spawnSurfaceY": 512
  }
]
```

The rebuilt project should not import prototype JSON at runtime. Checkpoint data used in rebuild maps must live in rebuild-owned domain files.

## Architecture

### Domain: Checkpoint Rules

Create `src/domain/gameplay/playerCheckpoint.ts`.

This module is pure Functional core. It must not import Phaser, Svelte, DOM APIs, timers, random sources, assets, or `__prototype__`.

It owns:

- Checkpoint target counting.
- Reached checkpoint counting.
- Next checkpoint activation selection.
- Respawn spawn derivation from an activated checkpoint.

Public API:

```ts
export type PlayerCheckpointGravity = 'down' | 'up'

export type CheckpointReachPoint = {
  x: number
}

export type CheckpointRespawnPoint = {
  spawnX: number
  spawnSurfaceY: number
  spawnGravity?: PlayerCheckpointGravity
}

export type PlayerCheckpointRespawnState = {
  x: number
  surfaceY: number
  gravity: PlayerCheckpointGravity
}

export function getReachedCheckpointCount(input: {
  activeCheckpointIndex: number
}): number

export function getCheckpointTargetCount(input: {
  checkpoints: readonly unknown[]
}): number

export function findNextCheckpointIndex(input: {
  checkpoints: readonly CheckpointReachPoint[]
  activeCheckpointIndex: number
  playerX: number
}): number

export function getCheckpointRespawnState(input: {
  checkpoint: CheckpointRespawnPoint
  currentGravity: PlayerCheckpointGravity
}): PlayerCheckpointRespawnState
```

Rules:

- `getReachedCheckpointCount({ activeCheckpointIndex: -1 })` returns `0`.
- `getReachedCheckpointCount({ activeCheckpointIndex: n })` returns `n + 1`.
- `getCheckpointTargetCount` returns `checkpoints.length`.
- `findNextCheckpointIndex` ignores checkpoints at or before `activeCheckpointIndex`.
- `findNextCheckpointIndex` treats exact equality as reached: `playerX >= checkpoint.x`.
- `findNextCheckpointIndex` returns `-1` when no later checkpoint is reached.
- `getCheckpointRespawnState` maps `spawnX` to `x`, `spawnSurfaceY` to `surfaceY`, and defaults missing `spawnGravity` to `currentGravity`.

### Domain: Checkpoint Actor

Create `src/domain/gameplay/checkpointActor.ts`.

This module is pure presentation metadata. It must not import Phaser, Svelte, DOM APIs, timers, random sources, assets, or `__prototype__`.

Public API:

```ts
export type CheckpointSpriteDefinition = {
  key: string
  assetRef: string
}

export const checkpointActorDefinition: {
  behavior: 'checkpoint'
  sprite: CheckpointSpriteDefinition
  origin: { x: number; y: number }
  displaySize: { width: number; height: number }
  visualBottomInset: number
  depth: number
  inactiveAlpha: number
  activatedAlpha: number
  activatedTint: number
  glow: {
    width: number
    height: number
    yOffset: number
    depth: number
    alpha: number
  }
  ring: {
    width: number
    height: number
    yOffset: number
    depth: number
    strokeWidth: number
    alpha: number
  }
  idleTween: {
    durationMs: number
    indexDelayMs: number
    alphaFrom: number
    alphaTo: number
    scaleFrom: number
    scaleTo: number
    ease: string
  }
  activationTween: {
    durationMs: number
    spriteScaleMultiplier: number
  }
}

export function getCheckpointBottomY(input: {
  surfaceY: number
}): number
```

Rules:

- `sprite.key` is `checkpoint-beacon`.
- `sprite.assetRef` is `/assets/props/white_palace_checkpoint.webp`.
- `origin` is `{ x: 0.5, y: 1 }`.
- `displaySize` is `{ width: 76, height: 114 }`.
- `visualBottomInset` is `0`.
- `depth` is `7`.
- inactive alpha is `0.82`.
- activated alpha is `1`.
- activated tint is `0xfff0a8`.
- glow presentation:
  - width `92`
  - height `20`
  - y offset `-3`
  - depth `6`
  - alpha `0.24`
- ring presentation:
  - width `74`
  - height `74`
  - y offset `-52`
  - depth `8`
  - stroke width `3`
  - alpha `0.7`
- idle tween:
  - duration `920 + index * 130`
  - ease `Sine.easeInOut`
  - yoyo `true`
  - repeat `-1`
  - alpha from `0.24` to `0.68`
  - scale from `0.92` to `1.14`
- activation tween:
  - duration `180`
  - yoyo `true`
  - sprite scale multiplier `1.12`

The actor definition intentionally stores only values. Phaser-specific drawing and tweening stay in the renderer.

### Stage Data

Extend `src/domain/gameplay/gameplayMapTypes.ts`.

Add:

```ts
export type GameplayCheckpointSpawn = {
  id: string
  x: number
  surfaceY: number
  spawnX: number
  spawnSurfaceY: number
  spawnGravity?: 'down' | 'up'
}
```

Add `checkpoints: readonly GameplayCheckpointSpawn[]` to `GameplayStageMap`.

Add the three prototype 1-1 checkpoints to the rebuilt 1-1 map as rebuild-owned data. Runtime code must not read prototype JSON.

### Assets

Copy this prototype asset:

- From: `__prototype__/public/assets/props/white_palace_checkpoint.webp`
- To: `public/assets/props/white_palace_checkpoint.webp`

The rebuild runtime must load the root-level `public/` asset and must not reference `__prototype__`.

The prototype checkpoint sound effect is intentionally not copied in this slice because SFX playback is out of scope.

### Runtime Adapter

Extend `src/ui/gameplay/createGameplayRenderer.ts`.

Runtime state additions:

```ts
type CheckpointRuntime = {
  sprite: Phaser.GameObjects.Image
  glow: Phaser.GameObjects.Ellipse
  ring: Phaser.GameObjects.Ellipse
  spawn: GameplayCheckpointSpawn
  activated: boolean
}

type CurrentRespawnPoint = {
  x: number
  surfaceY: number
}
```

Scene fields:

- `checkpoints: CheckpointRuntime[] = []`
- `activeCheckpointIndex = -1`
- `currentRespawnPoint`, initialized from `stageMap.player.spawn`

Startup:

- Preload the checkpoint beacon asset from `checkpointActorDefinition`.
- Create checkpoint visuals after terrain and before update scanning can use them.
- For each checkpoint:
  - compute bottom Y with `getCheckpointBottomY`.
  - create glow ellipse at `x, bottomY - 3`.
  - create ring ellipse at `x, bottomY - 52`.
  - create sprite image at `x, bottomY`.
  - set sprite origin, display size, alpha, and depth from the actor definition.
  - start prototype-inspired idle tween on glow and ring.

Update flow:

- During `update`, skip checkpoint scanning while the player is dead.
- Otherwise call `updateCheckpoints()`.
- `updateCheckpoints()` uses `findNextCheckpointIndex` with the current player X and active checkpoint index.
- If no checkpoint is reached, it returns.
- If a checkpoint is reached:
  - set `activeCheckpointIndex`.
  - mark runtime checkpoint `activated = true`.
  - compute `currentRespawnPoint` from `getCheckpointRespawnState`.
  - update checkpoint sprite/glow/ring presentation.
  - start activation tweens.

Respawn flow:

- `respawnPlayer()` should use `currentRespawnPoint` rather than directly reading `stageMap.player.spawn`.
- The spawn surface Y should still be converted through `getPlayerCenterY({ surfaceY, gravity: 'down' })`.
- This slice does not implement rebuilt gravity changes, so runtime respawn gravity is effectively `down`. The data shape preserves `spawnGravity` for future gravity slices.

This slice must not reset collected coins, defeated enemies, activated checkpoints, or hazards on respawn. It only changes player respawn placement.

## Testing

Use TDD for each behavior slice.

### Domain Tests

Add `src/domain/gameplay/playerCheckpoint.test.ts`.

Cover:

- `getReachedCheckpointCount({ activeCheckpointIndex: -1 })` returns `0`.
- active checkpoint index `0` returns reached count `1`.
- target count is `checkpoints.length`.
- `findNextCheckpointIndex` returns `-1` when no checkpoints exist.
- it ignores checkpoints at or before the active index.
- it counts exact X equality as reached.
- it returns the first later checkpoint reached by player X.
- it returns `-1` when no later checkpoint is reached.
- `getCheckpointRespawnState` maps spawn fields and defaults missing gravity to current gravity.
- `getCheckpointRespawnState` preserves explicit spawn gravity.

Add `src/domain/gameplay/checkpointActor.test.ts`.

Cover:

- checkpoint actor metadata matches prototype values.
- asset ref points to `/assets/props/white_palace_checkpoint.webp`.
- `getCheckpointBottomY({ surfaceY: 512 })` returns `512`.

Extend `src/domain/gameplay/gameplayStageMaps.test.ts`.

Cover:

- checkpoint asset refs are root `/assets/...` paths and do not include `__prototype__`.
- rebuilt 1-1 includes the three checkpoint entries from prototype 1-1.
- checkpoint IDs are unique within a stage.
- checkpoint positions and spawn positions are inside world bounds.

### Renderer Tests

Extend `src/ui/gameplay/createGameplayRenderer.test.ts`.

Cover:

- checkpoint asset is preloaded from `checkpointActorDefinition`.
- checkpoint visuals are created from stage data:
  - sprite texture, position, origin, display size, alpha, and depth.
  - glow and ring position/depth/blend or stroke presentation.
  - idle tween targets glow and ring.
- crossing a checkpoint activates it:
  - player X equal to checkpoint X activates.
  - active index advances.
  - sprite alpha/tint update.
  - activation tween is started.
- repeated update after activation does not reactivate the same checkpoint.
- before activating any checkpoint, death respawns at stage spawn.
- after activating a checkpoint, death respawns at checkpoint spawn.
- moving past multiple checkpoints in one update activates only the first later checkpoint, matching prototype `findIndex` behavior.
- while dead, checkpoint scanning is skipped.

Renderer tests should not assert prototype file paths. They should assert rebuild asset refs and observable scene behavior.

## Data Flow

1. `GameplayStageMap.checkpoints` defines checkpoint and respawn spawn data.
2. The renderer loads the checkpoint beacon asset from `checkpointActorDefinition`.
3. The renderer creates checkpoint visuals from stage data.
4. `updateCheckpoints()` asks pure checkpoint rules for the next reached checkpoint.
5. Runtime updates active checkpoint index and current respawn point.
6. `respawnPlayer()` places the player at the current respawn point.

## Error Handling And Boundaries

- Empty checkpoint lists are valid.
- Runtime code must not read prototype JSON or load prototype assets.
- Domain code must not import Phaser or mutable runtime objects.
- Checkpoint activation must be monotonic: it never moves the active checkpoint index backward.
- Checkpoint scanning must not occur while the player is dead.
- Respawn placement must not reset non-player runtime state.
- This slice keeps checkpoint state in the scene runtime only. It is not persisted to saves.

## Future Extensions

This slice should make future systems easier without implementing them now:

- HUD checkpoint counters can use `getReachedCheckpointCount` and `getCheckpointTargetCount`.
- SFX can play when checkpoint activation dispatch infrastructure exists in rebuild.
- Stage clear can block further checkpoint/hazard updates once goal behavior exists.
- Gravity slices can use `spawnGravity` to respawn under inverted gravity.
- Full 2-1 migration can reuse the same checkpoint data shape after moving platforms are available.
- Save/progression slices can persist activated checkpoint IDs or current respawn point.

## Acceptance Criteria

- The checkpoint/respawn spec is committed before implementation planning begins.
- The checkpoint asset is copied into root `public/assets/props/`.
- Rebuild stage map types support checkpoints and respawn spawn data.
- Rebuilt 1-1 includes the three prototype 1-1 checkpoints as rebuild-owned data.
- Pure domain tests cover checkpoint progression and respawn state derivation.
- Renderer tests prove checkpoint rendering, activation, monotonic behavior, dead-state blocking, and respawn placement.
- Death after checkpoint activation respawns at the checkpoint spawn point.
- Death before checkpoint activation still respawns at the stage spawn point.
- No runtime code imports from or references `__prototype__`.
