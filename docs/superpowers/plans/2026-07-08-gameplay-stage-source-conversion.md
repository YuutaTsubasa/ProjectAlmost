# Gameplay Stage Source Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a pure stage-source conversion pipeline so all 36 normal gameplay stages can produce renderer-ready `GameplayStageMap` objects, while unsupported mechanics are reported as diagnostics.

**Architecture:** Add rebuilt-project stage source types/data under `src/domain/gameplay/`, then convert them through a pure domain converter into the existing `GameplayStageMap` shape. Keep `createGameplayRenderer.ts` consuming `GameplayStageMap`; this slice adds no renderer behavior for deferred mechanics.

**Tech Stack:** TypeScript, Vitest, Vite/Svelte frontend, Phaser renderer boundary.

---

## File Structure

- Create `src/domain/gameplay/gameplayStageSource.ts`
  - Owns rebuilt-project stage-source types, diagnostics types, theme asset mapping types, and default theme assets.
  - No imports from `__prototype__/`.

- Create `src/domain/gameplay/gameplayStageMapConverter.ts`
  - Owns pure conversion from `GameplayStageSource` to `{ map, diagnostics }`.
  - No Phaser, DOM, Svelte, file reads, or mutation.

- Create `src/domain/gameplay/gameplayStageMapConverter.test.ts`
  - Locks conversion behavior using small inline source fixtures.

- Create `src/domain/gameplay/gameplayStageSources.ts`
  - Owns the rebuilt-project source catalog for all 36 normal stages.
  - Data is copied from prototype stage JSON as source data, but lives in the rebuilt project and is not imported from `__prototype__/`.

- Modify `src/domain/gameplay/gameplayStageMaps.ts`
  - Builds `gameplayStageMaps` from source conversion results.
  - Exposes conversion diagnostics for tests and future slices.

- Modify `src/domain/gameplay/gameplayStageMaps.test.ts`
  - Updates catalog expectations from a single hand-authored `1-1` map to 36 converted maps.

- Modify `src/ui/gameplay/createGameplayRenderer.test.ts`
  - Adds renderer contract tests for representative converted stages.

---

### Task 1: Pure Stage Source Converter

**Files:**
- Create: `src/domain/gameplay/gameplayStageSource.ts`
- Create: `src/domain/gameplay/gameplayStageMapConverter.ts`
- Create: `src/domain/gameplay/gameplayStageMapConverter.test.ts`

- [ ] **Step 1: Write the failing converter tests**

