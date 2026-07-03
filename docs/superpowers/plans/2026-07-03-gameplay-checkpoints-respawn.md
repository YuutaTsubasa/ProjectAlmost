# Gameplay Checkpoints / Respawn Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add rebuilt checkpoint beacons and make player death/fall respawn from the latest activated checkpoint spawn point.

**Architecture:** Keep checkpoint progression, respawn derivation, and checkpoint presentation constants in pure `src/domain/gameplay/` modules. Keep Phaser asset loading, ellipses, images, tweens, active checkpoint state, and player position mutation inside `src/ui/gameplay/createGameplayRenderer.ts`. Stage checkpoint data is rebuild-owned and assets are copied into root `public/`.

**Tech Stack:** TypeScript, Vitest, Phaser Arcade Physics, Svelte/Tauri frontend, root `public/` runtime assets.

---

## File Structure

- Create `src/domain/gameplay/playerCheckpoint.ts`
  - Pure checkpoint count, activation selection, and respawn point derivation.
- Create `src/domain/gameplay/playerCheckpoint.test.ts`
  - Covers prototype checkpoint progression behavior and respawn gravity fallback.
- Create `src/domain/gameplay/checkpointActor.ts`
  - Pure checkpoint beacon presentation values and grounded bottom-Y helper.
- Create `src/domain/gameplay/checkpointActor.test.ts`
  - Covers copied prototype constants and asset path boundary.
- Modify `src/domain/gameplay/gameplayMapTypes.ts`
  - Adds `GameplayCheckpointSpawn` and `checkpoints` to `GameplayStageMap`.
- Modify `src/domain/gameplay/gameplayStageMaps.ts`
  - Adds the three rebuilt 1-1 checkpoint entries.
- Modify `src/domain/gameplay/gameplayStageMaps.test.ts`
  - Adds checkpoint asset refs, 1-1 checkpoint data, unique IDs, and world-bound checks.
- Copy `__prototype__/public/assets/props/white_palace_checkpoint.webp`
  - To `public/assets/props/white_palace_checkpoint.webp`.
- Modify `src/ui/gameplay/createGameplayRenderer.ts`
  - Preloads checkpoint asset, creates beacon/glow/ring visuals, activates checkpoints, tracks current respawn point, and respawns from it.
- Modify `src/ui/gameplay/createGameplayRenderer.test.ts`
  - Extends the fake runtime with ellipses and tests checkpoint rendering, activation, monotonic behavior, dead-state blocking, and respawn placement.

## Task 1: Player Checkpoint Rules

**Files:**
- Create: `src/domain/gameplay/playerCheckpoint.test.ts`
- Create: `src/domain/gameplay/playerCheckpoint.ts`

- [ ] **Step 1: Write the failing checkpoint rule tests**

Create `src/domain/gameplay/playerCheckpoint.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  findNextCheckpointIndex,
  getCheckpointRespawnState,
  getCheckpointTargetCount,
  getReachedCheckpointCount,
} from './playerCheckpoint'

describe('player checkpoint counts', () => {
  it('returns zero reached checkpoints before any activation', () => {
    expect(getReachedCheckpointCount({ activeCheckpointIndex: -1 })).toBe(0)
  })

  it('returns one-based reached count from the active checkpoint index', () => {
    expect(getReachedCheckpointCount({ activeCheckpointIndex: 0 })).toBe(1)
    expect(getReachedCheckpointCount({ activeCheckpointIndex: 2 })).toBe(3)
  })

  it('returns the checkpoint target count', () => {
    expect(getCheckpointTargetCount({ checkpoints: [{ x: 10 }, { x: 20 }] })).toBe(2)
  })
})

describe('next checkpoint activation', () => {
  const checkpoints = [{ x: 100 }, { x: 200 }, { x: 300 }]

  it('returns -1 when no checkpoints exist', () => {
    expect(findNextCheckpointIndex({
      checkpoints: [],
      activeCheckpointIndex: -1,
      playerX: 500,
    })).toBe(-1)
  })

  it('ignores checkpoints at or before the active index', () => {
    expect(findNextCheckpointIndex({
      checkpoints,
      activeCheckpointIndex: 1,
      playerX: 250,
    })).toBe(-1)
  })

  it('counts exact X equality as reached', () => {
    expect(findNextCheckpointIndex({
      checkpoints,
      activeCheckpointIndex: -1,
      playerX: 100,
    })).toBe(0)
  })

  it('returns the first later checkpoint reached by player X', () => {
    expect(findNextCheckpointIndex({
      checkpoints,
      activeCheckpointIndex: 0,
      playerX: 350,
    })).toBe(1)
  })

  it('returns -1 when no later checkpoint is reached', () => {
    expect(findNextCheckpointIndex({
      checkpoints,
      activeCheckpointIndex: 0,
      playerX: 150,
    })).toBe(-1)
  })
})

describe('checkpoint respawn state', () => {
  it('maps spawn fields and defaults missing gravity to the current gravity', () => {
    expect(getCheckpointRespawnState({
      checkpoint: {
        spawnX: 2600,
        spawnSurfaceY: 512,
      },
      currentGravity: 'down',
    })).toEqual({
      x: 2600,
      surfaceY: 512,
      gravity: 'down',
    })
  })

  it('preserves explicit spawn gravity', () => {
    expect(getCheckpointRespawnState({
      checkpoint: {
        spawnX: 5900,
        spawnSurfaceY: 576,
        spawnGravity: 'up',
      },
      currentGravity: 'down',
    })).toEqual({
      x: 5900,
      surfaceY: 576,
      gravity: 'up',
    })
  })
})
```

