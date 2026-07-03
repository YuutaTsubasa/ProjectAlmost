# Gameplay Stage Goal / Clear Gate Design

## Goal

Port the first rebuilt Stage goal / clear gate gameplay slice from `__prototype__/` into the rebuilt gameplay scene.

This slice makes these behaviors true in rebuilt gameplay:

- Stage data can define a grounded goal object.
- The first rebuilt stage places the prototype-inspired goal near the end of the map.
- The rebuild owns and loads the prototype goal idle sprite sheet from root `public/`.
- The goal is rendered as a static Arcade body with prototype placement, display, body, and idle animation values.
- Player overlap with the goal clears the stage exactly once.
- Stage clear freezes the current gameplay action state enough to stop further player control, attacks, Homing, enemy patrol, damage, coin pickup, checkpoint scanning, and out-of-bounds defeat for this slice.

## Scope

This slice is gameplay-only.

It includes:

- Pure stage clear rules.
- Pure goal actor presentation and body metadata.
- Rebuild-owned goal stage data for rebuilt `1-1`.
- Rebuild-owned copy of `white_palace_goal_idle.webp`.
- Goal asset preload and idle animation.
- Static goal body creation.
- Player-goal overlap wiring.
- Runtime `stageCleared` state.
- Stage clear state transition from prototype.
- Clear-state gating for player movement, coin scanning, checkpoint scanning, enemy/hazard damage, Homing reticle updates, and out-of-bounds defeat.
- Goal activation presentation by tinting the goal cyan.
- Focused domain and renderer tests.

It intentionally does not include:

- Result screen.
- Route transition after clear.
- Save data, stage records, unlocks, rank, score, or best time persistence.
- Timer, HUD, minimap, goal progress, or clear status UI.
- Audio/SFX playback.
- Boss-specific hidden goal behavior.
- Goal visibility gates.
- Multi-stage goal migration beyond rebuilt `1-1`.
- Resetting enemies, coins, hazards, checkpoints, or moving platform phases after clear.
- Localized status messages.

## Prototype Reference

Prototype behavior lives mainly in:

- `__prototype__/src/domain/placement/objectDefinitions.ts`
- `__prototype__/src/domain/stage/stageClearRules.ts`
- `__prototype__/src/domain/stage/stageClearRules.test.ts`
- `__prototype__/src/game/assets/assetManifest.ts`
- `__prototype__/src/game/scenes/GameplayScene.ts`
- `__prototype__/src/game/stages/stageTypes.ts`
- `__prototype__/src/game/stages/1-1.json`
- `__prototype__/public/assets/props/white_palace_goal_idle.webp`

Prototype values and behavior to preserve:

- Goal stage shape:

```ts
goal: {
  x: number
  surfaceY: number
}
```

- Prototype `1-1` goal:

```json
{
  "x": 9340,
  "surfaceY": 512
}
```

- Goal placement metadata:
  - placement `grounded`
  - origin `{ x: 0.5, y: 1 }`
  - display size `{ width: 96, height: 128 }`
  - body `{ width: 52, height: 112, offsetX: 22, offsetY: 16 }`
  - visual bottom inset `6`
  - gravity `false`
  - behavior `goal`
- Goal bottom Y is `surfaceY + visualBottomInset`.
- Goal sprite key is `stage-goal`.
- Goal asset ref is `/assets/props/white_palace_goal_idle.webp`.
- Goal spritesheet frame size is `256 x 256`.
- Goal idle animation:
  - key `stage-goal-idle`
  - frames `0..3`
  - frame rate `5`
  - repeat `-1`
  - yoyo `true`
- Prototype stage clear rules:

```ts
canCompleteStage({ stageCleared: false }) === true
canCompleteStage({ stageCleared: true }) === false

getStageClearState() === {
  stageCleared: true,
  attacking: false,
  homingAttacking: false,
  attackReady: false,
}
```

- On clear, prototype:
  - blocks duplicate clear.
  - sets `stageCleared = true`.
  - stops attacking.
  - stops Homing.
  - sets `attackReady = false`.
  - clears Homing target and hides reticle.
  - stops hurt blink.
  - sets player velocity and acceleration X to `0`.
  - sets each enemy horizontal velocity to `0`.
  - tints goal cyan.
  - returns player visual state to normal and idle animation.

This rebuilt slice keeps the same gameplay state transition where current systems exist, but does not implement prototype-only HUD/status/SFX behavior.

## Architecture

### Domain: Stage Clear Rules

Create `src/domain/gameplay/stageClear.ts`.

This module is pure Functional core. It must not import Phaser, Svelte, DOM APIs, timers, random sources, assets, or `__prototype__`.