Create `src/domain/gameplay/gameplayStageMapConverter.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { convertGameplayStageSource } from './gameplayStageMapConverter'
import { defaultGameplayThemeAssets, type GameplayStageSource } from './gameplayStageSource'

const firstGateSource: GameplayStageSource = {
  id: '1-1',
  rankTargets: {
    sTime: 30,
    aTime: 42,
    bTime: 58,
    cTime: 78,
  },
  world: {
    width: 9600,
    height: 1080,
    tileSize: 64,
  },
  playerSpawn: {
    x: 256,
    surfaceY: 512,
  },
  platforms: [
    { col: 2, row: 8, width: 12, height: 1 },
    { col: 16, row: 8, width: 5, height: 1 },
  ],
  coins: [
    { x: 420, y: 456 },
    { x: 560, y: 456 },
  ],
  enemies: [
    {
      id: 'first-guard',
      x: 720,
      surfaceY: 512,
      patrolMinX: 608,
      patrolMaxX: 832,
    },
    {
      id: 'first-core',
      type: 'azure-core',
      x: 1760,
      y: 320,
      patrolMinX: 1760,
      patrolMaxX: 1760,
    },
  ],
  hazards: [
    {
      id: 'first-spikes',
      type: 'spikes',
      x: 760,
      surfaceY: 512,
      width: 180,
      height: 62,
      orientation: 'floor',
    },
  ],
  checkpoints: [
    {
      id: 'combat-gate',
      x: 2540,
      surfaceY: 512,
      spawnX: 2600,
      spawnSurfaceY: 512,
    },
  ],
  goal: {
    x: 9340,
    surfaceY: 512,
  },
}

describe('convertGameplayStageSource', () => {
  it('converts supported stage source fields into a renderer-ready gameplay map', () => {
    const result = convertGameplayStageSource(firstGateSource, defaultGameplayThemeAssets)

    expect(result.diagnostics).toEqual([])
    expect(result.map).toMatchObject({
      id: '1-1',
      theme: 'white-palace',
      world: {
        width: 9600,
        height: 1080,
        tileSize: 64,
      },
      rankTargets: {
        sTime: 30,
        aTime: 42,
        bTime: 58,
        cTime: 78,
      },
      player: {
        actorId: 'player',
        spawn: {
          x: 256,
          surfaceY: 512,
        },
      },
      terrain: {
        tilesetAssetRef: '/assets/tiles/white_palace_platform_tiles.webp',
        solidTileIndexes: [0, 1, 2],
        platforms: firstGateSource.platforms,
      },
      goal: {
        x: 9340,
        surfaceY: 512,
      },
    })
    expect(result.map.backgroundLayers.map((layer) => layer.id)).toEqual(['sky', 'far', 'mid'])
    expect(result.map.backgroundLayers.map((layer) => layer.assetRef)).toEqual([
      '/assets/maps/white_palace_sky.webp',
      '/assets/maps/white_palace_far_bg.webp',
      '/assets/maps/white_palace_mid_bg_loop.webp',
    ])
  })

  it('assigns stable coin ids from stage id and source order', () => {
    const result = convertGameplayStageSource(firstGateSource, defaultGameplayThemeAssets)

    expect(result.map.coins).toEqual([
      { id: '1-1-coin-001', x: 420, y: 456 },
      { id: '1-1-coin-002', x: 560, y: 456 },
    ])
  })

  it('converts prototype guard enemy shapes into Armor Guard runtime spawns', () => {
    const result = convertGameplayStageSource(firstGateSource, defaultGameplayThemeAssets)

    expect(result.map.enemies).toEqual([
      {
        id: 'first-guard',
        type: 'armor-guard',
        x: 720,
        surfaceY: 512,
        patrolMinX: 608,
        patrolMaxX: 832,
      },
      {
        id: 'first-core',
        type: 'azure-core',
        x: 1760,
        y: 320,
        patrolMinX: 1760,
        patrolMaxX: 1760,
      },
    ])
  })

  it('emits diagnostics for unsupported mechanics without putting them into the runtime map', () => {
    const result = convertGameplayStageSource(
      {
        ...firstGateSource,
        movingPlatforms: [
          {
            id: 'moving-a',
            col: 10,
            row: 8,
            width: 4,
            height: 1,
            axis: 'x',
            distance: 112,
            durationMs: 2600,
          },
        ],
        gravityZones: [
          {
            id: 'gravity-a',
            x: 400,
            y: 0,
            width: 640,
            height: 1080,
            direction: 'up',
          },
        ],
        surfaceZones: [
          {
            id: 'ice-a',
            type: 'ice',
            x: 900,
            y: 0,
            width: 1200,
            height: 1080,
          },
        ],
        hazards: [
          ...firstGateSource.hazards,
          {
            id: 'lava-a',
            type: 'lava',
            x: 1000,
            surfaceY: 700,
            width: 300,
            height: 64,
          },
        ],
      },
      defaultGameplayThemeAssets,
    )

    expect(result.map.hazards).toEqual([
      {
        id: 'first-spikes',
        type: 'spikes',
        x: 760,
        surfaceY: 512,
        width: 180,
        height: 62,
        orientation: 'floor',
      },
    ])
    expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      'unsupported-moving-platform',
      'unsupported-gravity-zone',
      'unsupported-surface-zone',
      'unsupported-hazard',
    ])
    expect(result.diagnostics.map((diagnostic) => diagnostic.sourceId)).toEqual([
      'moving-a',
      'gravity-a',
      'ice-a',
      'lava-a',
    ])
  })

  it('maps every supported theme to renderable asset refs', () => {
    const themeIds = [
      'white-palace',
      'emerald-sanctuary',
      'cerulean-depths',
      'frostveil-peaks',
      'emberfall-caldera',
      'abyssal-hollow',
    ] as const

    for (const theme of themeIds) {
      const result = convertGameplayStageSource(
        {
          ...firstGateSource,
          theme,
        },
        defaultGameplayThemeAssets,
      )

      expect(result.map.theme).toBe(theme)
      expect(result.map.backgroundLayers).toHaveLength(3)
      expect(result.map.backgroundLayers.every((layer) => layer.assetRef.startsWith('/assets/'))).toBe(true)
      expect(result.map.terrain.tilesetAssetRef).toMatch(/^\/assets\//)
    }
  })
})
```

- [ ] **Step 2: Run converter tests and verify RED**

Run:

```bash
npm run test -- src/domain/gameplay/gameplayStageMapConverter.test.ts
```

Expected: FAIL because `./gameplayStageMapConverter` and `./gameplayStageSource` do not exist.

- [ ] **Step 3: Add stage source types and default theme assets**

Create `src/domain/gameplay/gameplayStageSource.ts`:

```ts
import type { StageId } from '../data/worlds/worldTypes'
import type { GameplayTheme } from './gameplayMapTypes'
import type { RankTargets } from './stageResult'

export type GameplayStageSourceTheme =
  | 'white-palace'
  | 'emerald-sanctuary'
  | 'cerulean-depths'
  | 'frostveil-peaks'
  | 'emberfall-caldera'
  | 'abyssal-hollow'

export type GameplayStageSource = {
  id: StageId
  theme?: GameplayStageSourceTheme
  rankTargets: RankTargets
  world: {
    width: number
    height: number
    tileSize: number
  }
  playerSpawn: {
    x: number
    surfaceY: number
    gravity?: 'down' | 'up'
  }
  platforms: readonly GameplayStageSourcePlatform[]
  movingPlatforms?: readonly GameplayStageSourceMovingPlatform[]
  hazards?: readonly GameplayStageSourceHazard[]
  gravityZones?: readonly GameplayStageSourceGravityZone[]
  surfaceZones?: readonly GameplayStageSourceSurfaceZone[]
  coins: readonly GameplayStageSourceCoin[]
  enemies: readonly GameplayStageSourceEnemy[]
  checkpoints: readonly GameplayStageSourceCheckpoint[]
  goal: {
    x: number
    surfaceY: number
  }
}

export type GameplayStageSourcePlatform = {
  col: number
  row: number
  width: number
  height: number
}

export type GameplayStageSourceMovingPlatform = GameplayStageSourcePlatform & {
  id: string
  axis: 'x' | 'y'
  distance: number
  durationMs: number
  phase?: number
}

export type GameplayStageSourceHazard = {
  id: string
  type: 'spikes' | 'lava'
  x: number
  surfaceY: number
  width: number
  height: number
  orientation?: 'floor' | 'ceiling' | 'left-wall' | 'right-wall'
}

export type GameplayStageSourceGravityZone = {
  id: string
  x: number
  y: number
  width: number
  height: number
  direction: 'down' | 'up'
}

export type GameplayStageSourceSurfaceZone = {
  id: string
  type: 'ice'
  x: number
  y: number
  width: number
  height: number
}

export type GameplayStageSourceCoin = {
  x: number
  y: number
}

export type GameplayStageSourceGuardEnemy = {
  id: string
  type?: 'guard'
  x: number
  surfaceY: number
  patrolMinX: number
  patrolMaxX: number
}

export type GameplayStageSourceAzureCoreEnemy = {
  id: string
  type: 'azure-core'
  x: number
  y: number
  patrolMinX: number
  patrolMaxX: number
}

export type GameplayStageSourceEnemy =
  | GameplayStageSourceGuardEnemy
  | GameplayStageSourceAzureCoreEnemy

export type GameplayStageSourceCheckpoint = {
  id: string
  x: number
  surfaceY: number
  spawnX: number
  spawnSurfaceY: number
  spawnGravity?: 'down' | 'up'
}

export type GameplayStageConversionDiagnosticCode =
  | 'unsupported-moving-platform'
  | 'unsupported-gravity-zone'
  | 'unsupported-surface-zone'
  | 'unsupported-hazard'
  | 'theme-asset-fallback'

export type GameplayStageConversionDiagnostic = {
  stageId: StageId
  code: GameplayStageConversionDiagnosticCode
  sourceId?: string
  message: string
}

export type GameplayThemeAssets = {
  backgroundLayers: readonly [
    { id: 'sky'; assetRef: string },
    { id: 'far'; assetRef: string },
    { id: 'mid'; assetRef: string },
  ]
  terrainTilesetAssetRef: string
  fallback?: true
}

export const defaultGameplayThemeAssets: Record<GameplayStageSourceTheme, GameplayThemeAssets> = {
  'white-palace': {
    backgroundLayers: [
      { id: 'sky', assetRef: '/assets/maps/white_palace_sky.webp' },
      { id: 'far', assetRef: '/assets/maps/white_palace_far_bg.webp' },
      { id: 'mid', assetRef: '/assets/maps/white_palace_mid_bg_loop.webp' },
    ],
    terrainTilesetAssetRef: '/assets/tiles/white_palace_platform_tiles.webp',
  },
  'emerald-sanctuary': {
    backgroundLayers: [
      { id: 'sky', assetRef: '/assets/maps/white_palace_sky.webp' },
      { id: 'far', assetRef: '/assets/maps/white_palace_far_bg.webp' },
      { id: 'mid', assetRef: '/assets/maps/white_palace_mid_bg_loop.webp' },
    ],
    terrainTilesetAssetRef: '/assets/tiles/white_palace_platform_tiles.webp',
    fallback: true,
  },
  'cerulean-depths': {
    backgroundLayers: [
      { id: 'sky', assetRef: '/assets/maps/white_palace_sky.webp' },
      { id: 'far', assetRef: '/assets/maps/white_palace_far_bg.webp' },
      { id: 'mid', assetRef: '/assets/maps/white_palace_mid_bg_loop.webp' },
    ],
    terrainTilesetAssetRef: '/assets/tiles/white_palace_platform_tiles.webp',
    fallback: true,
  },
  'frostveil-peaks': {
    backgroundLayers: [
      { id: 'sky', assetRef: '/assets/maps/white_palace_sky.webp' },
      { id: 'far', assetRef: '/assets/maps/white_palace_far_bg.webp' },
      { id: 'mid', assetRef: '/assets/maps/white_palace_mid_bg_loop.webp' },
    ],
    terrainTilesetAssetRef: '/assets/tiles/white_palace_platform_tiles.webp',
    fallback: true,
  },
  'emberfall-caldera': {
    backgroundLayers: [
      { id: 'sky', assetRef: '/assets/maps/white_palace_sky.webp' },
      { id: 'far', assetRef: '/assets/maps/white_palace_far_bg.webp' },
      { id: 'mid', assetRef: '/assets/maps/white_palace_mid_bg_loop.webp' },
    ],
    terrainTilesetAssetRef: '/assets/tiles/white_palace_platform_tiles.webp',
    fallback: true,
  },
  'abyssal-hollow': {
    backgroundLayers: [
      { id: 'sky', assetRef: '/assets/maps/white_palace_sky.webp' },
      { id: 'far', assetRef: '/assets/maps/white_palace_far_bg.webp' },
      { id: 'mid', assetRef: '/assets/maps/white_palace_mid_bg_loop.webp' },
    ],
    terrainTilesetAssetRef: '/assets/tiles/white_palace_platform_tiles.webp',
    fallback: true,
  },
}

export function toGameplayTheme(theme: GameplayStageSourceTheme): GameplayTheme {
  return theme
}
```

