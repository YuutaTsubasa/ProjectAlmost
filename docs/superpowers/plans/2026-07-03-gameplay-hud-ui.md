# Gameplay HUD UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a prototype-inspired gameplay HUD overlay that shows HP, live statistics, checkpoint/respawn progress, and a compact mini map above the rebuilt Phaser gameplay canvas.

**Architecture:** Keep HUD formatting, normalized map projection, initial state, and patch reduction in pure `src/domain/gameplay/gameplayHud.ts`. Keep Phaser runtime observation inside `createGameplayRenderer.ts`, emitting typed HUD patches through an optional callback. Keep Svelte responsible for reactive state and presentational HUD rendering.

**Tech Stack:** TypeScript, Vitest, Svelte 5, Phaser Arcade Physics, root CSS/Svelte component styling.

---

## File Structure

- Create `src/domain/gameplay/gameplayHud.ts`
  - Pure HUD state, patch, formatting, normalized marker projection, initial state, and patch reducer.
- Create `src/domain/gameplay/gameplayHud.test.ts`
  - Covers label formatting, progress clamp, marker projection, initial state, and patch reduction.
- Modify `src/ui/gameplay/createGameplayRenderer.ts`
  - Adds optional `onHudUpdate`, emits initial and runtime HUD patches, tracks HUD counters, and freezes HUD updates after clear.
- Modify `src/ui/gameplay/createGameplayRenderer.test.ts`
  - Covers renderer HUD callback contract and runtime stat updates.
- Create `src/ui/gameplay/GameplayHud.svelte`
  - Presentational Svelte HUD overlay for status, mini map, objective, and bottom readouts.
- Modify `src/ui/gameplay/GameplayScreen.svelte`
  - Owns reactive HUD state, passes callback into renderer, renders `GameplayHud`.
- Create `src/ui/gameplay/gameplayHudUi.test.ts`
  - Source-level tests for the Svelte HUD structure, mini-map bindings, and pointer-events boundary.

## Task 1: Pure Gameplay HUD Rules

**Files:**
- Create: `src/domain/gameplay/gameplayHud.test.ts`
- Create: `src/domain/gameplay/gameplayHud.ts`

- [ ] **Step 1: Write the failing HUD domain tests**

Create `src/domain/gameplay/gameplayHud.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { PLAYER_MAX_HEALTH } from './playerLife'
import { getGameplayStageMap } from './gameplayStageMaps'
import {
  applyGameplayHudPatch,
  clampHudProgress,
  createInitialGameplayHudState,
  formatGameplayHudCoinLabel,
  formatGameplayHudHealthLabel,
  formatGameplayHudTime,
  getHudCheckpointMarkers,
  getHudEnemyMarkers,
  getHudGoalProgress,
  getHudPlatformMarkers,
  getHudPositionProgress,
} from './gameplayHud'

describe('gameplay HUD labels', () => {
  it('formats prototype-style health and coin labels', () => {
    expect(formatGameplayHudHealthLabel({ current: 3, max: 3 })).toBe('HP 3/3')
    expect(formatGameplayHudCoinLabel({ collected: 7, target: 17 })).toBe('COIN 007 / 17')
  })

  it('formats elapsed time as minutes, seconds, and centiseconds', () => {
    expect(formatGameplayHudTime(0)).toBe('00:00.00')
    expect(formatGameplayHudTime(65_432)).toBe('01:05.43')
  })
})

describe('gameplay HUD progress projection', () => {
  it('clamps normalized progress to the HUD range', () => {
    expect(clampHudProgress(-0.25)).toBe(0)
    expect(clampHudProgress(0.5)).toBe(0.5)
    expect(clampHudProgress(1.25)).toBe(1)
  })

  it('projects world positions into clamped normalized mini-map space', () => {
    expect(getHudPositionProgress({ position: 50, worldSize: 200 })).toBe(0.25)
    expect(getHudPositionProgress({ position: 250, worldSize: 200 })).toBe(1)
    expect(getHudPositionProgress({ position: 10, worldSize: 0 })).toBe(0)
  })

  it('projects platforms, checkpoints, enemies, and goal into HUD markers', () => {
    const stage = getGameplayStageMap('1-1')
    expect(stage).toBeDefined()
    if (!stage) return

    expect(getHudPlatformMarkers({
      platforms: [{ col: 2, row: 4, width: 6 }],
      tileColumns: 100,
      tileSize: 64,
      worldHeight: 640,
    })).toEqual([{ x: 0.02, y: 0.4, width: 0.06 }])

    expect(getHudCheckpointMarkers({
      checkpoints: [{ x: 320, surfaceY: 512 }],
      worldWidth: 640,
      worldHeight: 1024,
    })).toEqual([{ x: 0.5, y: 0.5 }])

    expect(getHudEnemyMarkers({
      enemies: [
        { x: 320, y: 256, defeated: false },
        { x: 480, y: 256, defeated: true },
      ],
      worldWidth: 640,
      worldHeight: 512,
    })).toEqual([{ x: 0.5, y: 0.5 }])

    expect(getHudGoalProgress({ goalX: stage.goal.x, worldWidth: stage.world.width })).toBeGreaterThan(0)
  })
})

describe('gameplay HUD state', () => {
  it('creates the initial rebuilt stage HUD state', () => {
    const stage = getGameplayStageMap('1-1')
    expect(stage).toBeDefined()
    if (!stage) return

    const state = createInitialGameplayHudState(stage)

    expect(state).toMatchObject({
      hp: PLAYER_MAX_HEALTH,
      hpMax: PLAYER_MAX_HEALTH,
      coins: 0,
      coinTarget: stage.coins.length,
      damageTaken: 0,
      falls: 0,
      enemiesDefeated: 0,
      enemyTarget: stage.enemies.length,
      checkpointsReached: 0,
      checkpointTarget: stage.checkpoints.length,
      activeCheckpointIndex: -1,
      cleared: false,
      time: '00:00.00',
    })
    expect(state.mapPlatforms.length).toBe(stage.terrain.platforms.length)
    expect(state.checkpointMarkers.length).toBe(stage.checkpoints.length)
    expect(state.enemyMarkers.length).toBe(stage.enemies.length)
  })

  it('applies HUD patches immutably', () => {
    const stage = getGameplayStageMap('1-1')
    expect(stage).toBeDefined()
    if (!stage) return

    const first = createInitialGameplayHudState(stage)
    const second = applyGameplayHudPatch(first, {
      hp: 2,
      coins: 1,
      damageTaken: 1,
      activeCheckpointIndex: 0,
      checkpointsReached: 1,
    })

    expect(second).toMatchObject({
      hp: 2,
      coins: 1,
      damageTaken: 1,
      activeCheckpointIndex: 0,
      checkpointsReached: 1,
    })
    expect(first.hp).toBe(PLAYER_MAX_HEALTH)
    expect(second).not.toBe(first)
  })
})
```

