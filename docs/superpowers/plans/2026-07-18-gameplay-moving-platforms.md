# Gameplay Moving Platforms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build reusable moving platform gameplay for World 2 stages, starting from pure domain motion rules and wiring them through stage conversion and the Phaser renderer.

**Architecture:** Motion math lives in `src/domain/gameplay/movingPlatform.ts` as pure functions. Stage source conversion exposes immutable moving platform spawn data on `GameplayStageMap`. `createGameplayRenderer.ts` remains a Phaser adapter that creates sprites/bodies and projects elapsed gameplay time into positions on each update.

**Tech Stack:** TypeScript, Vitest, Svelte/Vite, Phaser Arcade Physics.

---

## File Structure

- Create `src/domain/gameplay/movingPlatform.ts`: pure moving platform origin, phase, and ping-pong position rules.
- Create `src/domain/gameplay/movingPlatform.test.ts`: domain red/green tests for deterministic movement.
- Modify `src/domain/gameplay/gameplayMapTypes.ts`: add `GameplayMovingPlatformSpawn` and `movingPlatforms` to `GameplayStageMap`.
- Modify `src/domain/gameplay/gameplayStageMapConverter.ts`: convert supported `source.movingPlatforms` instead of diagnostic-only handling.
- Modify `src/domain/gameplay/gameplayStageMapConverter.test.ts`: prove source conversion preserves moving platform metadata.
- Modify `src/domain/gameplay/gameplayStageMaps.test.ts`: prove 2-1 has moving platform runtime data and no moving platform unsupported diagnostic.
- Modify `src/domain/gameplay/gameplayHud.test.ts` and any fixture creators that construct `GameplayStageMap`: add `movingPlatforms: []`.
- Modify `src/ui/gameplay/createGameplayRenderer.ts`: create, collide, and update moving platform sprites from domain state.
- Modify `src/ui/gameplay/createGameplayRenderer.test.ts`: add fake runtime coverage for moving platform creation, collision, and update behavior.

## Task 1: Pure Moving Platform Domain

**Files:**
- Create: `src/domain/gameplay/movingPlatform.ts`
- Create: `src/domain/gameplay/movingPlatform.test.ts`

- [ ] **Step 1: Write failing domain tests**

Create `src/domain/gameplay/movingPlatform.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  getMovingPlatformOrigin,
  getMovingPlatformPositionAtTime,
  normalizeMovingPlatformPhase,
} from './movingPlatform'

describe('getMovingPlatformOrigin', () => {
  it('converts tile grid placement into a world-space platform center', () => {
    expect(getMovingPlatformOrigin({
      col: 26,
      row: 9,
      width: 4,
      height: 1,
      tileSize: 64,
    })).toEqual({ x: 1792, y: 608 })
  })
})

describe('normalizeMovingPlatformPhase', () => {
  it('wraps phase values into the 0..1 range', () => {
    expect(normalizeMovingPlatformPhase(undefined)).toBe(0)
    expect(normalizeMovingPlatformPhase(0.35)).toBe(0.35)
    expect(normalizeMovingPlatformPhase(1.25)).toBe(0.25)
    expect(normalizeMovingPlatformPhase(-0.25)).toBe(0.75)
  })
})

describe('getMovingPlatformPositionAtTime', () => {
  const verticalPath = {
    origin: { x: 1792, y: 608 },
    axis: 'y' as const,
    distance: 72,
    durationMs: 2100,
    phase: 0,
  }

  it('moves from origin to endpoint and back over one ping-pong cycle', () => {
    expect(getMovingPlatformPositionAtTime({ path: verticalPath, elapsedMs: 0 })).toEqual({
      x: 1792,
      y: 608,
      progress: 0,
      direction: 1,
    })
    expect(getMovingPlatformPositionAtTime({ path: verticalPath, elapsedMs: 1050 })).toEqual({
      x: 1792,
      y: 680,
      progress: 1,
      direction: -1,
    })
    expect(getMovingPlatformPositionAtTime({ path: verticalPath, elapsedMs: 2100 })).toEqual({
      x: 1792,
      y: 608,
      progress: 0,
      direction: 1,
    })
  })

  it('moves only on the configured axis', () => {
    expect(getMovingPlatformPositionAtTime({
      path: {
        origin: { x: 3200, y: 608 },
        axis: 'x',
        distance: 112,
        durationMs: 2600,
        phase: 0,
      },
      elapsedMs: 650,
    })).toEqual({
      x: 3256,
      y: 608,
      progress: 0.5,
      direction: 1,
    })
  })

  it('applies phase as a loop offset', () => {
    expect(getMovingPlatformPositionAtTime({
      path: { ...verticalPath, phase: 0.25 },
      elapsedMs: 0,
    })).toEqual({
      x: 1792,
      y: 644,
      progress: 0.5,
      direction: 1,
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- src/domain/gameplay/movingPlatform.test.ts
```