Before adding this file, extend `GameplayTheme` in `src/domain/gameplay/gameplayMapTypes.ts`:

```ts
export type GameplayTheme =
  | 'white-palace'
  | 'emerald-sanctuary'
  | 'cerulean-depths'
  | 'frostveil-peaks'
  | 'emberfall-caldera'
  | 'abyssal-hollow'
```

- [ ] **Step 4: Add the minimal converter**

Create `src/domain/gameplay/gameplayStageMapConverter.ts`:

```ts
import type {
  GameplayEnemySpawn,
  GameplayHazardSpawn,
  GameplayStageMap,
} from './gameplayMapTypes'
import {
  toGameplayTheme,
  type GameplayStageConversionDiagnostic,
  type GameplayStageSource,
  type GameplayStageSourceTheme,
  type GameplayThemeAssets,
} from './gameplayStageSource'

export type GameplayStageMapConversionResult = {
  map: GameplayStageMap
  diagnostics: readonly GameplayStageConversionDiagnostic[]
}

const BACKGROUND_LAYER_PRESENTATION = {
  sky: { width: 1920, height: 1080, depth: -30, scrollFactor: 0, parallaxFactor: 0 },
  far: { width: 1920, height: 1080, depth: -20, scrollFactor: 0, parallaxFactor: 0.08 },
  mid: { width: 1920, height: 1080, depth: -10, scrollFactor: 0, parallaxFactor: 0.18 },
} as const

export function convertGameplayStageSource(
  source: GameplayStageSource,
  themeAssets: Record<GameplayStageSourceTheme, GameplayThemeAssets>,
): GameplayStageMapConversionResult {
  const theme = source.theme ?? 'white-palace'
  const assets = themeAssets[theme]
  const diagnostics: GameplayStageConversionDiagnostic[] = []

  if (assets.fallback) {
    diagnostics.push({
      stageId: source.id,
      code: 'theme-asset-fallback',
      sourceId: theme,
      message: `Stage ${source.id} uses fallback gameplay assets for theme ${theme}.`,
    })
  }

  for (const movingPlatform of source.movingPlatforms ?? []) {
    diagnostics.push({
      stageId: source.id,
      code: 'unsupported-moving-platform',
      sourceId: movingPlatform.id,
      message: `Stage ${source.id} has unsupported moving platform ${movingPlatform.id}.`,
    })
  }

  for (const gravityZone of source.gravityZones ?? []) {
    diagnostics.push({
      stageId: source.id,
      code: 'unsupported-gravity-zone',
      sourceId: gravityZone.id,
      message: `Stage ${source.id} has unsupported gravity zone ${gravityZone.id}.`,
    })
  }

  for (const surfaceZone of source.surfaceZones ?? []) {
    diagnostics.push({
      stageId: source.id,
      code: 'unsupported-surface-zone',
      sourceId: surfaceZone.id,
      message: `Stage ${source.id} has unsupported surface zone ${surfaceZone.id}.`,
    })
  }

  return {
    map: {
      id: source.id,
      theme: toGameplayTheme(theme),
      world: { ...source.world },
      rankTargets: { ...source.rankTargets },
      backgroundLayers: assets.backgroundLayers.map((layer) => ({
        id: layer.id,
        assetRef: layer.assetRef,
        ...BACKGROUND_LAYER_PRESENTATION[layer.id],
      })),
      player: {
        actorId: 'player',
        spawn: {
          x: source.playerSpawn.x,
          surfaceY: source.playerSpawn.surfaceY,
        },
      },
      enemies: source.enemies.map(convertEnemy),
      coins: source.coins.map((coin, index) => ({
        id: `${source.id}-coin-${String(index + 1).padStart(3, '0')}`,
        x: coin.x,
        y: coin.y,
      })),
      hazards: convertHazards(source, diagnostics),
      checkpoints: source.checkpoints.map((checkpoint) => ({ ...checkpoint })),
      goal: { ...source.goal },
      terrain: {
        tilesetAssetRef: assets.terrainTilesetAssetRef,
        solidTileIndexes: [0, 1, 2],
        platforms: source.platforms.map((platform) => ({ ...platform })),
      },
    },
    diagnostics,
  }
}

function convertEnemy(enemy: GameplayStageSource['enemies'][number]): GameplayEnemySpawn {
  if (enemy.type === 'azure-core') {
    return {
      id: enemy.id,
      type: 'azure-core',
      x: enemy.x,
      y: enemy.y,
      patrolMinX: enemy.patrolMinX,
      patrolMaxX: enemy.patrolMaxX,
    }
  }

  return {
    id: enemy.id,
    type: 'armor-guard',
    x: enemy.x,
    surfaceY: enemy.surfaceY,
    patrolMinX: enemy.patrolMinX,
    patrolMaxX: enemy.patrolMaxX,
  }
}

function convertHazards(
  source: GameplayStageSource,
  diagnostics: GameplayStageConversionDiagnostic[],
): GameplayHazardSpawn[] {
  return (source.hazards ?? []).flatMap((hazard) => {
    if (hazard.type === 'spikes') {
      return [{ ...hazard }]
    }

    diagnostics.push({
      stageId: source.id,
      code: 'unsupported-hazard',
      sourceId: hazard.id,
      message: `Stage ${source.id} has unsupported hazard ${hazard.id} (${hazard.type}).`,
    })

    return []
  })
}
```