- [ ] **Step 2: Run the focused domain test and confirm expected failure**

Run:

```bash
npm run test -- src/domain/gameplay/gameplayHud.test.ts
```

Expected: FAIL because `src/domain/gameplay/gameplayHud.ts` does not exist.

- [ ] **Step 3: Implement pure HUD rules**

Create `src/domain/gameplay/gameplayHud.ts`:

```ts
import type { GameplayStageMap } from './gameplayMapTypes'
import { PLAYER_MAX_HEALTH } from './playerLife'
import { getTileColumnCount } from './terrain'

export type GameplayHudMarker = {
  x: number
  y: number
}

export type GameplayHudPlatformMarker = GameplayHudMarker & {
  width: number
}

export type GameplayHudEnemyMarker = GameplayHudMarker

export type GameplayHudState = {
  hp: number
  hpMax: number
  coins: number
  coinTarget: number
  damageTaken: number
  falls: number
  enemiesDefeated: number
  enemyTarget: number
  checkpointsReached: number
  checkpointTarget: number
  activeCheckpointIndex: number
  time: string
  playerProgress: number
  playerProgressY: number
  goalProgress: number
  mapPlatforms: readonly GameplayHudPlatformMarker[]
  checkpointMarkers: readonly GameplayHudMarker[]
  enemyMarkers: readonly GameplayHudEnemyMarker[]
  cleared: boolean
}

export type GameplayHudPatch = Partial<GameplayHudState>

export function clampHudProgress(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(1, value))
}

export function getHudPositionProgress(input: {
  position: number
  worldSize: number
}): number {
  if (input.worldSize <= 0) return 0
  return clampHudProgress(input.position / input.worldSize)
}

export function formatGameplayHudHealthLabel(input: {
  current: number
  max: number
}): string {
  return `HP ${input.current}/${input.max}`
}

export function formatGameplayHudCoinLabel(input: {
  collected: number
  target: number
}): string {
  return `COIN ${String(input.collected).padStart(3, '0')} / ${input.target}`
}

export function formatGameplayHudTime(elapsedMs: number): string {
  const safeElapsed = Math.max(0, Math.floor(elapsedMs))
  const minutes = Math.floor(safeElapsed / 60_000)
  const seconds = Math.floor((safeElapsed % 60_000) / 1000)
  const centiseconds = Math.floor((safeElapsed % 1000) / 10)

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`
}

export function getHudPlatformMarkers(input: {
  platforms: readonly { col: number; row: number; width: number }[]
  tileColumns: number
  tileSize: number
  worldHeight: number
}): GameplayHudPlatformMarker[] {
  return input.platforms.map((platform) => ({
    x: getHudPositionProgress({ position: platform.col, worldSize: input.tileColumns }),
    y: getHudPositionProgress({
      position: platform.row * input.tileSize,
      worldSize: input.worldHeight,
    }),
    width: getHudPositionProgress({ position: platform.width, worldSize: input.tileColumns }),
  }))
}

export function getHudCheckpointMarkers(input: {
  checkpoints: readonly { x: number; surfaceY: number }[]
  worldWidth: number
  worldHeight: number
}): GameplayHudMarker[] {
  return input.checkpoints.map((checkpoint) => ({
    x: getHudPositionProgress({ position: checkpoint.x, worldSize: input.worldWidth }),
    y: getHudPositionProgress({ position: checkpoint.surfaceY, worldSize: input.worldHeight }),
  }))
}

