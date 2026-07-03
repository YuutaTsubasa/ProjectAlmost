# Gameplay Stage Goal / Clear Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the rebuilt stage goal object and clear gate so player overlap with the 1-1 goal clears gameplay exactly once and freezes active gameplay systems.

**Architecture:** Keep stage clear rules and goal actor metadata in pure `src/domain/gameplay/` modules. Keep Phaser asset loading, animation creation, static body setup, overlap callbacks, clear-state mutation, and post-clear gating inside `src/ui/gameplay/createGameplayRenderer.ts`. Stage goal data and the copied goal sprite sheet are rebuild-owned root project artifacts.

**Tech Stack:** TypeScript, Vitest, Phaser Arcade Physics, Svelte/Tauri frontend, root `public/` runtime assets.

---

## File Structure

- Create `src/domain/gameplay/stageClear.ts`
  - Pure clear eligibility and clear-state transition values.
- Create `src/domain/gameplay/stageClear.test.ts`
  - Covers duplicate-clear blocking and fresh transition object creation.
- Create `src/domain/gameplay/goalActor.ts`
  - Pure goal sprite, animation, placement, body, depth, tint, and bottom-Y metadata.
- Create `src/domain/gameplay/goalActor.test.ts`
  - Covers prototype constants and root public asset path.
- Modify `src/domain/gameplay/gameplayMapTypes.ts`
  - Adds `GameplayGoalSpawn` and `goal` to `GameplayStageMap`.
- Modify `src/domain/gameplay/gameplayStageMaps.ts`
  - Adds the rebuilt `1-1` goal at `{ x: 9340, surfaceY: 512 }`.
- Modify `src/domain/gameplay/gameplayStageMaps.test.ts`
  - Adds goal asset refs, exact `1-1` goal data, world bounds, and platform-surface checks.
- Copy `__prototype__/public/assets/props/white_palace_goal_idle.webp`
  - To `public/assets/props/white_palace_goal_idle.webp`.
- Modify `src/ui/gameplay/createGameplayRenderer.ts`
  - Preloads goal spritesheet, creates idle animation, creates static goal body, wires overlap, completes stage once, and gates gameplay systems after clear.
- Modify `src/ui/gameplay/createGameplayRenderer.test.ts`
  - Tests preload, animation, rendering/body setup, overlap, idempotent clear, and post-clear gating.

## Task 1: Stage Clear Domain Rules

**Files:**
- Create: `src/domain/gameplay/stageClear.test.ts`
- Create: `src/domain/gameplay/stageClear.ts`

- [ ] **Step 1: Write the failing stage clear tests**

Create `src/domain/gameplay/stageClear.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { canCompleteStage, getStageClearState } from './stageClear'

describe('stage clear gate', () => {
  it('allows stage completion before the stage is cleared', () => {
    expect(canCompleteStage({ stageCleared: false })).toBe(true)
  })

  it('blocks duplicate stage completion after the stage is cleared', () => {
    expect(canCompleteStage({ stageCleared: true })).toBe(false)
  })
})

describe('stage clear state', () => {
  it('returns the prototype clear-state transition values', () => {
    expect(getStageClearState()).toEqual({
      stageCleared: true,
      attacking: false,
      homingAttacking: false,
      attackReady: false,
    })
  })

  it('returns a fresh state object', () => {
    const first = getStageClearState()
    const second = getStageClearState()

    expect(first).toEqual(second)
    expect(first).not.toBe(second)
  })
})
```

- [ ] **Step 2: Run the focused test and confirm expected failure**

Run:

```bash
npm run test -- src/domain/gameplay/stageClear.test.ts
```

Expected: FAIL because `src/domain/gameplay/stageClear.ts` does not exist.

- [ ] **Step 3: Implement the pure stage clear rules**

Create `src/domain/gameplay/stageClear.ts`:

```ts
export type StageClearState = {
  stageCleared: boolean
  attacking: boolean
  homingAttacking: boolean
  attackReady: boolean
}

export function canCompleteStage(input: {
  stageCleared: boolean
}): boolean {
  return !input.stageCleared
}

export function getStageClearState(): StageClearState {
  return {
    stageCleared: true,
    attacking: false,
    homingAttacking: false,
    attackReady: false,
  }
}
```

- [ ] **Step 4: Run the focused test and confirm pass**

Run:

```bash
npm run test -- src/domain/gameplay/stageClear.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 1**

```bash
git add src/domain/gameplay/stageClear.ts src/domain/gameplay/stageClear.test.ts
git commit -m "feat: add gameplay stage clear rules"
```

## Task 2: Goal Actor Domain Metadata

**Files:**
- Create: `src/domain/gameplay/goalActor.test.ts`
- Create: `src/domain/gameplay/goalActor.ts`

- [ ] **Step 1: Write the failing goal actor tests**

Create `src/domain/gameplay/goalActor.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getGoalBottomY, goalActorDefinition } from './goalActor'

describe('goal actor definition', () => {
  it('defines prototype goal presentation as rebuild-owned asset metadata', () => {
    expect(goalActorDefinition).toEqual({
      behavior: 'goal',
      sprite: {
        key: 'stage-goal',
        assetRef: '/assets/props/white_palace_goal_idle.webp',
        frameWidth: 128,
        frameHeight: 160,
      },
      animation: {
        idleKey: 'stage-goal-idle',
        frameStart: 0,
        frameEnd: 3,
        frameRate: 5,
        repeat: -1,
        yoyo: true,
      },
      origin: { x: 0.5, y: 1 },
      displaySize: { width: 96, height: 128 },
      body: { width: 52, height: 112, offsetX: 22, offsetY: 16 },
      visualBottomInset: 6,
      depth: 8,
      activatedTint: 0x4be8ff,
    })
  })

  it('keeps goal assets under root public assets', () => {
    expect(goalActorDefinition.sprite.assetRef).toBe('/assets/props/white_palace_goal_idle.webp')
    expect(goalActorDefinition.sprite.assetRef).not.toContain('__prototype__')
  })

  it('places the visual bottom using the prototype bottom inset', () => {
    expect(getGoalBottomY({ surfaceY: 512 })).toBe(518)
  })
})
```

- [ ] **Step 2: Run the focused test and confirm expected failure**

Run:

```bash
npm run test -- src/domain/gameplay/goalActor.test.ts
```

Expected: FAIL because `src/domain/gameplay/goalActor.ts` does not exist.

- [ ] **Step 3: Implement goal actor metadata**

Create `src/domain/gameplay/goalActor.ts`:

```ts
export type GoalSpriteDefinition = {
  key: string
  assetRef: string
  frameWidth: number
  frameHeight: number
}

export const goalActorDefinition = {
  behavior: 'goal',
  sprite: {
    key: 'stage-goal',
    assetRef: '/assets/props/white_palace_goal_idle.webp',
    frameWidth: 128,
    frameHeight: 160,
  },
  animation: {
    idleKey: 'stage-goal-idle',
    frameStart: 0,
    frameEnd: 3,
    frameRate: 5,
    repeat: -1,
    yoyo: true,
  },
  origin: { x: 0.5, y: 1 },
  displaySize: { width: 96, height: 128 },
  body: { width: 52, height: 112, offsetX: 22, offsetY: 16 },
  visualBottomInset: 6,
  depth: 8,
  activatedTint: 0x4be8ff,
} as const

export function getGoalBottomY(input: {
  surfaceY: number
}): number {
  return input.surfaceY + goalActorDefinition.visualBottomInset
}
```

- [ ] **Step 4: Run the focused test and confirm pass**

Run:

```bash
npm run test -- src/domain/gameplay/goalActor.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 2**

```bash
git add src/domain/gameplay/goalActor.ts src/domain/gameplay/goalActor.test.ts
git commit -m "feat: add gameplay goal actor metadata"
```

## Task 3: Stage Goal Data And Asset Boundary

**Files:**
- Modify: `src/domain/gameplay/gameplayMapTypes.ts`
- Modify: `src/domain/gameplay/gameplayStageMaps.ts`
- Modify: `src/domain/gameplay/gameplayStageMaps.test.ts`
- Copy: `__prototype__/public/assets/props/white_palace_goal_idle.webp` to `public/assets/props/white_palace_goal_idle.webp`

- [ ] **Step 1: Write failing stage goal tests**

Modify `src/domain/gameplay/gameplayStageMaps.test.ts`:

```ts
import { goalActorDefinition } from './goalActor'
```

Add `goalActorDefinition.sprite.assetRef` to the `assetRefs` array after checkpoint asset refs:

```ts
      goalActorDefinition.sprite.assetRef,
```

Add `'/assets/props/white_palace_goal_idle.webp'` to the expected asset refs array after `'/assets/props/white_palace_checkpoint.webp'`.

Add these tests:

```ts
  it('defines the prototype-inspired goal for the first gameplay stage', () => {
    const stage = getGameplayStageMap('1-1')
    expect(stage).toBeDefined()
    if (!stage) return

    expect(stage.goal).toEqual({
      x: 9340,
      surfaceY: 512,
    })
  })

  it('places gameplay goals inside their stage world bounds', () => {
    for (const stageId of gameplayStageMaps.order) {
      const stage = getGameplayStageMap(stageId)
      expect(stage).toBeDefined()
      if (!stage) continue

      expect(Number.isFinite(stage.goal.x)).toBe(true)
      expect(Number.isFinite(stage.goal.surfaceY)).toBe(true)
      expect(stage.goal.x).toBeGreaterThanOrEqual(0)
      expect(stage.goal.x).toBeLessThanOrEqual(stage.world.width)
      expect(stage.goal.surfaceY).toBeGreaterThanOrEqual(0)
      expect(stage.goal.surfaceY).toBeLessThanOrEqual(stage.world.height)
    }
  })

  it('places the first gameplay goal on an authored platform surface', () => {
    const stage = getGameplayStageMap('1-1')
    expect(stage).toBeDefined()
    if (!stage) return

    const platform = stage.terrain.platforms.find(
      (candidate) =>
        candidate.row * stage.world.tileSize === stage.goal.surfaceY
        && stage.goal.x >= candidate.col * stage.world.tileSize
        && stage.goal.x <= (candidate.col + candidate.width) * stage.world.tileSize,
    )

    expect(platform).toBeDefined()
  })
```

- [ ] **Step 2: Run the focused test and confirm expected failure**

Run:

```bash
npm run test -- src/domain/gameplay/gameplayStageMaps.test.ts
```

Expected: FAIL because `GameplayStageMap` has no `goal` field and the `1-1` map has no goal data.

- [ ] **Step 3: Extend map types**

Modify `src/domain/gameplay/gameplayMapTypes.ts` so `GameplayStageMap` includes `goal` between `checkpoints` and `terrain`:

```ts
  checkpoints: readonly GameplayCheckpointSpawn[]
  goal: GameplayGoalSpawn
  terrain: TerrainDefinition
```

Add this type after `GameplayCheckpointSpawn`:

```ts
export type GameplayGoalSpawn = {
  x: number
  surfaceY: number
}
```

- [ ] **Step 4: Add rebuilt 1-1 goal data**

Modify `src/domain/gameplay/gameplayStageMaps.ts` and add `goal` after `checkpoints`:

```ts
  goal: {
    x: 9340,
    surfaceY: 512,
  },
```

- [ ] **Step 5: Copy the goal image into root public assets**

Run:

```bash
mkdir -p public/assets/props
cp __prototype__/public/assets/props/white_palace_goal_idle.webp public/assets/props/white_palace_goal_idle.webp
```

Expected: `public/assets/props/white_palace_goal_idle.webp` exists and `git status --short` shows it as a new file.

- [ ] **Step 6: Run the focused tests and confirm pass**

Run:

```bash
npm run test -- src/domain/gameplay/gameplayStageMaps.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit Task 3**

```bash
git add src/domain/gameplay/gameplayMapTypes.ts src/domain/gameplay/gameplayStageMaps.ts src/domain/gameplay/gameplayStageMaps.test.ts public/assets/props/white_palace_goal_idle.webp
git commit -m "feat: add gameplay stage goal data"
```

## Task 4: Goal Preload, Animation, And Static Body Rendering

**Files:**
- Modify: `src/ui/gameplay/createGameplayRenderer.test.ts`
- Modify: `src/ui/gameplay/createGameplayRenderer.ts`

- [ ] **Step 1: Write failing renderer goal creation tests**

Modify `src/ui/gameplay/createGameplayRenderer.test.ts` imports:

```ts
import { getGoalBottomY, goalActorDefinition } from '../../domain/gameplay/goalActor'
```

Add this helper after `getCheckpointSprite`:

```ts
function getGoalSprite(runtime: FakeRuntime) {
  const goal = runtime.staticSpriteCalls.find(
    (sprite) => sprite.texture === goalActorDefinition.sprite.key,
  )
  expect(goal).toBeDefined()
  if (!goal) {
    throw new Error('Missing stage goal sprite.')
  }

  return goal
}
```

Extend the fake scene runtime with `physics.add.staticSprite` support and expose
`staticSpriteCalls`, using the same fake Arcade sprite shape as the existing
static image helper. Goal rendering must use this fake static sprite collection
because the goal is an animated static Arcade sprite.

Add these tests in `describe('createGameplayRendererConfig', ...)`:

```ts
  it('preloads the stage goal spritesheet from the domain actor definition', () => {
    const runtime = createSceneRuntime()

    runtime.scene.preload()

    expect(runtime.spritesheetCalls).toContainEqual({
      key: goalActorDefinition.sprite.key,
      assetRef: goalActorDefinition.sprite.assetRef,
      frameWidth: goalActorDefinition.sprite.frameWidth,
      frameHeight: goalActorDefinition.sprite.frameHeight,
    })
  })

  it('creates the stage goal idle animation from the domain actor definition', () => {
    const runtime = createSceneRuntime()

    runtime.scene.create()

    expect(runtime.animationCreateCalls).toContainEqual({
      key: goalActorDefinition.animation.idleKey,
      frames: [
        { key: goalActorDefinition.sprite.key, frame: 0 },
        { key: goalActorDefinition.sprite.key, frame: 1 },
        { key: goalActorDefinition.sprite.key, frame: 2 },
        { key: goalActorDefinition.sprite.key, frame: 3 },
      ],
      frameRate: goalActorDefinition.animation.frameRate,
      repeat: goalActorDefinition.animation.repeat,
      yoyo: goalActorDefinition.animation.yoyo,
    })
  })

  it('creates a static stage goal body from stage data', () => {
    const runtime = createSceneRuntime()

    runtime.scene.create()

    const goal = getGoalSprite(runtime)
    const bottomY = getGoalBottomY({ surfaceY: runtime.stage.goal.surfaceY })

    expect(goal).toMatchObject({
      x: runtime.stage.goal.x,
      y: bottomY,
      texture: goalActorDefinition.sprite.key,
      origin: goalActorDefinition.origin,
      displaySize: goalActorDefinition.displaySize,
      depth: goalActorDefinition.depth,
      refreshedBody: true,
    })
    expect(goal.body.size).toEqual({
      width: goalActorDefinition.body.width,
      height: goalActorDefinition.body.height,
    })
    expect(goal.body.offset).toEqual({
      x: goalActorDefinition.body.offsetX,
      y: goalActorDefinition.body.offsetY,
    })
    expect(goal.playCalls.at(-1)).toEqual({
      key: goalActorDefinition.animation.idleKey,
      ignoreIfPlaying: undefined,
    })
    expect(runtime.overlapCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          a: runtime.playerSprite,
          b: goal,
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

Expected: FAIL because the renderer does not preload, animate, or create the stage goal.

- [ ] **Step 3: Add renderer imports, runtime type, preload, and animation**

Modify `src/ui/gameplay/createGameplayRenderer.ts` imports:

```ts
import { getGoalBottomY, goalActorDefinition } from '../../domain/gameplay/goalActor'
```

Add runtime type near `CheckpointRuntime`:

```ts
type GoalRuntime = {
  sprite: Phaser.Types.Physics.Arcade.SpriteWithStaticBody
  cleared: boolean
}
```

Add scene field:

```ts
  private goal: GoalRuntime | null = null
```

Add this in `preload()` after checkpoint preload:

```ts
    this.load.spritesheet(goalActorDefinition.sprite.key, goalActorDefinition.sprite.assetRef, {
      frameWidth: goalActorDefinition.sprite.frameWidth,
      frameHeight: goalActorDefinition.sprite.frameHeight,
    })
```

Call `this.createGoalAnimation()` in `create()` after player animation creation.

Add:

```ts
  private createGoalAnimation(): void {
    this.anims.create({
      key: goalActorDefinition.animation.idleKey,
      frames: this.anims.generateFrameNumbers(goalActorDefinition.sprite.key, {
        start: goalActorDefinition.animation.frameStart,
        end: goalActorDefinition.animation.frameEnd,
      }),
      frameRate: goalActorDefinition.animation.frameRate,
      repeat: goalActorDefinition.animation.repeat,
      yoyo: goalActorDefinition.animation.yoyo,
    })
  }
```

- [ ] **Step 4: Create goal static body and overlap**

Call `this.createGoal()` after `this.createCheckpoints()` and before `this.createCoins()`.

Add:

```ts
  private createGoal(): void {
    const sprite = this.physics.add.staticSprite(
      this.stageMap.goal.x,
      getGoalBottomY({ surfaceY: this.stageMap.goal.surfaceY }),
      goalActorDefinition.sprite.key,
    )
    sprite.setOrigin(goalActorDefinition.origin.x, goalActorDefinition.origin.y)
    sprite.setDisplaySize(
      goalActorDefinition.displaySize.width,
      goalActorDefinition.displaySize.height,
    )
    sprite.refreshBody()
    sprite.body.setSize(goalActorDefinition.body.width, goalActorDefinition.body.height)
    sprite.body.setOffset(goalActorDefinition.body.offsetX, goalActorDefinition.body.offsetY)
    sprite.setDepth(goalActorDefinition.depth)
    sprite.play(goalActorDefinition.animation.idleKey)

    this.goal = {
      sprite,
      cleared: false,
    }
  }
```

Add the goal overlap in `createPlayer()` after enemy and hazard overlaps are wired:

```ts
    if (this.goal) {
      this.physics.add.overlap(player, this.goal.sprite, () => this.completeStage())
    }
```

Add a temporary method so rendering tests pass before clear behavior is implemented:

```ts
  private completeStage(): void {}
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
git commit -m "feat: render gameplay stage goal"
```

## Task 5: Stage Clear Runtime And Gating

**Files:**
- Modify: `src/ui/gameplay/createGameplayRenderer.test.ts`
- Modify: `src/ui/gameplay/createGameplayRenderer.ts`

- [ ] **Step 1: Write failing stage clear behavior tests**

Add a goal overlap trigger to the runtime return object:

```ts
    triggerGoalOverlap: (goal: ReturnType<typeof createFakeArcadeSprite>) => {
      const overlap = overlapCalls.find((candidate) => candidate.a === playerSprite && candidate.b === goal)
      if (!overlap) {
        throw new Error(`Missing player overlap for goal texture ${goal.texture}.`)
      }
      overlap.callback()
    },
```

Add these tests:

```ts
  it('clears the stage once when the player overlaps the goal', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return

    const goal = getGoalSprite(runtime)
    const guard = runtime.sprites.find((sprite) => sprite.texture === 'enemy-guard-walk')
    expect(guard).toBeDefined()
    if (!guard) return
    guard.velocityX = 80
    runtime.playerSprite.velocityX = 120
    runtime.playerSprite.velocityY = -60
    runtime.playerSprite.accelerationX = 400

    runtime.triggerGoalOverlap(goal)

    expect(runtime.playerSprite.velocityX).toBe(0)
    expect(runtime.playerSprite.velocityY).toBe(0)
    expect(runtime.playerSprite.accelerationX).toBe(0)
    expect(runtime.playerSprite.playCalls.at(-1)).toEqual({
      key: playerActorDefinition.sprites.idle.key,
      ignoreIfPlaying: true,
    })
    expect(guard.velocityX).toBe(0)
    expect(goal.tint).toBe(goalActorDefinition.activatedTint)

    runtime.triggerGoalOverlap(goal)

    expect(runtime.playerSprite.playCalls.filter(
      (call) => call.key === playerActorDefinition.sprites.idle.key,
    )).toHaveLength(2)
  })

  it('stops gameplay scanning and damage after stage clear', () => {
    const runtime = createSceneRuntime({ stage: createHazardStage() })
    runtime.scene.create()
    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return

    const goal = getGoalSprite(runtime)
    const spike = runtime.staticImageCalls.find(
      (sprite) => sprite.texture === hazardActorDefinitions.spikes.sprite.key,
    )
    const guard = runtime.sprites.find((sprite) => sprite.texture === 'enemy-guard-walk')
    expect(spike).toBeDefined()
    expect(guard).toBeDefined()
    if (!spike || !guard) return

    runtime.triggerGoalOverlap(goal)
    const hurtCallsAfterClear = runtime.playerSprite.playCalls.length

    runtime.triggerHazardOverlap(spike)
    runtime.triggerEnemyOverlap(guard)
    runtime.playerSprite.x = runtime.stage.checkpoints[0].x
    runtime.scene.update()

    expect(runtime.playerSprite.playCalls).toHaveLength(hurtCallsAfterClear)
    expect(getCheckpointSprite(runtime, 'combat-gate').sprite.alpha).toBe(checkpointActorDefinition.inactiveAlpha)
  })

  it('does not defeat the player for out-of-bounds position after stage clear', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return

    runtime.triggerGoalOverlap(getGoalSprite(runtime))
    runtime.playerSprite.y = runtime.stage.world.height + PLAYER_OUT_OF_BOUNDS_MARGIN + 10

    runtime.scene.update()

    expect(runtime.cameraFadeOutCalls).toHaveLength(0)
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

Expected: FAIL because `completeStage()` does not yet apply clear state or post-clear gates.

- [ ] **Step 3: Implement clear state fields and imports**

Modify imports:

```ts
import { canCompleteStage, getStageClearState } from '../../domain/gameplay/stageClear'
```

Add scene field:

```ts
  private stageCleared = false
```

- [ ] **Step 4: Implement completeStage**

Replace the temporary `completeStage()` with:

```ts
  private completeStage(): void {
    if (!canCompleteStage({ stageCleared: this.stageCleared })) {
      return
    }

    const clearState = getStageClearState()
    this.stageCleared = clearState.stageCleared
    this.isAttacking = clearState.attacking
    this.isHomingAttacking = clearState.homingAttacking
    this.attackReady = clearState.attackReady
    this.clearHomingState()
    this.clearActiveMeleeHitboxes()

    if (this.player) {
      this.player.setVelocity(0, 0)
      this.player.setAccelerationX(0)
      this.playPlayerAnimation(this.player, 'idle')
    }

    for (const enemy of this.enemies) {
      enemy.sprite.setVelocityX(0)
    }

    if (this.goal) {
      this.goal.cleared = true
      this.goal.sprite.setTint(goalActorDefinition.activatedTint)
    }
  }
```

- [ ] **Step 5: Gate gameplay systems after clear**

Update these methods in `src/ui/gameplay/createGameplayRenderer.ts`:

```ts
  private updateCoins(): void {
    if (!this.player) return

    if (!shouldScanPlayerCoins({
      stageCleared: this.stageCleared,
      dead: this.isPlayerDead,
    })) {
      return
    }
```

```ts
  private updateCheckpoints(): void {
    if (!this.player || this.isPlayerDead || this.stageCleared) return
```

```ts
  private handlePlayerHazardContact(hazard: HazardRuntime): void {
    if (!this.player || this.stageCleared) return
```

```ts
  private handlePlayerEnemyContact(enemy: EnemyRuntime): void {
    if (this.stageCleared) return
```

If `handlePlayerEnemyContact` does not exist, extract it from the current enemy overlap callback and call it from the overlap.

```ts
  private checkPlayerOutOfBounds(): void {
    if (!this.player || this.stageCleared) return
```

```ts
  private updatePlayerMovement(): void {
    if (!this.player || !this.playerKeys || !this.playerJumpState) return

    if (this.stageCleared || this.isPlayerHurting || this.isPlayerDead) {
      return
    }
```

Inside `updateHomingReticle`, `startHomingAttack`, or the existing Homing entry path, return early when `this.stageCleared` is true so Homing does not start or update after clear.

- [ ] **Step 6: Run the renderer test and confirm pass**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit Task 5**

```bash
git add src/ui/gameplay/createGameplayRenderer.ts src/ui/gameplay/createGameplayRenderer.test.ts
git commit -m "feat: clear gameplay stage from goal overlap"
```

## Task 6: Full Verification

**Files:**
- No source edits expected unless verification exposes a defect.

- [ ] **Step 1: Run focused domain tests**

Run:

```bash
npm run test -- src/domain/gameplay/stageClear.test.ts src/domain/gameplay/goalActor.test.ts src/domain/gameplay/gameplayStageMaps.test.ts
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

Expected: `git diff --check` has no output. `rg "__prototype__" src public --glob '!**/*.test.ts'` has no output and exits with status `1` because there are no matches.

- [ ] **Step 7: Commit verification-only fixes if needed**

If any verification step exposes a defect, write the smallest failing test that captures the defect, fix it, rerun the failed verification plus the relevant full check, then commit with a message matching the fix scope.

If all verification passes without code changes, do not create a verification-only commit.

## Self-Review

- Spec coverage: Tasks 1 and 2 cover pure stage clear and goal actor modules. Task 3 covers stage map type/data and root public asset ownership. Tasks 4 and 5 cover goal preload, animation, rendering, overlap, idempotent clear, and post-clear gameplay gates. Task 6 covers required verification and runtime `__prototype__` scan.
- Placeholder scan: The plan contains no unresolved markers or deferred implementation gaps. Each task has concrete files, code snippets, commands, expected results, and commit messages.
- Type consistency: `GameplayGoalSpawn`, `GoalRuntime`, `goalActorDefinition`, `getGoalBottomY`, `canCompleteStage`, and `getStageClearState` are introduced before renderer usage and keep the same names throughout the plan.