- [ ] **Step 5: Run converter tests and verify GREEN**

Run:

```bash
npm run test -- src/domain/gameplay/gameplayStageMapConverter.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit the converter slice**

Run:

```bash
git add src/domain/gameplay/gameplayMapTypes.ts src/domain/gameplay/gameplayStageSource.ts src/domain/gameplay/gameplayStageMapConverter.ts src/domain/gameplay/gameplayStageMapConverter.test.ts
git commit -m "feat: add gameplay stage source converter"
```

Expected: commit includes only converter types, converter tests, and the `GameplayTheme` extension.

---

### Task 2: Rebuilt Stage Source Catalog

**Files:**
- Create: `src/domain/gameplay/gameplayStageSources.ts`
- Modify: `src/domain/gameplay/gameplayStageMaps.ts`
- Modify: `src/domain/gameplay/gameplayStageMaps.test.ts`

- [ ] **Step 1: Write failing catalog tests for 36 converted maps**

Modify `src/domain/gameplay/gameplayStageMaps.test.ts`.

Replace the test named:

```ts
it('does not return a map for stages outside this slice', () => {
  expect(getGameplayStageMap('1-2')).toBeUndefined()
})
```

with:

```ts
  it('returns converted gameplay maps for all 36 normal stages', () => {
    expect(gameplayStageMaps.order).toHaveLength(36)

    for (const stageId of gameplayStageMaps.order) {
      expect(getGameplayStageMap(stageId)?.id).toBe(stageId)
    }
  })
```

Add these imports at the top:

```ts
import { stages } from '../data/stages/stageCatalog'
import { gameplayStageConversionDiagnostics } from './gameplayStageMaps'
```

Add these tests near the other catalog tests:

```ts
  it('keeps converted gameplay map order aligned with the stage catalog', () => {
    expect(gameplayStageMaps.order).toEqual(stages.order)
  })

  it('keeps every converted gameplay stage platform grid inside its world bounds', () => {
    for (const stageId of gameplayStageMaps.order) {
      const stage = getGameplayStageMap(stageId)
      expect(stage).toBeDefined()
      if (!stage) return

      const columns = getTileColumnCount({
        worldWidth: stage.world.width,
        tileSize: stage.world.tileSize,
      })
      const rows = getTileRowCount({
        worldHeight: stage.world.height,
        tileSize: stage.world.tileSize,
      })

      expect(validatePlatformBounds({ columns, rows, platforms: stage.terrain.platforms })).toEqual({
        valid: true,
      })
    }
  })

  it('keeps converted gameplay ids unique within each stage', () => {
    for (const stageId of gameplayStageMaps.order) {
      const stage = getGameplayStageMap(stageId)
      expect(stage).toBeDefined()
      if (!stage) return

      const enemyIds = stage.enemies.map((enemy) => enemy.id)
      const coinIds = stage.coins.map((coin) => coin.id)
      const hazardIds = stage.hazards.map((hazard) => hazard.id)
      const checkpointIds = stage.checkpoints.map((checkpoint) => checkpoint.id)

      expect(new Set(enemyIds).size).toBe(enemyIds.length)
      expect(new Set(coinIds).size).toBe(coinIds.length)
      expect(new Set(hazardIds).size).toBe(hazardIds.length)
      expect(new Set(checkpointIds).size).toBe(checkpointIds.length)
    }
  })

  it('exposes diagnostics for unsupported mechanics in converted source stages', () => {
    expect(gameplayStageConversionDiagnostics.some((diagnostic) =>
      diagnostic.stageId === '2-1' && diagnostic.code === 'unsupported-moving-platform',
    )).toBe(true)
    expect(gameplayStageConversionDiagnostics.some((diagnostic) =>
      diagnostic.stageId === '4-4' && diagnostic.code === 'unsupported-surface-zone',
    )).toBe(true)
  })

  it('keeps converted gameplay stage asset refs in rebuilt public assets', () => {
    for (const stageId of gameplayStageMaps.order) {
      const stage = getGameplayStageMap(stageId)
      expect(stage).toBeDefined()
      if (!stage) return

      const assetRefs = [
        ...stage.backgroundLayers.map((layer) => layer.assetRef),
        stage.terrain.tilesetAssetRef,
      ]

      expect(assetRefs.every((assetRef) => assetRef.startsWith('/assets/'))).toBe(true)
      expect(assetRefs.every((assetRef) => !assetRef.includes('__prototype__'))).toBe(true)
    }
  })