export function getHudEnemyMarkers(input: {
  enemies: readonly { x: number; y: number; defeated: boolean }[]
  worldWidth: number
  worldHeight: number
}): GameplayHudEnemyMarker[] {
  return input.enemies
    .filter((enemy) => !enemy.defeated)
    .map((enemy) => ({
      x: getHudPositionProgress({ position: enemy.x, worldSize: input.worldWidth }),
      y: getHudPositionProgress({ position: enemy.y, worldSize: input.worldHeight }),
    }))
}

export function getHudGoalProgress(input: {
  goalX: number
  worldWidth: number
}): number {
  return getHudPositionProgress({ position: input.goalX, worldSize: input.worldWidth })
}

export function createInitialGameplayHudState(stage: GameplayStageMap): GameplayHudState {
  return {
    hp: PLAYER_MAX_HEALTH,
    hpMax: PLAYER_MAX_HEALTH,
    coins: 0,
    coinTarget: stage.coins.length,
    damageTaken: 0,
    falls: 0,
    enemiesDefeated: 0,
    enemyTarget: stage.enemies.length,
    checkpointsReached: 0,
    checkpointTarget: stage.checkpoints.length,
    activeCheckpointIndex: -1,
    time: '00:00.00',
    playerProgress: getHudPositionProgress({
      position: stage.player.spawn.x,
      worldSize: stage.world.width,
    }),
    playerProgressY: getHudPositionProgress({
      position: stage.player.spawn.surfaceY,
      worldSize: stage.world.height,
    }),
    goalProgress: getHudGoalProgress({
      goalX: stage.goal.x,
      worldWidth: stage.world.width,
    }),
    mapPlatforms: getHudPlatformMarkers({
      platforms: stage.terrain.platforms,
      tileColumns: getTileColumnCount({
        worldWidth: stage.world.width,
        tileSize: stage.world.tileSize,
      }),
      tileSize: stage.world.tileSize,
      worldHeight: stage.world.height,
    }),
    checkpointMarkers: getHudCheckpointMarkers({
      checkpoints: stage.checkpoints,
      worldWidth: stage.world.width,
      worldHeight: stage.world.height,
    }),
    enemyMarkers: getHudEnemyMarkers({
      enemies: stage.enemies.map((enemy) => ({
        x: enemy.x,
        y: enemy.surfaceY,
        defeated: false,
      })),
      worldWidth: stage.world.width,
      worldHeight: stage.world.height,
    }),
    cleared: false,
  }
}

export function applyGameplayHudPatch(
  state: GameplayHudState,
  patch: GameplayHudPatch,
): GameplayHudState {
  return {
    ...state,
    ...patch,
  }
}
```

- [ ] **Step 4: Run focused domain test and confirm pass**

Run:

```bash
npm run test -- src/domain/gameplay/gameplayHud.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 1**

```bash
git add src/domain/gameplay/gameplayHud.ts src/domain/gameplay/gameplayHud.test.ts
git commit -m "feat: add gameplay HUD domain rules"
```

## Task 2: Renderer HUD Callback And Position Updates

**Files:**
- Modify: `src/ui/gameplay/createGameplayRenderer.test.ts`
- Modify: `src/ui/gameplay/createGameplayRenderer.ts`

- [ ] **Step 1: Write failing renderer tests for initial HUD and player progress**

Modify `src/ui/gameplay/createGameplayRenderer.test.ts` imports:

```ts
import {
  createInitialGameplayHudState,
  formatGameplayHudTime,
  getHudEnemyMarkers,
  getHudPositionProgress,
  type GameplayHudPatch,
} from '../../domain/gameplay/gameplayHud'
```

Change `createSceneRuntime` input and config creation:

```ts
function createSceneRuntime(input: {
  stage?: GameplayStageMap
  onHudUpdate?: (patch: GameplayHudPatch) => void
} = {}) {
  const stage = input.stage ?? getGameplayStageMap('1-1')

  expect(stage).toBeDefined()
  if (!stage) {
    throw new Error('Missing gameplay stage map 1-1.')
  }

  const hudUpdates: GameplayHudPatch[] = []
  const config = createGameplayRendererConfig({
    parent: {} as HTMLElement,
    stage,
    onHudUpdate: (patch) => {
      hudUpdates.push(patch)
      input.onHudUpdate?.(patch)
    },
  })
```

Add `hudUpdates` to the returned runtime object.

Add these tests in `describe('createGameplayRendererConfig', ...)`:

```ts
  it('emits initial gameplay HUD state during scene creation', () => {
    const runtime = createSceneRuntime()

    runtime.scene.create()

    expect(runtime.hudUpdates[0]).toEqual(createInitialGameplayHudState(runtime.stage))
  })

  it('emits player HUD progress and elapsed time during scene update before clear', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return

    runtime.playerSprite.x = 640
    runtime.playerSprite.y = 320
    runtime.scene.time.now = 65_432
    runtime.scene.update()

    expect(runtime.hudUpdates.at(-1)).toMatchObject({
      playerProgress: getHudPositionProgress({
        position: 640,
        worldSize: runtime.stage.world.width,
      }),
      playerProgressY: getHudPositionProgress({
        position: 320,
        worldSize: runtime.stage.world.height,
      }),
      time: formatGameplayHudTime(65_432),
    })
  })
```