Expected: FAIL because `./movingPlatform` does not exist.

- [ ] **Step 3: Write minimal domain implementation**

Create `src/domain/gameplay/movingPlatform.ts`:

```ts
export type MovingPlatformAxis = 'x' | 'y'
export type MovingPlatformDirection = -1 | 1

export type MovingPlatformOriginInput = {
  col: number
  row: number
  width: number
  height: number
  tileSize: number
}

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
  direction: MovingPlatformDirection
}

export function getMovingPlatformOrigin(input: MovingPlatformOriginInput): { x: number; y: number } {
  return {
    x: (input.col + input.width / 2) * input.tileSize,
    y: (input.row + input.height / 2) * input.tileSize,
  }
}

export function normalizeMovingPlatformPhase(phase: number | undefined): number {
  if (phase === undefined || !Number.isFinite(phase)) return 0
  return ((phase % 1) + 1) % 1
}

export function getMovingPlatformPositionAtTime(input: {
  path: MovingPlatformPath
  elapsedMs: number
}): MovingPlatformPosition {
  const durationMs = Math.max(1, input.path.durationMs)
  const cycleProgress = ((Math.max(0, input.elapsedMs) / durationMs + normalizeMovingPlatformPhase(input.path.phase)) % 1 + 1) % 1
  const progress = cycleProgress <= 0.5 ? cycleProgress * 2 : (1 - cycleProgress) * 2
  const direction: MovingPlatformDirection = cycleProgress < 0.5 ? 1 : -1
  const offset = input.path.distance * progress

  return {
    x: input.path.origin.x + (input.path.axis === 'x' ? offset : 0),
    y: input.path.origin.y + (input.path.axis === 'y' ? offset : 0),
    progress,
    direction,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm run test -- src/domain/gameplay/movingPlatform.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/gameplay/movingPlatform.ts src/domain/gameplay/movingPlatform.test.ts
git commit -m "Add moving platform domain rules"
```

## Task 2: Stage Map Conversion

**Files:**
- Modify: `src/domain/gameplay/gameplayMapTypes.ts`
- Modify: `src/domain/gameplay/gameplayStageMapConverter.ts`
- Modify: `src/domain/gameplay/gameplayStageMapConverter.test.ts`
- Modify: `src/domain/gameplay/gameplayStageMaps.test.ts`
- Modify: `src/domain/gameplay/gameplayHud.test.ts`
- Modify: `src/ui/gameplay/createGameplayRenderer.test.ts`

- [ ] **Step 1: Write failing converter/map tests**

In `src/domain/gameplay/gameplayStageMapConverter.test.ts`, add:

```ts
it('converts supported moving platform source data into runtime map spawns', () => {
  const source = {
    ...firstGateSource,
    movingPlatforms: [
      {
        id: 'first-vine-lift',
        col: 26,
        row: 9,
        width: 4,
        height: 1,
        axis: 'y',
        distance: 72,
        durationMs: 2100,
      },
      {
        id: 'thorn-gap-ferry',
        col: 52,
        row: 9,
        width: 4,
        height: 1,
        axis: 'x',
        distance: 112,
        durationMs: 2600,
        phase: 0.35,
      },
    ],
  } satisfies GameplayStageSource

  const result = convertGameplayStageSource(source, gameplayStageVisualProfiles)

  expect(result.map.movingPlatforms).toEqual([
    {
      id: 'first-vine-lift',
      col: 26,
      row: 9,
      width: 4,
      height: 1,
      axis: 'y',
      distance: 72,
      durationMs: 2100,
      phase: 0,
      origin: { x: 1792, y: 608 },
    },
    {
      id: 'thorn-gap-ferry',
      col: 52,
      row: 9,
      width: 4,
      height: 1,
      axis: 'x',
      distance: 112,
      durationMs: 2600,
      phase: 0.35,
      origin: { x: 3456, y: 608 },
    },
  ])
  expect(result.diagnostics.some((diagnostic) => diagnostic.code === 'unsupported-moving-platform')).toBe(false)
})
```