```

- [ ] **Step 2: Run catalog tests and verify RED**

Run:

```bash
npm run test -- src/domain/gameplay/gameplayStageMaps.test.ts
```

Expected: FAIL because only `1-1` is in `gameplayStageMaps.order`, `1-2` is undefined, and `gameplayStageConversionDiagnostics` does not exist.

- [ ] **Step 3: Create rebuilt stage source catalog data**

Create `src/domain/gameplay/gameplayStageSources.ts`.

Generate the file from prototype reference JSON with a one-time local script. The committed output must be static TypeScript data inside the rebuilt project; the runtime must not import from `__prototype__/`.

Run:

```bash
node --input-type=module <<'NODE'
import { readFileSync, writeFileSync } from 'node:fs'

const stageIds = [
  '1-1', '1-2', '1-3', '1-4', '1-5', '1-6',
  '2-1', '2-2', '2-3', '2-4', '2-5', '2-6',
  '3-1', '3-2', '3-3', '3-4', '3-5', '3-6',
  '4-1', '4-2', '4-3', '4-4', '4-5', '4-6',
  '5-1', '5-2', '5-3', '5-4', '5-5', '5-6',
  '6-1', '6-2', '6-3', '6-4', '6-5', '6-6',
]

const retainedKeys = [
  'id',
  'theme',
  'rankTargets',
  'world',
  'playerSpawn',
  'platforms',
  'movingPlatforms',
  'hazards',
  'gravityZones',
  'surfaceZones',
  'coins',
  'enemies',
  'checkpoints',
  'goal',
]

function pickStageSource(stage) {
  const source = {}
  for (const key of retainedKeys) {
    if (stage[key] !== undefined) {
      source[key] = stage[key]
    }
  }
  return source
}

const entries = Object.fromEntries(
  stageIds.map((stageId) => {
    const stage = JSON.parse(readFileSync(`__prototype__/src/game/stages/${stageId}.json`, 'utf8'))
    return [stageId, pickStageSource(stage)]
  }),
)

const body = `import type { StageId } from '../data/worlds/worldTypes'
import type { GameplayStageSource } from './gameplayStageSource'

export const gameplayStageSources = {
  order: ${JSON.stringify(stageIds, null, 2)} as const satisfies readonly StageId[],
  items: ${JSON.stringify(entries, null, 2)} satisfies Record<StageId, GameplayStageSource>,
}
`

writeFileSync('src/domain/gameplay/gameplayStageSources.ts', body)
NODE
```

After generation, inspect the file header and a representative stage:

```bash
sed -n '1,80p' src/domain/gameplay/gameplayStageSources.ts
rg -n "\"2-1\"|movingPlatforms|surfaceZones|gravityZones|lava" src/domain/gameplay/gameplayStageSources.ts
```

Expected:

- The file imports only rebuilt-project types.
- `items` contains every stage id from `1-1` through `6-6`.
- Optional unsupported fields such as `movingPlatforms`, `surfaceZones`, `gravityZones`, or `lava` remain present when the source stage has them.
- The file contains no `__prototype__` path.

The generated file should export this shape:

```ts
import type { StageId } from '../data/worlds/worldTypes'
import type { GameplayStageSource } from './gameplayStageSource'