- [ ] **Step 2: Run focused renderer test and confirm expected failure**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts -t "gameplay HUD"
```

Expected: FAIL because `createGameplayRendererConfig` does not accept `onHudUpdate` and emits no HUD updates.

- [ ] **Step 3: Implement HUD callback input and update helpers**

Modify `src/ui/gameplay/createGameplayRenderer.ts` imports:

```ts
import {
  createInitialGameplayHudState,
  formatGameplayHudTime,
  getHudEnemyMarkers,
  getHudPositionProgress,
  type GameplayHudPatch,
} from '../../domain/gameplay/gameplayHud'
```

Extend input type:

```ts
type GameplayRendererInput = {
  parent: HTMLElement
  stage: GameplayStageMap
  onHudUpdate?: (patch: GameplayHudPatch) => void
}
```

Add scene field and constructor parameter:

```ts
  private readonly onHudUpdate?: (patch: GameplayHudPatch) => void

  constructor(stage: GameplayStageMap, onHudUpdate?: (patch: GameplayHudPatch) => void) {
    super(`GameplayMapScene:${stage.id}`)
    this.stageMap = stage
    this.onHudUpdate = onHudUpdate
    this.currentRespawnPoint = {
      x: stage.player.spawn.x,
      surfaceY: stage.player.spawn.surfaceY,
      gravity: 'down',
    }
  }
```

Add helper methods:

```ts
  private emitHudPatch(patch: GameplayHudPatch): void {
    this.onHudUpdate?.(patch)
  }

  private emitHudPositionPatch(): void {
    if (!this.player || this.stageCleared) return

    this.emitHudPatch({
      playerProgress: getHudPositionProgress({
        position: this.player.x,
        worldSize: this.stageMap.world.width,
      }),
      playerProgressY: getHudPositionProgress({
        position: this.player.y,
        worldSize: this.stageMap.world.height,
      }),
      enemyMarkers: getHudEnemyMarkers({
        enemies: this.enemies.map((enemy) => ({
          x: enemy.sprite.x,
          y: enemy.sprite.y,
          defeated: enemy.defeated,
        })),
        worldWidth: this.stageMap.world.width,
        worldHeight: this.stageMap.world.height,
      }),
      time: formatGameplayHudTime(this.time.now),
    })
  }
```

In `create()` after player/enemies/checkpoints/goal are created, emit initial state:

```ts
    this.emitHudPatch(createInitialGameplayHudState(this.stageMap))
```

In `update()` after gameplay updates that can move player/enemies, call:

```ts
    this.emitHudPositionPatch()
```

Update config construction at the bottom:

```ts
export function createGameplayRendererConfig(input: GameplayRendererInput): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent: input.parent,
    width: 1280,
    height: 720,
    backgroundColor: '#87ceeb',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 1200 },
        debug: false,
      },
    },
    scene: [new GameplayMapScene(input.stage, input.onHudUpdate)],
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  }
}
```

- [ ] **Step 4: Run focused renderer test and confirm pass**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts -t "gameplay HUD"
```

Expected: PASS.

- [ ] **Step 5: Commit Task 2**

```bash
git add src/ui/gameplay/createGameplayRenderer.ts src/ui/gameplay/createGameplayRenderer.test.ts
git commit -m "feat: emit gameplay HUD position updates"
```

## Task 3: Renderer HUD Statistics And Clear Freeze

**Files:**
- Modify: `src/ui/gameplay/createGameplayRenderer.test.ts`
- Modify: `src/ui/gameplay/createGameplayRenderer.ts`

- [ ] **Step 1: Write failing renderer tests for HUD stats**

Add these tests in `describe('createGameplayRendererConfig', ...)`:

```ts
  it('emits HUD coin statistics when a coin is collected', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return

    const coin = runtime.images.find((image) => image.texture === 'coin')
    expect(coin).toBeDefined()
    if (!coin) return

    runtime.playerSprite.x = coin.x
    runtime.playerSprite.y = coin.y
    runtime.scene.update()

    expect(runtime.hudUpdates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ coins: 1 }),
      ]),
    )
  })

  it('emits HUD damage statistics and restored HP after respawn', () => {
    const runtime = createSceneRuntime({ stage: createHazardStage() })
    runtime.scene.create()
    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return

    const spike = runtime.staticImageCalls.find(
      (sprite) => sprite.texture === hazardActorDefinitions.spikes.sprite.key,
    )
    expect(spike).toBeDefined()
    if (!spike) return

    runtime.triggerHazardOverlap(spike)

    expect(runtime.hudUpdates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ hp: 2, damageTaken: 1 }),
      ]),
    )

    runtime.triggerHazardOverlap(spike)
    recoverFromSurvivedHurt(runtime)
    runtime.triggerHazardOverlap(spike)
    runtime.triggerFadeOutComplete()

    expect(runtime.hudUpdates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ hp: 3 }),
      ]),
    )
  })

  it('emits HUD fall count when the player respawns from out-of-bounds', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return

    runtime.playerSprite.y = runtime.stage.world.height + PLAYER_OUT_OF_BOUNDS_MARGIN + 1
    runtime.scene.update()

    expect(runtime.hudUpdates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ falls: 1 }),
      ]),
    )
  })

  it('emits enemy and checkpoint HUD stats', () => {
    const runtime = createSceneRuntime()
    runtime.scene.create()
    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return

    const core = runtime.sprites.find((sprite) => sprite.texture === 'azure-core')
    expect(core).toBeDefined()
    if (!core) return

    runtime.playerSprite.x = core.x
    runtime.playerSprite.y = core.y
    runtime.playerKeys.j.isDown = true
    runtime.scene.update()

    expect(runtime.hudUpdates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ enemiesDefeated: 1 }),
      ]),
    )

    runtime.playerSprite.x = runtime.stage.checkpoints[0].x
    runtime.scene.update()

    expect(runtime.hudUpdates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          activeCheckpointIndex: 0,
          checkpointsReached: 1,
        }),
      ]),
    )
  })

  it('emits HUD clear state and suppresses later HUD-changing patches after clear', () => {
    const runtime = createSceneRuntime({ stage: createHazardStage() })
    runtime.scene.create()
    expect(runtime.playerSprite).toBeDefined()
    if (!runtime.playerSprite) return

    runtime.triggerGoalOverlap(getGoalSprite(runtime))
    const updateCountAfterClear = runtime.hudUpdates.length

    const spike = runtime.staticImageCalls.find(
      (sprite) => sprite.texture === hazardActorDefinitions.spikes.sprite.key,
    )
    expect(spike).toBeDefined()
    if (!spike) return

    runtime.triggerHazardOverlap(spike)
    runtime.playerSprite.x = runtime.stage.checkpoints[0].x
    runtime.scene.update()

    expect(runtime.hudUpdates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ cleared: true }),
      ]),
    )
    expect(runtime.hudUpdates).toHaveLength(updateCountAfterClear)
  })
```

- [ ] **Step 2: Run focused renderer HUD tests and confirm expected failure**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts -t "HUD"
```

Expected: FAIL because runtime counters and event-specific patches are not emitted.

- [ ] **Step 3: Implement HUD runtime counters**

Add fields to `GameplayMapScene`:

```ts
  private damageTaken = 0
  private falls = 0
  private enemiesDefeated = 0
```

In `create()` reset counters before emitting initial state:

```ts
    this.damageTaken = 0
    this.falls = 0
    this.enemiesDefeated = 0
    this.emitHudPatch(createInitialGameplayHudState(this.stageMap))
```

In `collectCoin(coin)` after `this.collectedCoins += 1`:

```ts
    this.emitHudPatch({ coins: this.collectedCoins })
```

In `applyPlayerContactDamage(sourceX)` after `this.playerHealth = damageOutcome.nextHealth`:

```ts
    this.damageTaken += 1
    this.emitHudPatch({
      hp: Math.max(0, this.playerHealth),
      damageTaken: this.damageTaken,
    })
```

In `defeatPlayer(reason)` after defeat state is accepted:

```ts
    if (reason === 'fall') {
      this.falls += 1
      this.emitHudPatch({ falls: this.falls })
    }
```

In `respawnPlayer()` after `this.playerHealth = state.health`:

```ts
    this.emitHudPatch({ hp: this.playerHealth })
```

In `defeatEnemy(enemy)` after setting `enemy.defeated = true`:

```ts
    this.enemiesDefeated += 1
    this.emitHudPatch({
      enemiesDefeated: this.enemiesDefeated,
      enemyMarkers: getHudEnemyMarkers({
        enemies: this.enemies.map((candidate) => ({
          x: candidate.sprite.x,
          y: candidate.sprite.y,
          defeated: candidate.defeated,
        })),
        worldWidth: this.stageMap.world.width,
        worldHeight: this.stageMap.world.height,
      }),
    })
```

In `activateCheckpoint(index, checkpoint)` after updating `activeCheckpointIndex`:

```ts
    this.emitHudPatch({
      activeCheckpointIndex: this.activeCheckpointIndex,
      checkpointsReached: this.activeCheckpointIndex + 1,
    })
```

In `completeStage()` after `this.stageCleared = clearState.stageCleared` and before returning:

```ts
    this.emitHudPatch({ cleared: true })
```

Ensure post-clear handlers already return before emitting stat patches. Keep `emitHudPositionPatch()` returning early when `stageCleared`.

- [ ] **Step 4: Run focused renderer HUD tests and confirm pass**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts -t "HUD"
```

Expected: PASS.

- [ ] **Step 5: Commit Task 3**

```bash
git add src/ui/gameplay/createGameplayRenderer.ts src/ui/gameplay/createGameplayRenderer.test.ts
git commit -m "feat: emit gameplay HUD statistics"
```

## Task 4: Svelte Gameplay HUD Overlay

**Files:**
- Create: `src/ui/gameplay/GameplayHud.svelte`
- Modify: `src/ui/gameplay/GameplayScreen.svelte`
- Create: `src/ui/gameplay/gameplayHudUi.test.ts`