Public API:

```ts
export type StageClearState = {
  stageCleared: boolean
  attacking: boolean
  homingAttacking: boolean
  attackReady: boolean
}

export function canCompleteStage(input: {
  stageCleared: boolean
}): boolean

export function getStageClearState(): StageClearState
```

Rules:

- `canCompleteStage({ stageCleared: false })` returns `true`.
- `canCompleteStage({ stageCleared: true })` returns `false`.
- `getStageClearState()` returns a fresh object with:
  - `stageCleared: true`
  - `attacking: false`
  - `homingAttacking: false`
  - `attackReady: false`

### Domain: Goal Actor

Create `src/domain/gameplay/goalActor.ts`.

This module is pure presentation metadata. It must not import Phaser, Svelte, DOM APIs, timers, random sources, assets, or `__prototype__`.

Public API:

```ts
export type GoalSpriteDefinition = {
  key: string
  assetRef: string
  frameWidth: number
  frameHeight: number
}

export const goalActorDefinition: {
  behavior: 'goal'
  sprite: GoalSpriteDefinition
  animation: {
    idleKey: string
    frameStart: number
    frameEnd: number
    frameRate: number
    repeat: number
    yoyo: boolean
  }
  origin: { x: number; y: number }
  displaySize: { width: number; height: number }
  body: { width: number; height: number; offsetX: number; offsetY: number }
  visualBottomInset: number
  depth: number
  activatedTint: number
}

export function getGoalBottomY(input: {
  surfaceY: number
}): number
```

Rules:

- `sprite.key` is `stage-goal`.
- `sprite.assetRef` is `/assets/props/white_palace_goal_idle.webp`.
- `sprite.frameWidth` is `256`.
- `sprite.frameHeight` is `256`.
- `animation.idleKey` is `stage-goal-idle`.
- `animation.frameStart` is `0`.
- `animation.frameEnd` is `3`.
- `animation.frameRate` is `5`.
- `animation.repeat` is `-1`.
- `animation.yoyo` is `true`.
- `origin` is `{ x: 0.5, y: 1 }`.
- `displaySize` is `{ width: 96, height: 128 }`.
- `body` is `{ width: 52, height: 112, offsetX: 22, offsetY: 16 }`.
- `visualBottomInset` is `6`.
- `depth` is `8`.
- `activatedTint` is `0x4be8ff`.
- `getGoalBottomY({ surfaceY })` returns `surfaceY + visualBottomInset`.

### Stage Data

Extend `src/domain/gameplay/gameplayMapTypes.ts`.

Add:

```ts
export type GameplayGoalSpawn = {
  x: number
  surfaceY: number
}
```

Add `goal: GameplayGoalSpawn` to `GameplayStageMap`.

Add the prototype `1-1` goal to rebuilt `1-1`:

```ts
goal: {
  x: 9340,
  surfaceY: 512,
}
```

Runtime code must not read prototype JSON.

### Assets

Copy this prototype asset:

- From: `__prototype__/public/assets/props/white_palace_goal_idle.webp`
- To: `public/assets/props/white_palace_goal_idle.webp`

The rebuild runtime must load the root-level `public/` asset and must not reference `__prototype__`.

The prototype goal sound effect is intentionally not copied in this slice because audio playback is out of scope.

### Runtime Adapter

Extend `src/ui/gameplay/createGameplayRenderer.ts`.

Runtime state additions:

```ts
type GoalRuntime = {
  sprite: Phaser.Types.Physics.Arcade.SpriteWithStaticBody
  cleared: boolean
}
```

Scene fields:

- `goal: GoalRuntime | null = null`
- `stageCleared = false`

Startup:

- Preload the goal spritesheet from `goalActorDefinition`.
- Create `stage-goal-idle` animation from `goalActorDefinition.animation`.
- Create the static goal sprite from `stageMap.goal`.
- Place it at `stageMap.goal.x` and `getGoalBottomY({ surfaceY: stageMap.goal.surfaceY })`.
- Set origin, display size, body size, body offset, depth, and idle animation from `goalActorDefinition`.
- Add player-goal overlap that calls `completeStage()`.

Update flow:

- `updateCoins()` should pass the runtime `stageCleared` value instead of hard-coded `false`.
- Checkpoint scanning should skip when `stageCleared`.
- Player movement should stop once `stageCleared`.
- Out-of-bounds defeat should skip once `stageCleared`.
- Enemy contact and hazard contact should skip once `stageCleared`.
- Homing reticle and Homing start should not update once `stageCleared`.

Clear flow:

- `completeStage()` should use `canCompleteStage({ stageCleared: this.stageCleared })`.
- If already cleared, return without changing state or replaying presentation.
- If clear is allowed:
  - derive state with `getStageClearState()`.
  - set `stageCleared`, `isAttacking`, `isHomingAttacking`, and `attackReady`.
  - clear Homing target and hide reticle.
  - stop player velocity and acceleration X.
  - stop enemy horizontal velocity.
  - tint goal with `goalActorDefinition.activatedTint`.
  - set player back to idle animation.

This slice should not dispatch route navigation, result state, save data, records, rank, score, or audio.

## Testing

Use TDD for each behavior slice.

### Domain Tests

Add `src/domain/gameplay/stageClear.test.ts`.

Cover:

- `canCompleteStage({ stageCleared: false })` returns `true`.
- `canCompleteStage({ stageCleared: true })` returns `false`.
- `getStageClearState()` returns the prototype values.
- `getStageClearState()` returns a fresh object.

Add `src/domain/gameplay/goalActor.test.ts`.

Cover:

- goal actor metadata matches prototype values.
- asset ref points to `/assets/props/white_palace_goal_idle.webp`.
- asset ref does not include `__prototype__`.
- `getGoalBottomY({ surfaceY: 512 })` returns `518`.

Extend `src/domain/gameplay/gameplayStageMaps.test.ts`.

Cover:

- goal asset refs are root `/assets/...` paths and do not include `__prototype__`.
- rebuilt `1-1` goal equals `{ x: 9340, surfaceY: 512 }`.
- goal is inside world bounds.
- goal is on an authored platform surface.

### Renderer Tests

Extend `src/ui/gameplay/createGameplayRenderer.test.ts`.

Cover:

- goal spritesheet is preloaded from `goalActorDefinition`.
- goal idle animation is created with the prototype frame range and animation values.
- goal static sprite is created from stage data:
  - texture key, x, bottom Y, origin, display size, depth.
  - body size and body offset.
  - refreshed body.
  - idle animation plays.
- player-goal overlap exists.
- overlapping the goal clears the stage:
  - player velocity and acceleration X become `0`.
  - player idle animation plays.
  - attack/Homing state no longer continues.
  - Homing reticle is hidden if present.
  - enemy patrol velocity is stopped.
  - goal tint is cyan.
- duplicate overlap does not re-run clear presentation.
- after clear:
  - player movement input no longer moves the player.
  - coin pickup scanning is skipped.
  - checkpoint scanning is skipped.
  - enemy contact damage is skipped.
  - hazard contact damage is skipped.
  - out-of-bounds defeat is skipped.

Renderer tests should use fake runtime behavior and should not assert prototype file paths.

## Data Flow

1. `GameplayStageMap.goal` defines where the goal is placed.
2. `goalActorDefinition` defines the render/body metadata and root asset path.
3. The renderer loads the goal sprite sheet and creates its idle animation.
4. The renderer creates a static goal body from stage data.
5. Player-goal overlap asks pure stage clear rules whether clear is allowed.
6. Runtime stage clear state gates gameplay systems and freezes current action state.

## Error Handling And Boundaries

- Runtime code must not read prototype JSON or load prototype assets.
- Domain code must not import Phaser or mutable runtime objects.
- Stage clear must be idempotent.
- Stage clear must stop gameplay action without navigating away.
- Stage clear must not reset or mutate collected coins, defeated enemies, hazards, checkpoints, or respawn state beyond stopping current movement/action.
- This slice keeps clear state in scene runtime only. It is not persisted to saves.

## Future Extensions

This slice should make future systems easier without implementing them now:

- Result screen can observe clear state once a gameplay shell/result route exists.
- Timer, rank, score, and records can be computed from gameplay state in a later slice.
- Save/progression can persist clear records later.
- Audio can play a goal SFX once rebuild audio dispatch exists in gameplay.
- HUD can display clear state and goal progress later.
- Boss stages can gate goal visibility after boss defeat in a separate boss slice.

## Acceptance Criteria

- The stage goal / clear gate spec is committed before implementation planning begins.
- The goal asset is copied into root `public/assets/props/`.
- Rebuild stage map types support a goal spawn.
- Rebuilt `1-1` includes the prototype `1-1` goal as rebuild-owned data.
- Pure domain tests cover stage clear rules and goal actor metadata.
- Renderer tests prove goal preload, animation, rendering, overlap, idempotent clear, and post-clear gameplay gating.
- Player overlap with the goal clears the stage exactly once.
- Stage clear stops current player/enemy action and tints the goal cyan.
- Stage clear does not navigate, save, show result, compute rank, or play audio in this slice.
- No runtime code imports from or references `__prototype__`.