- [ ] **Step 2: Run the focused test and confirm expected failure**

Run:

```bash
npm run test -- src/domain/gameplay/playerCheckpoint.test.ts
```

Expected: FAIL because `src/domain/gameplay/playerCheckpoint.ts` does not exist.

- [ ] **Step 3: Implement the pure checkpoint rules**

Create `src/domain/gameplay/playerCheckpoint.ts`:

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
}): number {
  return input.activeCheckpointIndex + 1
}

export function getCheckpointTargetCount(input: {
  checkpoints: readonly unknown[]
}): number {
  return input.checkpoints.length
}

export function findNextCheckpointIndex(input: {
  checkpoints: readonly CheckpointReachPoint[]
  activeCheckpointIndex: number
  playerX: number
}): number {
  return input.checkpoints.findIndex(
    (checkpoint, index) =>
      index > input.activeCheckpointIndex && input.playerX >= checkpoint.x,
  )
}

export function getCheckpointRespawnState(input: {
  checkpoint: CheckpointRespawnPoint
  currentGravity: PlayerCheckpointGravity
}): PlayerCheckpointRespawnState {
  return {
    x: input.checkpoint.spawnX,
    surfaceY: input.checkpoint.spawnSurfaceY,
    gravity: input.checkpoint.spawnGravity ?? input.currentGravity,
  }
}
```

- [ ] **Step 4: Run the focused test and confirm pass**

Run:

```bash
npm run test -- src/domain/gameplay/playerCheckpoint.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 1**

```bash
git add src/domain/gameplay/playerCheckpoint.ts src/domain/gameplay/playerCheckpoint.test.ts
git commit -m "feat: add gameplay checkpoint rules"
```

## Task 2: Checkpoint Actor Domain

**Files:**
- Create: `src/domain/gameplay/checkpointActor.test.ts`
- Create: `src/domain/gameplay/checkpointActor.ts`

- [ ] **Step 1: Write the failing checkpoint actor tests**

Create `src/domain/gameplay/checkpointActor.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { checkpointActorDefinition, getCheckpointBottomY } from './checkpointActor'

describe('checkpoint actor definition', () => {
  it('defines prototype checkpoint presentation as rebuild-owned asset metadata', () => {
    expect(checkpointActorDefinition).toEqual({
      behavior: 'checkpoint',
      sprite: {
        key: 'checkpoint-beacon',
        assetRef: '/assets/props/white_palace_checkpoint.webp',
      },
      origin: { x: 0.5, y: 1 },
      displaySize: { width: 76, height: 114 },
      visualBottomInset: 0,
      depth: 7,
      inactiveAlpha: 0.82,
      activatedAlpha: 1,
      activatedTint: 0xfff0a8,
      glow: {
        width: 92,
        height: 20,
        yOffset: -3,
        depth: 6,
        alpha: 0.24,
      },
      ring: {
        width: 74,
        height: 74,
        yOffset: -52,
        depth: 8,
        strokeWidth: 3,
        alpha: 0.7,
      },
      idleTween: {
        durationMs: 920,
        indexDelayMs: 130,
        alphaFrom: 0.24,
        alphaTo: 0.68,
        scaleFrom: 0.92,
        scaleTo: 1.14,
        ease: 'Sine.easeInOut',
      },
      activationTween: {
        durationMs: 180,
        spriteScaleMultiplier: 1.12,
      },
    })
  })

  it('keeps checkpoint assets under root public assets', () => {
    expect(checkpointActorDefinition.sprite.assetRef).toBe('/assets/props/white_palace_checkpoint.webp')
    expect(checkpointActorDefinition.sprite.assetRef).not.toContain('__prototype__')
  })

  it('places the visual bottom on the authored surface', () => {
    expect(getCheckpointBottomY({ surfaceY: 512 })).toBe(512)
  })
})
```

- [ ] **Step 2: Run the focused test and confirm expected failure**

Run:

```bash
npm run test -- src/domain/gameplay/checkpointActor.test.ts
```

Expected: FAIL because `src/domain/gameplay/checkpointActor.ts` does not exist.

- [ ] **Step 3: Implement checkpoint actor metadata**

Create `src/domain/gameplay/checkpointActor.ts`:

```ts
export type CheckpointSpriteDefinition = {
  key: string
  assetRef: string
}

export const checkpointActorDefinition = {
  behavior: 'checkpoint',
  sprite: {
    key: 'checkpoint-beacon',
    assetRef: '/assets/props/white_palace_checkpoint.webp',
  },
  origin: { x: 0.5, y: 1 },
  displaySize: { width: 76, height: 114 },
  visualBottomInset: 0,
  depth: 7,
  inactiveAlpha: 0.82,
  activatedAlpha: 1,
  activatedTint: 0xfff0a8,
  glow: {
    width: 92,
    height: 20,
    yOffset: -3,
    depth: 6,
    alpha: 0.24,
  },
  ring: {
    width: 74,
    height: 74,
    yOffset: -52,
    depth: 8,
    strokeWidth: 3,
    alpha: 0.7,
  },
  idleTween: {
    durationMs: 920,
    indexDelayMs: 130,
    alphaFrom: 0.24,
    alphaTo: 0.68,
    scaleFrom: 0.92,
    scaleTo: 1.14,
    ease: 'Sine.easeInOut',
  },
  activationTween: {
    durationMs: 180,
    spriteScaleMultiplier: 1.12,
  },
} as const

export function getCheckpointBottomY(input: {
  surfaceY: number
}): number {
  return input.surfaceY + checkpointActorDefinition.visualBottomInset
}
```

- [ ] **Step 4: Run the focused test and confirm pass**

Run:

```bash
npm run test -- src/domain/gameplay/checkpointActor.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 2**

```bash
git add src/domain/gameplay/checkpointActor.ts src/domain/gameplay/checkpointActor.test.ts
git commit -m "feat: add gameplay checkpoint actor metadata"
```

## Task 3: Stage Checkpoint Data And Asset Boundary

**Files:**
- Modify: `src/domain/gameplay/gameplayMapTypes.ts`
- Modify: `src/domain/gameplay/gameplayStageMaps.ts`
- Modify: `src/domain/gameplay/gameplayStageMaps.test.ts`
- Copy: `__prototype__/public/assets/props/white_palace_checkpoint.webp` to `public/assets/props/white_palace_checkpoint.webp`

- [ ] **Step 1: Write failing stage data tests**

Modify `src/domain/gameplay/gameplayStageMaps.test.ts`:

```ts
import { checkpointActorDefinition } from './checkpointActor'
```

Add `checkpointActorDefinition.sprite.assetRef` to the `assetRefs` array after hazard asset refs:

```ts
      ...hazardAssetRefs,
      checkpointActorDefinition.sprite.assetRef,