- [ ] **Step 1: Write failing UI source tests**

Create `src/ui/gameplay/gameplayHudUi.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import hudSource from './GameplayHud.svelte?raw'
import screenSource from './GameplayScreen.svelte?raw'

describe('Gameplay HUD Svelte UI', () => {
  it('renders gameplay HUD panels and mini-map marker loops', () => {
    expect(hudSource).toContain('class="gameplay-hud"')
    expect(hudSource).toContain('class="hud-status-panel"')
    expect(hudSource).toContain('class="hud-map-panel"')
    expect(hudSource).toContain('class="hud-readouts"')
    expect(hudSource).toContain('{#each state.mapPlatforms as platform}')
    expect(hudSource).toContain('{#each state.checkpointMarkers as checkpoint, index}')
    expect(hudSource).toContain('{#each state.enemyMarkers as enemy}')
    expect(hudSource).toContain('state.goalProgress')
    expect(hudSource).toContain('state.playerProgress')
    expect(hudSource).toContain('pointer-events: none')
  })

  it('renders required HUD readouts and three-HP state', () => {
    expect(hudSource).toContain('HP')
    expect(hudSource).toContain('{state.hp} / {state.hpMax}')
    expect(hudSource).toContain('COINS')
    expect(hudSource).toContain('DAMAGE')
    expect(hudSource).toContain('FALLS')
    expect(hudSource).toContain('ENEMIES')
    expect(hudSource).toContain('CHECKPOINTS')
    expect(hudSource).toContain('TIME')
  })

  it('wires GameplayScreen state to renderer HUD patches', () => {
    expect(screenSource).toContain("import GameplayHud from './GameplayHud.svelte'")
    expect(screenSource).toContain('createInitialGameplayHudState')
    expect(screenSource).toContain('applyGameplayHudPatch')
    expect(screenSource).toContain('onHudUpdate')
    expect(screenSource).toContain('<GameplayHud')
  })
})
```

- [ ] **Step 2: Run UI source tests and confirm expected failure**

Run:

```bash
npm run test -- src/ui/gameplay/gameplayHudUi.test.ts
```

Expected: FAIL because `GameplayHud.svelte` does not exist and `GameplayScreen.svelte` does not wire HUD state.

- [ ] **Step 3: Create `GameplayHud.svelte`**

Create `src/ui/gameplay/GameplayHud.svelte`:

```svelte
<script lang="ts">
  import type { GameplayHudState } from '../../domain/gameplay/gameplayHud'

  type Props = {
    state: GameplayHudState
    stageLabel: string
  }

  let { state, stageLabel }: Props = $props()
</script>

<div class="gameplay-hud" aria-label="Gameplay HUD">
  <section class="hud-panel hud-status-panel" aria-label="Player status">
    <span class="hud-kicker">STATUS</span>
    <strong>Yuuta Tsubasa</strong>
    <div class="hud-hp-row">
      <span>HP</span>
      <b>{state.hp} / {state.hpMax}</b>
    </div>
    <div class="hud-hp-bar" aria-hidden="true">
      <i style={`width:${Math.max(0, Math.min(100, (state.hp / state.hpMax) * 100))}%`}></i>
    </div>
  </section>

  <section class="hud-stage-banner" aria-label="Stage">
    <strong>{stageLabel}</strong>
    <span>{state.cleared ? 'CLEAR' : 'REACH GOAL'}</span>
  </section>

  <section class="hud-panel hud-map-panel" aria-label="Mini map">
    <span class="hud-kicker">MAP</span>
    <svg class="hud-mini-map" viewBox="0 0 100 36" aria-hidden="true">
      {#each state.mapPlatforms as platform}
        <line
          class="map-platform"
          x1={platform.x * 100}
          y1={platform.y * 36}
          x2={(platform.x + platform.width) * 100}
          y2={platform.y * 36}
        ></line>
      {/each}
      {#each state.checkpointMarkers as checkpoint, index}
        <path
          class:active={index <= state.activeCheckpointIndex}
          class="map-checkpoint"
          d={`M${checkpoint.x * 100} ${checkpoint.y * 36} V${checkpoint.y * 36 - 6} M${checkpoint.x * 100 - 1.7} ${checkpoint.y * 36 - 6} H${checkpoint.x * 100 + 1.7} V${checkpoint.y * 36 - 3} H${checkpoint.x * 100 - 1.7} Z`}
        ></path>
      {/each}
      <circle class="map-player" cx={state.playerProgress * 100} cy={state.playerProgressY * 36} r="2.4"></circle>
      {#each state.enemyMarkers as enemy}
        <circle class="map-enemy" cx={enemy.x * 100} cy={enemy.y * 36} r="1.4"></circle>
      {/each}
      <path
        class="map-goal"
        d={`M${state.goalProgress * 100} 9.1 V2 M${state.goalProgress * 100} 2 L${state.goalProgress * 100 - 6} 4.5 L${state.goalProgress * 100} 7`}
      ></path>
    </svg>
  </section>

  <section class="hud-panel hud-objective-panel" aria-label="Objective">
    <span class="hud-kicker">OBJECTIVE</span>
    <p>{state.cleared ? 'Stage clear' : 'Reach the goal'}</p>
  </section>

  <section class="hud-readouts" aria-label="Gameplay statistics">
    <div><span>TIME</span><b>{state.time}</b></div>
    <div><span>COINS</span><b>{state.coins} <small>/ {state.coinTarget}</small></b></div>
    <div><span>DAMAGE</span><b>{state.damageTaken}</b></div>
    <div><span>FALLS</span><b>{state.falls}</b></div>
    <div><span>ENEMIES</span><b>{state.enemiesDefeated} <small>/ {state.enemyTarget}</small></b></div>
    <div><span>CHECKPOINTS</span><b>{state.checkpointsReached} <small>/ {state.checkpointTarget}</small></b></div>
  </section>
</div>

<style>
  .gameplay-hud {
    --hud-accent: #2f6fd0;
    --hud-accent-soft: rgba(47, 111, 208, 0.28);
    --hud-ink: #16345c;
    --hud-panel: rgba(242, 250, 255, 0.86);
    --hud-gold: #f3c64d;
    position: absolute;
    inset: 0;
    z-index: 5;
    pointer-events: none;
    color: var(--hud-ink);
    font-family: Rajdhani, "Segoe UI", system-ui, sans-serif;
    font-weight: 700;
  }

  .hud-panel,
  .hud-readouts,
  .hud-stage-banner {
    position: absolute;
    border: 1px solid rgba(47, 111, 208, 0.44);
    border-radius: 8px;
    background: var(--hud-panel);
    box-shadow: 0 18px 40px -26px rgba(8, 32, 74, 0.72);
    backdrop-filter: blur(7px) saturate(125%);
  }

  .hud-kicker {
    display: block;
    color: rgba(22, 52, 92, 0.68);
    font-size: min(1.6cqh, 13px);
    letter-spacing: 0.16em;
  }

  .hud-status-panel {
    top: 2cqh;
    left: 1.5cqw;
    width: 22cqw;
    padding: 1.2cqh 1cqw;
  }

  .hud-status-panel strong {
    display: block;
    margin-top: 0.8cqh;
    font-size: min(2.5cqh, 24px);
    line-height: 1;
  }

  .hud-hp-row {
    display: flex;
    justify-content: space-between;
    margin-top: 1.4cqh;
    font-size: min(1.9cqh, 16px);
  }

  .hud-hp-bar {
    height: 8px;
    margin-top: 0.6cqh;
    overflow: hidden;
    border-radius: 999px;
    background: rgba(226, 87, 76, 0.16);
  }

  .hud-hp-bar i {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #e2574c, #ffb0a7);
  }

  .hud-stage-banner {
    top: 2cqh;
    left: 50%;
    width: 32cqw;
    padding: 1.1cqh 1cqw;
    transform: translateX(-50%);
    text-align: center;
    color: white;
    background: linear-gradient(180deg, #5ba3f0, #2f6fd0 54%, #16345c);
  }

  .hud-stage-banner strong {
    display: block;
    font-size: min(3cqh, 30px);
    line-height: 1;
    letter-spacing: 0.08em;
  }

  .hud-stage-banner span {
    color: #ffe6a0;
    font-size: min(1.5cqh, 13px);
    letter-spacing: 0.18em;
  }

  .hud-map-panel {
    top: 2cqh;
    right: 1.5cqw;
    width: 19cqw;
    padding: 1cqh 0.8cqw;
  }

  .hud-mini-map {
    display: block;
    width: 100%;
    height: 8cqh;
    margin-top: 0.8cqh;
    border: 1px solid var(--hud-accent-soft);
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.62);
  }

  .map-platform {
    stroke: var(--hud-accent);
    stroke-width: 2.2;
    stroke-linecap: square;
  }

  .map-checkpoint {
    fill: rgba(47, 111, 208, 0.18);
    stroke: rgba(47, 111, 208, 0.62);
    stroke-width: 0.65;
  }

  .map-checkpoint.active {
    fill: var(--hud-gold);
    stroke: #c5891f;
  }

  .map-player {
    fill: white;
    stroke: var(--hud-accent);
    stroke-width: 1.4;
  }

  .map-enemy {
    fill: #e2574c;
    stroke: white;
    stroke-width: 0.8;
  }

  .map-goal {
    fill: none;
    stroke: #c5891f;
    stroke-width: 1.7;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .hud-objective-panel {
    top: 16cqh;
    right: 1.5cqw;
    width: 19cqw;
    padding: 1cqh 0.8cqw;
  }

  .hud-objective-panel p {
    margin: 0.75cqh 0 0;
    font-size: min(1.9cqh, 16px);
    line-height: 1.2;
  }

  .hud-readouts {
    right: 1.5cqw;
    bottom: 1.8cqh;
    left: 1.5cqw;
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 0.6cqw;
    padding: 0.9cqh 1cqw;
  }

  .hud-readouts div {
    min-width: 0;
    padding: 0.45cqh 0.45cqw;
    border-radius: 5px;
    background: rgba(255, 255, 255, 0.48);
  }

  .hud-readouts span {
    display: block;
    color: rgba(22, 52, 92, 0.68);
    font-size: min(1.35cqh, 12px);
    letter-spacing: 0.12em;
  }

  .hud-readouts b {
    display: block;
    overflow-wrap: anywhere;
    font-size: min(2.1cqh, 18px);
    line-height: 1.05;
  }

  .hud-readouts small {
    font-size: 0.72em;
  }
</style>
```