export const gameplayStageSources = {
  order: [
    '1-1', '1-2', '1-3', '1-4', '1-5', '1-6',
    '2-1', '2-2', '2-3', '2-4', '2-5', '2-6',
    '3-1', '3-2', '3-3', '3-4', '3-5', '3-6',
    '4-1', '4-2', '4-3', '4-4', '4-5', '4-6',
    '5-1', '5-2', '5-3', '5-4', '5-5', '5-6',
    '6-1', '6-2', '6-3', '6-4', '6-5', '6-6',
  ] as const satisfies readonly StageId[],
  items: {
    '1-1': {
      id: '1-1',
      rankTargets: {
        sTime: 30,
        aTime: 42,
        bTime: 58,
        cTime: 78,
      },
      world: {
        width: 9600,
        height: 1080,
        tileSize: 64,
      },
      playerSpawn: {
        x: 256,
        surfaceY: 512,
      },
      platforms: [
        { col: 2, row: 8, width: 12, height: 1 },
        { col: 16, row: 8, width: 5, height: 1 },
      ],
      coins: [
        { x: 420, y: 456 },
        { x: 560, y: 456 },
      ],
      enemies: [
        {
          id: 'first-guard',
          x: 720,
          surfaceY: 512,
          patrolMinX: 608,
          patrolMaxX: 832,
        },
      ],
      checkpoints: [
        {
          id: 'combat-gate',
          x: 2540,
          surfaceY: 512,
          spawnX: 2600,
          spawnSurfaceY: 512,
        },
      ],
      goal: {
        x: 9340,
        surfaceY: 512,
      },
    },
    '1-2': {
      id: '1-2',
      rankTargets: {
        sTime: 34,
        aTime: 48,
        bTime: 66,
        cTime: 90,
      },
      world: {
        width: 10240,
        height: 1080,
        tileSize: 64,
      },
      playerSpawn: {
        x: 256,
        surfaceY: 512,
      },
      platforms: [
        { col: 2, row: 8, width: 10, height: 1 },
      ],
      coins: [
        { x: 420, y: 456 },
      ],
      enemies: [],
      checkpoints: [],
      goal: {
        x: 9980,
        surfaceY: 512,
      },
    },
  } satisfies Record<StageId, GameplayStageSource>,
}
```

The script above is the required generation path for the initial catalog file. The committed generated file must include all 36 stage entries and preserve these fields for every stage:

```ts
{
  id,
  theme,
  rankTargets,
  world,
  playerSpawn,
  platforms,
  movingPlatforms,
  hazards,
  gravityZones,
  surfaceZones,
  coins,
  enemies,
  checkpoints,
  goal,
}
```

When a prototype stage omits an optional field, omit it in the rebuilt source data rather than writing an empty array. When a prototype stage omits `theme`, omit it so the converter default is tested through `1-1`.

Do not include `subtitle`, `objective`, or `sections`; those are not needed by the gameplay renderer in this slice.

Use the generated static TypeScript file as the committed rebuilt-project source catalog. Do not keep the generation script in runtime code, and do not import from `__prototype__/`.

- [ ] **Step 4: Build gameplay maps from source conversion**

Replace `src/domain/gameplay/gameplayStageMaps.ts` with converter-backed catalog logic:

```ts
import type { StageId } from '../data/worlds/worldTypes'
import type { GameplayStageMap } from './gameplayMapTypes'
import { convertGameplayStageSource } from './gameplayStageMapConverter'
import {
  defaultGameplayThemeAssets,
  type GameplayStageConversionDiagnostic,
} from './gameplayStageSource'
import { gameplayStageSources } from './gameplayStageSources'

export type GameplayStageMapCatalog = {
  order: readonly StageId[]
  items: Record<StageId, GameplayStageMap>
}

const conversionEntries = gameplayStageSources.order.map((stageId) => {
  const source = gameplayStageSources.items[stageId]

  return [stageId, convertGameplayStageSource(source, defaultGameplayThemeAssets)] as const
})

export const gameplayStageConversionDiagnostics: readonly GameplayStageConversionDiagnostic[] =
  conversionEntries.flatMap(([, result]) => result.diagnostics)

export const gameplayStageMaps: GameplayStageMapCatalog = {
  order: gameplayStageSources.order,
  items: Object.fromEntries(
    conversionEntries.map(([stageId, result]) => [stageId, result.map]),
  ) as Record<StageId, GameplayStageMap>,
}