```

Add `'/assets/props/white_palace_checkpoint.webp'` to the expected asset refs array after `'/assets/props/emerald_sanctuary_spikes.webp'`.

Add these tests:

```ts
  it('defines prototype-inspired checkpoints for the first gameplay stage', () => {
    const stage = getGameplayStageMap('1-1')
    expect(stage).toBeDefined()
    if (!stage) return

    expect(stage.checkpoints).toEqual([
      {
        id: 'combat-gate',
        x: 2540,
        surfaceY: 512,
        spawnX: 2600,
        spawnSurfaceY: 512,
      },
      {
        id: 'final-ascent',
        x: 4320,
        surfaceY: 512,
        spawnX: 4380,
        spawnSurfaceY: 512,
      },
      {
        id: 'final-trial',
        x: 7300,
        surfaceY: 512,
        spawnX: 7360,
        spawnSurfaceY: 512,
      },
    ])
  })

  it('keeps gameplay checkpoint ids unique within each stage', () => {
    for (const stageId of gameplayStageMaps.order) {
      const stage = getGameplayStageMap(stageId)
      expect(stage).toBeDefined()
      if (!stage) continue

      const ids = stage.checkpoints.map((checkpoint) => checkpoint.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('places gameplay checkpoints and respawn points inside their stage world bounds', () => {
    for (const stageId of gameplayStageMaps.order) {
      const stage = getGameplayStageMap(stageId)
      expect(stage).toBeDefined()
      if (!stage) continue

      expect(
        stage.checkpoints.every((checkpoint) =>
          Number.isFinite(checkpoint.x)
          && Number.isFinite(checkpoint.surfaceY)
          && Number.isFinite(checkpoint.spawnX)
          && Number.isFinite(checkpoint.spawnSurfaceY)
          && checkpoint.x >= 0
          && checkpoint.x <= stage.world.width
          && checkpoint.surfaceY >= 0
          && checkpoint.surfaceY <= stage.world.height
          && checkpoint.spawnX >= 0
          && checkpoint.spawnX <= stage.world.width
          && checkpoint.spawnSurfaceY >= 0
          && checkpoint.spawnSurfaceY <= stage.world.height,
        ),
      ).toBe(true)
    }
  })
```

- [ ] **Step 2: Run the focused test and confirm expected failure**

Run:

```bash
npm run test -- src/domain/gameplay/gameplayStageMaps.test.ts
```

Expected: FAIL because `GameplayStageMap` has no `checkpoints` field and the 1-1 data has no checkpoint entries.

- [ ] **Step 3: Extend map types**

Modify `src/domain/gameplay/gameplayMapTypes.ts` so `GameplayStageMap` includes `checkpoints` between `hazards` and `terrain`:

```ts
  hazards: readonly GameplayHazardSpawn[]
  checkpoints: readonly GameplayCheckpointSpawn[]
  terrain: TerrainDefinition
```

Add this type after `GameplayHazardSpawn`:

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

- [ ] **Step 4: Add rebuilt 1-1 checkpoint data**

Modify `src/domain/gameplay/gameplayStageMaps.ts` and add `checkpoints` after `hazards`:

```ts
  checkpoints: [
    {
      id: 'combat-gate',
      x: 2540,
      surfaceY: 512,
      spawnX: 2600,
      spawnSurfaceY: 512,
    },
    {
      id: 'final-ascent',
      x: 4320,
      surfaceY: 512,
      spawnX: 4380,
      spawnSurfaceY: 512,
    },
    {
      id: 'final-trial',
      x: 7300,
      surfaceY: 512,
      spawnX: 7360,
      spawnSurfaceY: 512,
    },
  ],
```

- [ ] **Step 5: Copy the checkpoint image into root public assets**

Run:

```bash
mkdir -p public/assets/props
cp __prototype__/public/assets/props/white_palace_checkpoint.webp public/assets/props/white_palace_checkpoint.webp
```

Expected: `public/assets/props/white_palace_checkpoint.webp` exists and `git status --short` shows it as a new file.

- [ ] **Step 6: Run the focused tests and confirm pass**

Run:

```bash
npm run test -- src/domain/gameplay/gameplayStageMaps.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit Task 3**

```bash
git add src/domain/gameplay/gameplayMapTypes.ts src/domain/gameplay/gameplayStageMaps.ts src/domain/gameplay/gameplayStageMaps.test.ts public/assets/props/white_palace_checkpoint.webp
git commit -m "feat: add gameplay checkpoint stage data"
```

## Task 4: Checkpoint Preload And Visual Rendering

**Files:**
- Modify: `src/ui/gameplay/createGameplayRenderer.test.ts`
- Modify: `src/ui/gameplay/createGameplayRenderer.ts`

- [ ] **Step 1: Write failing renderer preload and visual tests**

Modify `src/ui/gameplay/createGameplayRenderer.test.ts` imports:

```ts
import { checkpointActorDefinition, getCheckpointBottomY } from '../../domain/gameplay/checkpointActor'
```

Add fake ellipse support near `createFakeImage`:

```ts
function createFakeEllipse(input: {
  x: number
  y: number
  width: number
  height: number
  fillColor?: number
  fillAlpha?: number
}) {
  const ellipse = {
    ...input,
    depth: 0,
    alpha: input.fillAlpha ?? 1,
    scale: 1,
    blendMode: undefined as string | undefined,
    strokeStyle: undefined as { width: number; color: number; alpha?: number } | undefined,
    fillStyle: undefined as { color: number; alpha?: number } | undefined,
    setDepth: (value: number) => {
      ellipse.depth = value
      return ellipse
    },
    setBlendMode: (value: string) => {
      ellipse.blendMode = value
      return ellipse
    },
    setAlpha: (value: number) => {
      ellipse.alpha = value
      return ellipse
    },
    setScale: (value: number) => {
      ellipse.scale = value
      return ellipse
    },
    setStrokeStyle: (width: number, color: number, alpha?: number) => {
      ellipse.strokeStyle = { width, color, alpha }
      return ellipse
    },
    setFillStyle: (color: number, alpha?: number) => {
      ellipse.fillStyle = { color, alpha }
      ellipse.fillColor = color
      ellipse.fillAlpha = alpha
      return ellipse
    },
  }

  return ellipse
}
```

Extend the fake scene `add` type with:

```ts
      ellipse: (
        x: number,
        y: number,
        width: number,
        height: number,
        fillColor?: number,
        fillAlpha?: number,
      ) => ReturnType<typeof createFakeEllipse>
```

Add runtime storage:

```ts
  const ellipses: Array<ReturnType<typeof createFakeEllipse>> = []
```

Add the fake `scene.add.ellipse` implementation:

```ts
    ellipse: (x, y, width, height, fillColor, fillAlpha) => {
      const ellipse = createFakeEllipse({ x, y, width, height, fillColor, fillAlpha })
      ellipses.push(ellipse)
      return ellipse
    },
```

Return `ellipses` from `createSceneRuntime`.

Add these tests in `describe('createGameplayRendererConfig', ...)`:

```ts
  it('preloads the checkpoint beacon image from the domain actor definition', () => {
    const runtime = createSceneRuntime()

    runtime.scene.preload()

    expect(runtime.imageCalls).toContainEqual({
      key: checkpointActorDefinition.sprite.key,
      assetRef: checkpointActorDefinition.sprite.assetRef,
    })
  })

  it('creates checkpoint beacon visuals from stage data', () => {
    const runtime = createSceneRuntime()

    runtime.scene.create()

    const checkpoint = runtime.stage.checkpoints[0]
    expect(checkpoint).toBeDefined()
    if (!checkpoint) return

    const bottomY = getCheckpointBottomY({ surfaceY: checkpoint.surfaceY })
    const sprite = runtime.images.find(
      (image) => image.texture === checkpointActorDefinition.sprite.key && image.x === checkpoint.x,
    )
    expect(sprite).toBeDefined()
    if (!sprite) return

    expect(sprite).toMatchObject({
      x: checkpoint.x,
      y: bottomY,
      alpha: checkpointActorDefinition.inactiveAlpha,
      depth: checkpointActorDefinition.depth,
    })
    expect(sprite.origin).toEqual(checkpointActorDefinition.origin)
    expect(sprite.displaySize).toEqual(checkpointActorDefinition.displaySize)

    expect(runtime.ellipses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          x: checkpoint.x,
          y: bottomY + checkpointActorDefinition.glow.yOffset,
          width: checkpointActorDefinition.glow.width,
          height: checkpointActorDefinition.glow.height,
          fillColor: 0x4be8ff,
          fillAlpha: checkpointActorDefinition.glow.alpha,
          depth: checkpointActorDefinition.glow.depth,
          blendMode: 'ADD',
        }),
        expect.objectContaining({
          x: checkpoint.x,
          y: bottomY + checkpointActorDefinition.ring.yOffset,
          width: checkpointActorDefinition.ring.width,
          height: checkpointActorDefinition.ring.height,
          depth: checkpointActorDefinition.ring.depth,
          blendMode: 'ADD',
          strokeStyle: {
            width: checkpointActorDefinition.ring.strokeWidth,
            color: 0x4be8ff,
            alpha: checkpointActorDefinition.ring.alpha,
          },
        }),
      ]),
    )
    expect(runtime.tweenCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          targets: expect.arrayContaining([
            expect.objectContaining({ x: checkpoint.x, y: bottomY + checkpointActorDefinition.glow.yOffset }),
            expect.objectContaining({ x: checkpoint.x, y: bottomY + checkpointActorDefinition.ring.yOffset }),
          ]),
          alpha: {
            from: checkpointActorDefinition.idleTween.alphaFrom,
            to: checkpointActorDefinition.idleTween.alphaTo,
          },
          scale: {
            from: checkpointActorDefinition.idleTween.scaleFrom,
            to: checkpointActorDefinition.idleTween.scaleTo,
          },
          duration: checkpointActorDefinition.idleTween.durationMs,
          ease: checkpointActorDefinition.idleTween.ease,
          yoyo: true,
          repeat: -1,
        }),
      ]),
    )
  })
```

- [ ] **Step 2: Run the renderer test and confirm expected failure**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: FAIL because `scene.add.ellipse` is not used by the renderer and checkpoint images are not preloaded or created.

- [ ] **Step 3: Add checkpoint runtime types and preload**

Modify `src/ui/gameplay/createGameplayRenderer.ts` imports:

```ts
import { checkpointActorDefinition, getCheckpointBottomY } from '../../domain/gameplay/checkpointActor'
import type { GameplayCheckpointSpawn } from '../../domain/gameplay/gameplayMapTypes'
```

Add runtime type near `HazardRuntime` and `CoinRuntime`:

```ts
type CheckpointRuntime = {
  sprite: Phaser.GameObjects.Image
  glow: Phaser.GameObjects.Ellipse
  ring: Phaser.GameObjects.Ellipse
  spawn: GameplayCheckpointSpawn
  activated: boolean
}
```

Add scene field:

```ts
  private checkpoints: CheckpointRuntime[] = []
```

Add this in `preload()` after hazard asset loading:

```ts
    this.load.image(checkpointActorDefinition.sprite.key, checkpointActorDefinition.sprite.assetRef)
```

- [ ] **Step 4: Create checkpoint visuals**

Add constants near other presentation constants:

```ts
const checkpointInactiveTint = 0x4be8ff
const checkpointActivatedTint = 0xfff0a8
```

Call `this.createCheckpoints()` in `create()` after `this.createHazards()` and before `this.createCoins()`.

Add this method:

```ts
  private createCheckpoints(): void {
    this.checkpoints = this.stageMap.checkpoints.map((spawn, index) => {
      const bottomY = getCheckpointBottomY({ surfaceY: spawn.surfaceY })
      const glow = this.add
        .ellipse(
          spawn.x,
          bottomY + checkpointActorDefinition.glow.yOffset,
          checkpointActorDefinition.glow.width,
          checkpointActorDefinition.glow.height,
          checkpointInactiveTint,
          checkpointActorDefinition.glow.alpha,
        )
        .setDepth(checkpointActorDefinition.glow.depth)
        .setBlendMode(Phaser.BlendModes.ADD)
      const ring = this.add
        .ellipse(
          spawn.x,
          bottomY + checkpointActorDefinition.ring.yOffset,
          checkpointActorDefinition.ring.width,
          checkpointActorDefinition.ring.height,
        )
        .setStrokeStyle(
          checkpointActorDefinition.ring.strokeWidth,
          checkpointInactiveTint,
          checkpointActorDefinition.ring.alpha,
        )
        .setDepth(checkpointActorDefinition.ring.depth)
        .setBlendMode(Phaser.BlendModes.ADD)
      const sprite = this.add
        .image(spawn.x, bottomY, checkpointActorDefinition.sprite.key)
        .setOrigin(checkpointActorDefinition.origin.x, checkpointActorDefinition.origin.y)
        .setDisplaySize(
          checkpointActorDefinition.displaySize.width,
          checkpointActorDefinition.displaySize.height,
        )
        .setAlpha(checkpointActorDefinition.inactiveAlpha)
        .setDepth(checkpointActorDefinition.depth)

      this.tweens.add({
        targets: [glow, ring],
        alpha: {
          from: checkpointActorDefinition.idleTween.alphaFrom,
          to: checkpointActorDefinition.idleTween.alphaTo,
        },
        scale: {
          from: checkpointActorDefinition.idleTween.scaleFrom,
          to: checkpointActorDefinition.idleTween.scaleTo,
        },
        duration: checkpointActorDefinition.idleTween.durationMs
          + index * checkpointActorDefinition.idleTween.indexDelayMs,
        ease: checkpointActorDefinition.idleTween.ease,
        yoyo: true,
        repeat: -1,
      })

      return {
        sprite,
        glow,
        ring,
        spawn,
        activated: false,
      }
    })
  }
```

TypeScript may require the fake `createFakeImage` to support `origin`, `displaySize`, `setOrigin`, and `setDisplaySize`. Add these to the fake image object:

```ts
    origin: { x: 0, y: 0 },
    displaySize: { width: 0, height: 0 },
    setOrigin: (x: number, y: number) => {
      image.origin = { x, y }
      return image
    },
    setDisplaySize: (width: number, height: number) => {
      image.displaySize = { width, height }
      return image
    },
```

- [ ] **Step 5: Run the renderer test and confirm pass**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 4**

```bash
git add src/ui/gameplay/createGameplayRenderer.ts src/ui/gameplay/createGameplayRenderer.test.ts
git commit -m "feat: render gameplay checkpoints"
```

## Task 5: Checkpoint Activation State

**Files:**
- Modify: `src/ui/gameplay/createGameplayRenderer.test.ts`
- Modify: `src/ui/gameplay/createGameplayRenderer.ts`

- [ ] **Step 1: Write failing activation tests**

Add this helper in `src/ui/gameplay/createGameplayRenderer.test.ts` after `createHazardStage()`:

```ts
function getCheckpointSprite(runtime: FakeRuntime, checkpointId: string) {
  const checkpoint = runtime.stage.checkpoints.find((candidate) => candidate.id === checkpointId)
  expect(checkpoint).toBeDefined()
  if (!checkpoint) {
    throw new Error(`Missing checkpoint ${checkpointId}.`)
  }

  const sprite = runtime.images.find(
    (image) => image.texture === checkpointActorDefinition.sprite.key && image.x === checkpoint.x,
  )
  expect(sprite).toBeDefined()
  if (!sprite) {
    throw new Error(`Missing checkpoint sprite ${checkpointId}.`)
  }

  return { checkpoint, sprite }
}
```

Add these tests:

```ts
  it('activates a checkpoint when the player reaches the checkpoint X coordinate', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return

    const { checkpoint, sprite } = getCheckpointSprite(runtime, 'combat-gate')
    runtime.playerSprite.x = checkpoint.x
    runtime.scene.update()

    expect(sprite.alpha).toBe(checkpointActorDefinition.activatedAlpha)
    expect(sprite.tint).toBe(checkpointActorDefinition.activatedTint)
    expect(runtime.tweenCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          targets: sprite,
          scale: checkpointActorDefinition.activationTween.spriteScaleMultiplier,
          duration: checkpointActorDefinition.activationTween.durationMs,
          yoyo: true,
        }),
      ]),
    )
  })

  it('does not reactivate the same checkpoint on repeated updates', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return

    const { checkpoint, sprite } = getCheckpointSprite(runtime, 'combat-gate')
    runtime.playerSprite.x = checkpoint.x
    runtime.scene.update()
    const tweenCountAfterFirstActivation = runtime.tweenCalls.filter((call) => call.targets === sprite).length

    runtime.scene.update()

    expect(runtime.tweenCalls.filter((call) => call.targets === sprite)).toHaveLength(tweenCountAfterFirstActivation)
  })

  it('activates only the first later checkpoint when the player moves past multiple checkpoints', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return

    const first = getCheckpointSprite(runtime, 'combat-gate')
    const second = getCheckpointSprite(runtime, 'final-ascent')
    runtime.playerSprite.x = second.checkpoint.x + 100
    runtime.scene.update()

    expect(first.sprite.alpha).toBe(checkpointActorDefinition.activatedAlpha)
    expect(second.sprite.alpha).toBe(checkpointActorDefinition.inactiveAlpha)
  })

  it('skips checkpoint scanning while the player is dead', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return

    const { checkpoint, sprite } = getCheckpointSprite(runtime, 'combat-gate')
    ;(runtime.scene as unknown as { isPlayerDead: boolean }).isPlayerDead = true
    runtime.playerSprite.x = checkpoint.x
    runtime.scene.update()

    expect(sprite.alpha).toBe(checkpointActorDefinition.inactiveAlpha)
    expect(sprite.tint).toBeUndefined()
  })
```

- [ ] **Step 2: Run the renderer test and confirm expected failure**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: FAIL because checkpoint scanning and activation are not implemented.

- [ ] **Step 3: Add checkpoint activation fields and imports**

Modify `src/ui/gameplay/createGameplayRenderer.ts` imports:

```ts
import {
  findNextCheckpointIndex,
  getCheckpointRespawnState,
  type PlayerCheckpointGravity,
} from '../../domain/gameplay/playerCheckpoint'
```

Add type near `CheckpointRuntime`:

```ts
type CurrentRespawnPoint = {
  x: number
  surfaceY: number
  gravity: PlayerCheckpointGravity
}
```

Add scene fields after `private checkpoints`:

```ts
  private activeCheckpointIndex = -1
  private currentRespawnPoint: CurrentRespawnPoint
```

Initialize `currentRespawnPoint` in the constructor:

```ts
    this.currentRespawnPoint = {
      x: stage.player.spawn.x,
      surfaceY: stage.player.spawn.surfaceY,
      gravity: 'down',
    }
```

- [ ] **Step 4: Implement update scanning and activation**

Call `this.updateCheckpoints()` in `update()` after `this.updateCoins()` and before `this.checkPlayerOutOfBounds()`.

Add methods:

```ts
  private updateCheckpoints(): void {
    if (!this.player || this.isPlayerDead) return

    const nextCheckpointIndex = findNextCheckpointIndex({
      checkpoints: this.stageMap.checkpoints,
      activeCheckpointIndex: this.activeCheckpointIndex,
      playerX: this.player.x,
    })
    if (nextCheckpointIndex === -1) {
      return
    }

    const checkpoint = this.checkpoints[nextCheckpointIndex]
    if (!checkpoint) {
      return
    }

    this.activateCheckpoint(nextCheckpointIndex, checkpoint)
  }

  private activateCheckpoint(index: number, checkpoint: CheckpointRuntime): void {
    if (checkpoint.activated) return

    this.activeCheckpointIndex = index
    checkpoint.activated = true
    this.currentRespawnPoint = getCheckpointRespawnState({
      checkpoint: checkpoint.spawn,
      currentGravity: this.currentRespawnPoint.gravity,
    })

    checkpoint.sprite
      .setAlpha(checkpointActorDefinition.activatedAlpha)
      .setTint(checkpointActorDefinition.activatedTint)
    checkpoint.glow.setFillStyle(checkpointActivatedTint, 0.7)
    checkpoint.ring.setStrokeStyle(4, checkpointActivatedTint, 1)

    this.tweens.add({
      targets: checkpoint.sprite,
      scale: checkpointActorDefinition.activationTween.spriteScaleMultiplier,
      duration: checkpointActorDefinition.activationTween.durationMs,
      yoyo: true,
    })
    this.tweens.add({
      targets: [checkpoint.glow, checkpoint.ring],
      alpha: 1,
      duration: checkpointActorDefinition.activationTween.durationMs,
      yoyo: true,
    })
  }
```

- [ ] **Step 5: Run the renderer test and confirm pass**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 5**

```bash
git add src/ui/gameplay/createGameplayRenderer.ts src/ui/gameplay/createGameplayRenderer.test.ts
git commit -m "feat: activate gameplay checkpoints"
```

## Task 6: Respawn From Activated Checkpoint

**Files:**
- Modify: `src/ui/gameplay/createGameplayRenderer.test.ts`
- Modify: `src/ui/gameplay/createGameplayRenderer.ts`

- [ ] **Step 1: Write failing respawn placement tests**

Add these tests beside the existing death respawn tests:

```ts
  it('keeps stage spawn respawn before activating any checkpoint', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const guard = runtime.sprites.find((sprite) => sprite.texture === 'enemy-guard-walk')
    expect(guard).toBeDefined()
    expect(runtime.playerSprite).toBeDefined()
    if (!guard || !runtime.playerSprite) return

    runtime.playerSprite.x = 2400
    guard.x = 2460
    runtime.triggerEnemyOverlap(guard)
    recoverFromSurvivedHurt(runtime)
    runtime.triggerEnemyOverlap(guard)
    recoverFromSurvivedHurt(runtime)
    runtime.triggerEnemyOverlap(guard)
    runtime.runDelayedCalls(playerLifeTiming.deathRespawnDelayMs)
    runtime.triggerFadeOutComplete()

    expect(runtime.playerSprite.x).toBe(runtime.stage.player.spawn.x)
    expect(runtime.playerSprite.y).toBe(436)
  })

  it('respawns at the activated checkpoint spawn after death', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    const guard = runtime.sprites.find((sprite) => sprite.texture === 'enemy-guard-walk')
    expect(guard).toBeDefined()
    expect(runtime.playerSprite).toBeDefined()
    if (!guard || !runtime.playerSprite) return

    const { checkpoint } = getCheckpointSprite(runtime, 'combat-gate')
    runtime.playerSprite.x = checkpoint.x
    runtime.scene.update()

    guard.x = checkpoint.spawnX + 60
    runtime.triggerEnemyOverlap(guard)
    recoverFromSurvivedHurt(runtime)
    runtime.triggerEnemyOverlap(guard)
    recoverFromSurvivedHurt(runtime)
    runtime.triggerEnemyOverlap(guard)

    runtime.runDelayedCalls(playerLifeTiming.deathRespawnDelayMs)
    expect(runtime.playerSprite.x).toBe(checkpoint.x)
    expect(runtime.cameraFadeInCalls).toHaveLength(0)

    runtime.triggerFadeOutComplete()

    expect(runtime.playerSprite.x).toBe(checkpoint.spawnX)
    expect(runtime.playerSprite.y).toBe(436)
    expect(runtime.playerSprite.velocityX).toBe(0)
    expect(runtime.playerSprite.velocityY).toBe(0)
    expect(runtime.playerSprite.alpha).toBe(1)
    expect(runtime.playerSprite.playCalls.at(-1)).toEqual({
      key: playerActorDefinition.sprites.idle.key,
      ignoreIfPlaying: true,
    })
  })
```

- [ ] **Step 2: Run the renderer test and confirm expected failure**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: FAIL because `respawnPlayer()` still reads `stageMap.player.spawn`.

- [ ] **Step 3: Make respawn use current checkpoint-aware spawn**

Modify `respawnPlayer()` in `src/ui/gameplay/createGameplayRenderer.ts`:

```ts
    this.player.x = this.currentRespawnPoint.x
    this.player.y = getPlayerCenterY({ surfaceY: this.currentRespawnPoint.surfaceY })
```

Keep the rest of `respawnPlayer()` unchanged so health, invulnerability, attack, jump state, velocity, alpha, body enablement, Homing state, and idle animation still reset exactly as before.

- [ ] **Step 4: Run the renderer test and confirm pass**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 6**

```bash
git add src/ui/gameplay/createGameplayRenderer.ts src/ui/gameplay/createGameplayRenderer.test.ts
git commit -m "feat: respawn player at gameplay checkpoints"
```

## Task 7: Full Verification

**Files:**
- No source edits expected unless verification exposes a defect.

- [ ] **Step 1: Run focused domain tests**

Run:

```bash
npm run test -- src/domain/gameplay/playerCheckpoint.test.ts src/domain/gameplay/checkpointActor.test.ts src/domain/gameplay/gameplayStageMaps.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run focused renderer tests**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run full test suite**

Run:

```bash
npm run test
```

Expected: PASS.

- [ ] **Step 4: Run Svelte/TypeScript check**

Run:

```bash
npm run check
```

Expected: PASS with 0 errors and 0 warnings.

- [ ] **Step 5: Run production build**

Run:

```bash
npm run build
```

Expected: PASS. The existing Vite chunk-size warning is acceptable if no new build error appears.

- [ ] **Step 6: Run whitespace/path sanity checks**

Run:

```bash
git diff --check
rg "__prototype__" src public --glob '!**/*.test.ts'
```

Expected: `git diff --check` has no output. `rg "__prototype__" src public --glob '!**/*.test.ts'` has no output.

- [ ] **Step 7: Commit verification-only fixes if needed**

If any verification step exposes a defect, write the smallest failing test that captures the defect, fix it, rerun the failed verification plus the relevant full check, then commit with a message matching the fix scope, for example:

```bash
git add src/ui/gameplay/createGameplayRenderer.ts src/ui/gameplay/createGameplayRenderer.test.ts
git commit -m "fix: preserve checkpoint respawn during death transition"
```

If all verification passes without code changes, do not create a verification-only commit.

## Self-Review

- Spec coverage: Tasks 1 and 2 cover pure checkpoint rules and actor metadata. Task 3 covers stage data and root public asset ownership. Tasks 4 through 6 cover preload, rendering, activation, monotonic progression, dead-state blocking, current respawn state, and death respawn placement. Task 7 covers required project checks and no runtime `__prototype__` references.
- Placeholder scan: The plan contains no unresolved placeholder markers or open-ended deferred steps. Every code-changing task has concrete code or exact insertion snippets, commands, and expected results.
- Type consistency: `GameplayCheckpointSpawn`, `CheckpointRuntime`, `CurrentRespawnPoint`, `checkpointActorDefinition`, `findNextCheckpointIndex`, and `getCheckpointRespawnState` are introduced before renderer usage and keep the same names throughout the plan.