In `src/domain/gameplay/gameplayStageMaps.test.ts`, change the unsupported diagnostics test:

```ts
it('exposes diagnostics only for mechanics that remain unsupported in converted source stages', () => {
  expect(gameplayStageConversionDiagnostics.some((diagnostic) =>
    diagnostic.stageId === '2-1' && diagnostic.code === 'unsupported-moving-platform',
  )).toBe(false)
  expect(gameplayStageConversionDiagnostics.some((diagnostic) =>
    diagnostic.stageId === '4-4' && diagnostic.code === 'unsupported-surface-zone',
  )).toBe(true)
})
```

Also add:

```ts
it('preserves 2-1 moving platform runtime data', () => {
  expect(getGameplayStageMap('2-1')?.movingPlatforms).toEqual([
    expect.objectContaining({ id: 'first-vine-lift', axis: 'y', distance: 72, durationMs: 2100 }),
    expect.objectContaining({ id: 'thorn-gap-ferry', axis: 'x', distance: 112, durationMs: 2600, phase: 0.35 }),
    expect.objectContaining({ id: 'canopy-ferry', axis: 'x', distance: 112, durationMs: 2800, phase: 0.6 }),
  ])
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm run test -- src/domain/gameplay/gameplayStageMapConverter.test.ts src/domain/gameplay/gameplayStageMaps.test.ts
```

Expected: FAIL because `GameplayStageMap` has no `movingPlatforms` and converter still emits `unsupported-moving-platform`.

- [ ] **Step 3: Add runtime map type**

In `src/domain/gameplay/gameplayMapTypes.ts`, update `GameplayStageMap`:

```ts
  enemies: readonly GameplayEnemySpawn[]
  movingPlatforms: readonly GameplayMovingPlatformSpawn[]
  coins: readonly GameplayCoinPoint[]
```

Add:

```ts
export type GameplayMovingPlatformSpawn = PlatformRect & {
  id: string
  axis: 'x' | 'y'
  distance: number
  durationMs: number
  phase: number
  origin: { x: number; y: number }
}
```

- [ ] **Step 4: Update converter**

In `src/domain/gameplay/gameplayStageMapConverter.ts`, import domain helpers:

```ts
import {
  getMovingPlatformOrigin,
  normalizeMovingPlatformPhase,
} from './movingPlatform'
```

Remove the loop that pushes `unsupported-moving-platform` diagnostics for every moving platform.

Add `movingPlatforms` in the returned map:

```ts
      enemies: source.enemies.map(convertEnemy),
      movingPlatforms: (source.movingPlatforms ?? []).map((platform) => ({
        ...platform,
        phase: normalizeMovingPlatformPhase(platform.phase),
        origin: getMovingPlatformOrigin({
          col: platform.col,
          row: platform.row,
          width: platform.width,
          height: platform.height,
          tileSize: source.world.tileSize,
        }),
      })),
      coins: source.coins.map((coin, index) => ({
```

- [ ] **Step 5: Add empty fixtures where maps are hand-built**

Add `movingPlatforms: []` to every hand-built `GameplayStageMap` fixture that TypeScript reports, including:

```ts
movingPlatforms: [],
```

Expected files include:

- `src/domain/gameplay/gameplayHud.test.ts`
- `src/ui/gameplay/createGameplayRenderer.test.ts`

- [ ] **Step 6: Run tests to verify they pass**

Run:

```bash
npm run test -- src/domain/gameplay/gameplayStageMapConverter.test.ts src/domain/gameplay/gameplayStageMaps.test.ts src/domain/gameplay/gameplayHud.test.ts src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/domain/gameplay/gameplayMapTypes.ts src/domain/gameplay/gameplayStageMapConverter.ts src/domain/gameplay/gameplayStageMapConverter.test.ts src/domain/gameplay/gameplayStageMaps.test.ts src/domain/gameplay/gameplayHud.test.ts src/ui/gameplay/createGameplayRenderer.test.ts
git commit -m "Convert moving platforms into gameplay maps"
```

## Task 3: Renderer Moving Platform Runtime

**Files:**
- Modify: `src/ui/gameplay/createGameplayRenderer.ts`
- Modify: `src/ui/gameplay/createGameplayRenderer.test.ts`

- [ ] **Step 1: Write failing renderer tests**

In `src/ui/gameplay/createGameplayRenderer.test.ts`, add tests near terrain/platform rendering tests:

```ts
it('creates moving platform sprites from stage map data and registers player collision', () => {
  const stage = createEnemyFixtureStage()
  stage.movingPlatforms = [
    {
      id: 'test-lift',
      col: 10,
      row: 8,
      width: 3,
      height: 1,
      axis: 'y',
      distance: 64,
      durationMs: 1000,
      phase: 0,
      origin: { x: 736, y: 544 },
    },
  ]
  const runtime = createSceneRuntime({ stage })

  runtime.scene.create()

  const movingPlatform = runtime.staticImageCalls.find((sprite) => sprite.texture === 'terrain-tiles' && sprite.x === 736)
  expect(movingPlatform).toBeDefined()
  expect(runtime.colliderCalls).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ a: runtime.playerSprite, b: movingPlatform }),
    ]),
  )
})
```

Add:

```ts
it('updates moving platform positions from elapsed gameplay time', () => {
  const stage = createEnemyFixtureStage()
  stage.movingPlatforms = [
    {
      id: 'test-ferry',
      col: 10,
      row: 8,
      width: 3,
      height: 1,
      axis: 'x',
      distance: 100,
      durationMs: 1000,
      phase: 0,
      origin: { x: 736, y: 544 },
    },
  ]
  const runtime = createSceneRuntime({ stage })
  runtime.scene.create()
  startGameplay(runtime)

  const movingPlatform = runtime.staticImageCalls.find((sprite) => sprite.texture === 'terrain-tiles' && sprite.x === 736)
  expect(movingPlatform).toBeDefined()
  if (!movingPlatform) return

  runtime.scene.update(250, 250)

  expect(movingPlatform.x).toBe(786)
  expect(movingPlatform.y).toBe(544)
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: FAIL because renderer does not create moving platform objects.

- [ ] **Step 3: Add moving platform runtime state**

In `src/ui/gameplay/createGameplayRenderer.ts`, update imports:

```ts
import type { GameplayMovingPlatformSpawn } from '../../domain/gameplay/gameplayMapTypes'
import { getMovingPlatformPositionAtTime } from '../../domain/gameplay/movingPlatform'
```

Add runtime type:

```ts
type MovingPlatformRuntime = {
  sprite: Phaser.Types.Physics.Arcade.ImageWithStaticBody
  spawn: GameplayMovingPlatformSpawn
}
```

Add class field:

```ts
  private movingPlatforms: MovingPlatformRuntime[] = []
```

- [ ] **Step 4: Create moving platforms in scene creation**

In `create()`, after terrain layer creation and before player/enemy colliders are finalized, call:

```ts
    this.createMovingPlatforms()
```

Add method:

```ts
  private createMovingPlatforms(): void {
    this.movingPlatforms = this.stageMap.movingPlatforms.map((spawn) => {
      const sprite = this.physics.add.staticImage(
        spawn.origin.x,
        spawn.origin.y,
        'terrain-tiles',
        1,
      )
      sprite.setOrigin(0.5, 0.5)
      sprite.setDisplaySize(
        spawn.width * this.stageMap.world.tileSize,
        spawn.height * this.stageMap.world.tileSize,
      )
      sprite.setDepth(6)
      sprite.refreshBody()

      return { sprite, spawn }
    })
  }