- [ ] **Step 4: Wire HUD state in `GameplayScreen.svelte`**

Replace `src/ui/gameplay/GameplayScreen.svelte` script with this structure:

```svelte
<script lang="ts">
  import { onMount } from 'svelte'
  import type { GameplayStageMap } from '../../domain/gameplay/gameplayMapTypes'
  import {
    applyGameplayHudPatch,
    createInitialGameplayHudState,
    type GameplayHudPatch,
    type GameplayHudState,
  } from '../../domain/gameplay/gameplayHud'
  import GameplayHud from './GameplayHud.svelte'
  import { createGameplayRenderer } from './createGameplayRenderer'

  type Props = {
    stage: GameplayStageMap
  }

  let { stage }: Props = $props()

  let container: HTMLDivElement
  let hudState: GameplayHudState = $state(createInitialGameplayHudState(stage))

  function applyHudPatch(patch: GameplayHudPatch): void {
    hudState = applyGameplayHudPatch(hudState, patch)
  }

  onMount(() => {
    hudState = createInitialGameplayHudState(stage)
    const game = createGameplayRenderer({
      parent: container,
      stage,
      onHudUpdate: applyHudPatch,
    })

    return () => {
      game.destroy(true)
    }
  })
</script>

<section class="gameplay-screen" aria-label={`Gameplay ${stage.id}`}>
  <div bind:this={container} class="gameplay-canvas"></div>
  <GameplayHud state={hudState} stageLabel={stage.id} />
</section>
```

Keep the existing styles and ensure `.gameplay-screen` remains `position: relative`.

- [ ] **Step 5: Run UI source tests and Svelte check**

Run:

```bash
npm run test -- src/ui/gameplay/gameplayHudUi.test.ts
npm run check
```

Expected: PASS and `svelte-check found 0 errors and 0 warnings`.

- [ ] **Step 6: Commit Task 4**

```bash
git add src/ui/gameplay/GameplayHud.svelte src/ui/gameplay/GameplayScreen.svelte src/ui/gameplay/gameplayHudUi.test.ts
git commit -m "feat: render gameplay HUD overlay"
```

## Task 5: Full Verification And Visual Sanity

**Files:**
- No source edits expected unless verification exposes a defect.

- [ ] **Step 1: Run focused HUD tests**

Run:

```bash
npm run test -- src/domain/gameplay/gameplayHud.test.ts src/ui/gameplay/gameplayHudUi.test.ts src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run full test suite**

Run:

```bash
npm run test
```

Expected: PASS.

- [ ] **Step 3: Run Svelte/TypeScript check**

Run:

```bash
npm run check
```

Expected: PASS with `0 errors` and `0 warnings`.

- [ ] **Step 4: Run production build**

Run:

```bash
npm run build
```

Expected: PASS. Existing Vite chunk-size warning is acceptable if no new build error appears.

- [ ] **Step 5: Run whitespace and prototype-boundary checks**

Run:

```bash
git diff --check
rg "__prototype__" src public --glob '!**/*.test.ts'
```

Expected: `git diff --check` has no output. The `rg` command has no output and exits with status `1` because runtime code does not reference `__prototype__`.

- [ ] **Step 6: Browser visual sanity check**

Run the app with the existing dev server if active, or start one with:

```bash
npm run dev -- --host 127.0.0.1
```

Open the current local app and verify:

- HUD appears above the canvas.
- HP reads `3 / 3`.
- Bottom readouts fit without overlap.
- Mini map shows platform/checkpoint/player/enemy/goal markers.
- HUD does not block gameplay input because its overlay uses `pointer-events: none`.

- [ ] **Step 7: Commit verification fixes only if needed**

If verification exposes a defect, write the smallest failing test that captures the defect, fix it, rerun the failed command plus the relevant full check, then commit with a message matching the fix scope.

If all verification passes without source edits, do not create a verification-only commit.

## Self-Review

- Spec coverage: Task 1 covers pure labels, progress, markers, initial state, and reducer behavior. Tasks 2 and 3 cover renderer callback boundary and live runtime HUD patches. Task 4 covers Svelte overlay rendering, three HP, statistics, checkpoint progress, mini-map markers, and pointer-events. Task 5 covers required verification and visual sanity.
- Placeholder scan: The plan contains no `TBD`, `TODO`, or deferred implementation markers. Each task has concrete files, test code, implementation snippets, commands, and commit messages.
- Type consistency: `GameplayHudState`, `GameplayHudPatch`, `createInitialGameplayHudState`, `applyGameplayHudPatch`, and `onHudUpdate` are defined once and used consistently across domain, renderer, and Svelte tasks.
- Scope check: The plan excludes StageResult, persistence, audio, pause menu, virtual controls, boss HUD variants, and runtime imports from `__prototype__`, matching the approved spec.