export function getGameplayStageMap(stageId: StageId): GameplayStageMap | undefined {
  return gameplayStageMaps.items[stageId]
}
```

- [ ] **Step 5: Update stale `1-1` expectations to prototype source values**

In `src/domain/gameplay/gameplayStageMaps.test.ts`, update old hand-authored expectations that conflict with converted prototype source data.

Expected `1-1` values after conversion:

```ts
rankTargets: {
  sTime: 30,
  aTime: 42,
  bTime: 58,
  cTime: 78,
}
```

Expected first two `1-1` coins after conversion:

```ts
[
  { id: '1-1-coin-001', x: 420, y: 456 },
  { id: '1-1-coin-002', x: 560, y: 456 },
]
```

The old test that asserted a tiny five-coin hand-authored list should be rewritten to assert:

```ts
expect(stage.coins).toHaveLength(25)
expect(stage.coins.slice(0, 2)).toEqual([
  { id: '1-1-coin-001', x: 420, y: 456 },
  { id: '1-1-coin-002', x: 560, y: 456 },
])
expect(stage.coins.at(-1)).toEqual({ id: '1-1-coin-025', x: 9240, y: 456 })
```

Keep tests that assert asset refs, bounds, uniqueness, and supported actor definitions.

- [ ] **Step 6: Run catalog tests and verify GREEN**

Run:

```bash
npm run test -- src/domain/gameplay/gameplayStageMaps.test.ts
```

Expected: PASS.

- [ ] **Step 7: Run converter tests again**

Run:

```bash
npm run test -- src/domain/gameplay/gameplayStageMapConverter.test.ts
```

Expected: PASS.

- [ ] **Step 8: Confirm prototype boundary**

Run:

```bash
rg -n "__prototype__" src/domain/gameplay/gameplayStageSources.ts src/domain/gameplay/gameplayStageMaps.ts
```

Expected: no output.

- [ ] **Step 9: Commit the source catalog slice**

Run:

```bash
git add src/domain/gameplay/gameplayStageSources.ts src/domain/gameplay/gameplayStageMaps.ts src/domain/gameplay/gameplayStageMaps.test.ts
git commit -m "feat: convert gameplay stage source catalog"
```

Expected: commit contains stage source data, converted map catalog, and catalog tests.

---

### Task 3: Renderer Contract For Converted Stages

**Files:**
- Modify: `src/ui/gameplay/createGameplayRenderer.test.ts`

- [ ] **Step 1: Write failing renderer contract tests for representative converted maps**

In `src/ui/gameplay/createGameplayRenderer.test.ts`, add this test inside `describe('createGameplayRendererConfig', () => {` near the existing scene creation tests:

```ts
  it.each(['1-1', '2-1', '4-4'] as const)(
    'creates a renderer scene from converted gameplay stage %s',
    (stageId) => {
      const stage = getGameplayStageMap(stageId)
      expect(stage).toBeDefined()
      if (!stage) return

      const runtime = createSceneRuntime({ stage })

      expect(() => runtime.scene.create()).not.toThrow()
      expect(runtime.imageCalls).toEqual(
        expect.arrayContaining(
          stage.backgroundLayers.map((layer) => ({
            key: layer.id,
            assetRef: layer.assetRef,
          })),
        ),
      )
      expect(runtime.imageCalls).toEqual(
        expect.arrayContaining([
          { key: 'terrain-tiles', assetRef: stage.terrain.tilesetAssetRef },
        ]),
      )
      expect(runtime.hudUpdates[0]).toMatchObject({
        coinTarget: stage.coins.length,
        enemyTarget: stage.enemies.length,
        checkpointTarget: stage.checkpoints.length,
      })
    },
  )
```

- [ ] **Step 2: Run the renderer contract test and record the current result**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts -t "converted gameplay stage"
```

Expected after Task 2 is complete: PASS because `2-1` and `4-4` now have converted maps. If this fails, use the failure output to decide whether the renderer fake has an outdated assumption or Task 2 emitted unsupported objects into `GameplayStageMap`.

- [ ] **Step 3: Fix renderer test fake if non-white-palace converted maps expose missing assumptions**

If the test fails because the fake runtime cannot handle valid converted map data, update only the fake runtime in `src/ui/gameplay/createGameplayRenderer.test.ts`.

Valid minimal fake adjustments:

```ts
// Keep accepting any background layer id and assetRef in imageCalls.
// Keep terrain tiles using key 'terrain-tiles'.
// Do not add rendering behavior for unsupported mechanics.
```

If the renderer itself throws because converted maps include unsupported runtime objects, return to Task 2 and ensure unsupported objects are not emitted into `GameplayStageMap`.

- [ ] **Step 4: Run focused renderer contract tests and verify GREEN**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts -t "converted gameplay stage"
```

Expected: PASS.

- [ ] **Step 5: Run full renderer test file**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit the renderer contract slice**

Run:

```bash
git add src/ui/gameplay/createGameplayRenderer.test.ts
git commit -m "test: cover converted gameplay stage rendering contract"
```

Expected: commit contains only renderer contract tests.

---

### Task 4: Full Verification And Completion Review

**Files:**
- Verify current working tree only.

- [ ] **Step 1: Run all tests**

Run:

```bash
npm run test
```

Expected: all Vitest files pass.

- [ ] **Step 2: Run Svelte and TypeScript checks**

Run:

```bash
npm run check
```

Expected: no TypeScript or Svelte diagnostics.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: build succeeds. Existing Vite chunk-size warning is acceptable if unchanged.

- [ ] **Step 4: Run whitespace sanity check**

Run:

```bash
git diff --check
```

Expected: no output.

- [ ] **Step 5: Confirm prototype boundary**

Run:

```bash
rg -n "__prototype__" src public package.json
```

Expected: no runtime imports from `__prototype__`. Existing test assertions that intentionally check asset refs do not contain `__prototype__` are acceptable after inspection.

- [ ] **Step 6: Review final feature diff**

Run:

```bash
git status --short
git diff --stat
git diff -- src/domain/gameplay/gameplayStageSource.ts src/domain/gameplay/gameplayStageMapConverter.ts src/domain/gameplay/gameplayStageSources.ts src/domain/gameplay/gameplayStageMaps.ts src/domain/gameplay/gameplayStageMaps.test.ts src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected:

- Converter is pure domain code.
- `gameplayStageMaps.order` has 36 stages.
- `getGameplayStageMap()` returns maps for all normal stage ids.
- Unsupported mechanics are diagnostics, not silently dropped.
- Renderer contract covers representative converted stages.

- [ ] **Step 7: Commit final verification adjustments if any were needed**

If Step 6 shows uncommitted verification-only fixes, run:

```bash
git add src/domain/gameplay/gameplayStageSource.ts src/domain/gameplay/gameplayStageMapConverter.ts src/domain/gameplay/gameplayStageSources.ts src/domain/gameplay/gameplayStageMaps.ts src/domain/gameplay/gameplayStageMaps.test.ts src/ui/gameplay/createGameplayRenderer.test.ts
git commit -m "chore: finalize gameplay stage source conversion"
```

Expected: no commit is created if the working tree is already clean.