```

- [ ] **Step 5: Register player/enemy collisions**

After `this.createPlayer()` and after enemies are available, register:

```ts
    for (const platform of this.movingPlatforms) {
      this.physics.add.collider(this.player, platform.sprite)
      for (const enemy of this.enemies) {
        this.physics.add.collider(enemy.sprite, platform.sprite)
      }
    }
```

If `this.player` is nullable at that point, guard with:

```ts
    if (!this.player) return
```

- [ ] **Step 6: Update platform positions in the gameplay loop**

Call from `update()` after gameplay elapsed time advances:

```ts
    this.updateMovingPlatforms()
```

Add method:

```ts
  private updateMovingPlatforms(): void {
    for (const platform of this.movingPlatforms) {
      const position = getMovingPlatformPositionAtTime({
        path: {
          origin: platform.spawn.origin,
          axis: platform.spawn.axis,
          distance: platform.spawn.distance,
          durationMs: platform.spawn.durationMs,
          phase: platform.spawn.phase,
        },
        elapsedMs: this.gameplayElapsedMs,
      })
      platform.sprite.setPosition(position.x, position.y)
      platform.sprite.refreshBody()
    }
  }
```

- [ ] **Step 7: Run tests to verify they pass**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/ui/gameplay/createGameplayRenderer.ts src/ui/gameplay/createGameplayRenderer.test.ts
git commit -m "Render moving platforms in gameplay"
```

## Task 4: Full Verification and Browser Smoke Test

**Files:**
- Modify only if verification exposes defects.

- [ ] **Step 1: Run full tests**

```bash
npm run test
```

Expected: all tests pass.

- [ ] **Step 2: Run TypeScript/Svelte check**

```bash
npm run check
```

Expected: `svelte-check found 0 errors and 0 warnings`.

- [ ] **Step 3: Run production build**

```bash
npm run build
```

Expected: build exits 0. The existing large chunk warning is acceptable.

- [ ] **Step 4: Run diff whitespace check**

```bash
git diff --check
```

Expected: no output and exit 0.

- [ ] **Step 5: Check runtime prototype boundary**

```bash
rg -n "__prototype__" src public package.json
```

Expected: no runtime imports or runtime asset refs from `__prototype__`. Tests may contain assertions that reject prototype paths; runtime code must not.

- [ ] **Step 6: Browser smoke test**

Use the existing dev server or start one:

```bash
npm run dev -- --port 62262
```

Open a World 2 stage, preferably `2-1`, and confirm:

- page loads without console errors
- moving platforms are visible
- moving platforms move on their configured axis
- player can collide with them enough for basic traversal

- [ ] **Step 7: Final commit if verification fixes were needed**

If Task 4 required fixes:

```bash
git status --short
git add docs/superpowers/plans/2026-07-18-gameplay-moving-platforms.md src/domain/gameplay/movingPlatform.ts src/domain/gameplay/movingPlatform.test.ts src/domain/gameplay/gameplayMapTypes.ts src/domain/gameplay/gameplayStageMapConverter.ts src/domain/gameplay/gameplayStageMapConverter.test.ts src/domain/gameplay/gameplayStageMaps.test.ts src/domain/gameplay/gameplayHud.test.ts src/ui/gameplay/createGameplayRenderer.ts src/ui/gameplay/createGameplayRenderer.test.ts
git commit -m "Fix moving platform verification issues"
```

If no fixes were needed, do not create an empty commit.

## Self-Review

- Spec coverage:
  - Pure deterministic domain motion: Task 1.
  - Runtime map data and 2-1 diagnostics: Task 2.
  - Renderer adapter and reactive update loop: Task 3.
  - Verification and prototype boundary: Task 4.
- Placeholder scan: no TBD/TODO/fill-in-later items remain.
- Type consistency:
  - `GameplayMovingPlatformSpawn` is introduced before renderer imports it.
  - `getMovingPlatformPositionAtTime` and `normalizeMovingPlatformPhase` names match across tasks.
  - `movingPlatforms` is added to map fixtures before renderer tests rely on it.
