# Gameplay Map Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first gameplay rendering slice: Stage Select confirmation opens a Phaser-backed gameplay screen that renders White Palace background layers and platform floor tiles from rebuild-owned assets and stage data.

**Architecture:** Keep the domain layer pure and deterministic: gameplay map types, terrain tile rules, terrain grid generation, and stage-map catalog validation live under `src/domain/gameplay/`. Svelte owns the reactive lifecycle and mounts a thin Phaser adapter, while Phaser owns only canvas, asset loading, tilemap, background drawing, and teardown side effects.

**Tech Stack:** TypeScript, Vitest, Svelte 5, Vite, Phaser 3, root `public/assets/` runtime assets.

---

## File Structure

- Create `src/domain/gameplay/gameplayMapTypes.ts`: pure gameplay map data contracts.
- Create `src/domain/gameplay/terrain.ts`: pure terrain grid, tile-index, and platform-bounds rules.
- Create `src/domain/gameplay/terrain.test.ts`: TDD tests for terrain rules.
- Create `src/domain/gameplay/gameplayStageMaps.ts`: rebuild-owned gameplay map catalog, beginning with stage `1-1`.
- Create `src/domain/gameplay/gameplayStageMaps.test.ts`: TDD tests for catalog asset refs, layer order, and terrain validity.
- Modify `src/domain/app/appFlow.ts`: add `GameplayScreen` and make `confirmSelectedStage` enter gameplay.
- Modify `src/domain/app/appFlow.test.ts`: update Stage Select confirmation expectations and add non-stage-select preservation test.
- Modify `src/App.svelte`: render `GameplayScreen` for `appState.screen.type === 'gameplay'`.
- Create `src/ui/gameplay/GameplayScreen.svelte`: Svelte lifecycle owner for Phaser.
- Create `src/ui/gameplay/createGameplayRenderer.ts`: Phaser adapter factory and scene.
- Create `src/ui/gameplay/createGameplayRenderer.test.ts`: lightweight adapter contract tests that avoid browser/WebGL.
- Modify `package.json` and `package-lock.json`: add Phaser.
- Copy assets:
  - `__prototype__/public/assets/maps/white_palace_far_bg.webp` to `public/assets/maps/white_palace_far_bg.webp`
  - `__prototype__/public/assets/maps/white_palace_mid_bg_loop.webp` to `public/assets/maps/white_palace_mid_bg_loop.webp`
  - `__prototype__/public/assets/tiles/white_palace_platform_tiles.webp` to `public/assets/tiles/white_palace_platform_tiles.webp`

## Task 1: Dependency And Asset Boundary

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `public/assets/maps/white_palace_far_bg.webp`
- Create: `public/assets/tiles/white_palace_platform_tiles.webp`
- Existing/copy target: `public/assets/maps/white_palace_mid_bg_loop.webp`

- [ ] **Step 1: Add Phaser dependency**

Run:

```bash
npm install phaser
```

Expected: `package.json` gains a `phaser` dependency and `package-lock.json` records the installed package.

- [ ] **Step 2: Copy White Palace gameplay assets into root public assets**

Run:

```bash
mkdir -p public/assets/maps public/assets/tiles
cp __prototype__/public/assets/maps/white_palace_far_bg.webp public/assets/maps/white_palace_far_bg.webp
cp __prototype__/public/assets/maps/white_palace_mid_bg_loop.webp public/assets/maps/white_palace_mid_bg_loop.webp
cp __prototype__/public/assets/tiles/white_palace_platform_tiles.webp public/assets/tiles/white_palace_platform_tiles.webp
```

Expected: all three target files exist under root `public/assets/`. The rebuild still has no runtime references to `__prototype__`.

- [ ] **Step 3: Verify copied assets are present**

Run:

```bash
test -f public/assets/maps/white_palace_far_bg.webp
test -f public/assets/maps/white_palace_mid_bg_loop.webp
test -f public/assets/tiles/white_palace_platform_tiles.webp
```

Expected: all three commands exit with status `0`.

- [ ] **Step 4: Commit dependency and asset boundary**

```bash
git add package.json package-lock.json public/assets/maps/white_palace_far_bg.webp public/assets/maps/white_palace_mid_bg_loop.webp public/assets/tiles/white_palace_platform_tiles.webp
git commit -m "feat: add gameplay map rendering assets"
```

## Task 2: Pure Terrain Rules

**Files:**
- Create: `src/domain/gameplay/gameplayMapTypes.ts`
- Create: `src/domain/gameplay/terrain.ts`
- Create: `src/domain/gameplay/terrain.test.ts`

- [ ] **Step 1: Write the failing terrain rules tests**

Create `src/domain/gameplay/terrain.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  buildTerrainTileGrid,
  getPlatformTileIndex,
  getTileColumnCount,
  getTileRowCount,
  validatePlatformBounds,
} from './terrain'
import type { PlatformRect } from './gameplayMapTypes'

describe('getTileColumnCount', () => {
  it('divides world width by tile size', () => {
    expect(getTileColumnCount({ worldWidth: 9600, tileSize: 64 })).toBe(150)
  })
})

describe('getTileRowCount', () => {
  it('rounds world rows up to cover partial tiles', () => {
    expect(getTileRowCount({ worldHeight: 1080, tileSize: 64 })).toBe(17)
  })
})

describe('getPlatformTileIndex', () => {
  it('uses middle tile for a single-tile platform', () => {
    expect(getPlatformTileIndex({ index: 0, width: 1 })).toBe(1)
  })

  it('uses left, middle, and right tile indexes for wider platforms', () => {
    expect(getPlatformTileIndex({ index: 0, width: 4 })).toBe(0)
    expect(getPlatformTileIndex({ index: 1, width: 4 })).toBe(1)
    expect(getPlatformTileIndex({ index: 2, width: 4 })).toBe(1)
    expect(getPlatformTileIndex({ index: 3, width: 4 })).toBe(2)
  })
})

describe('buildTerrainTileGrid', () => {
  it('creates an empty grid and writes platform tile indexes into cells', () => {
    const platforms: PlatformRect[] = [
      { col: 1, row: 1, width: 4, height: 1 },
      { col: 0, row: 3, width: 1, height: 1 },
    ]

    expect(buildTerrainTileGrid({ columns: 6, rows: 4, platforms })).toEqual([
      [-1, -1, -1, -1, -1, -1],
      [-1, 0, 1, 1, 2, -1],
      [-1, -1, -1, -1, -1, -1],
      [1, -1, -1, -1, -1, -1],
    ])
  })
})

describe('validatePlatformBounds', () => {
  it('accepts platforms inside the tile grid', () => {
    const result = validatePlatformBounds({
      columns: 6,
      rows: 4,
      platforms: [{ col: 1, row: 2, width: 4, height: 1 }],
    })

    expect(result).toEqual({ valid: true })
  })

  it('rejects platforms that exceed the tile grid columns', () => {
    const result = validatePlatformBounds({
      columns: 6,
      rows: 4,
      platforms: [{ col: 4, row: 2, width: 3, height: 1 }],
    })

    expect(result).toEqual({
      valid: false,
      reason: 'Platform at index 0 exceeds terrain columns.',
    })
  })

  it('rejects platforms that exceed the tile grid rows', () => {
    const result = validatePlatformBounds({
      columns: 6,
      rows: 4,
      platforms: [{ col: 2, row: 3, width: 2, height: 2 }],
    })

    expect(result).toEqual({
      valid: false,
      reason: 'Platform at index 0 exceeds terrain rows.',
    })
  })
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm run test -- src/domain/gameplay/terrain.test.ts
```

Expected: FAIL because `src/domain/gameplay/terrain.ts` and `src/domain/gameplay/gameplayMapTypes.ts` do not exist.

- [ ] **Step 3: Create gameplay map types**

Create `src/domain/gameplay/gameplayMapTypes.ts`:

```ts
import type { StageId } from '../data/worlds/worldTypes'

export type GameplayTheme = 'white-palace'

export type GameplayStageMap = {
  id: StageId
  theme: GameplayTheme
  world: {
    width: number
    height: number
    tileSize: number
  }
  backgroundLayers: readonly BackgroundLayer[]
  terrain: TerrainDefinition
}

export type BackgroundLayer = {
  id: string
  assetRef: string
  width: number
  height: number
  depth: number
  scrollFactor: number
  parallaxFactor: number
}

export type TerrainDefinition = {
  tilesetAssetRef: string
  solidTileIndexes: readonly number[]
  platforms: readonly PlatformRect[]
}

export type PlatformRect = {
  col: number
  row: number
  width: number
  height: number
}
```

- [ ] **Step 4: Implement minimal pure terrain rules**

Create `src/domain/gameplay/terrain.ts`:

```ts
import type { PlatformRect } from './gameplayMapTypes'

export type PlatformBoundsValidation =
  | { valid: true }
  | { valid: false; reason: string }

export function getTileColumnCount(input: { worldWidth: number; tileSize: number }): number {
  return input.worldWidth / input.tileSize
}

export function getTileRowCount(input: { worldHeight: number; tileSize: number }): number {
  return Math.ceil(input.worldHeight / input.tileSize)
}

export function getPlatformTileIndex(input: { index: number; width: number }): number {
  if (input.width === 1) return 1
  if (input.index === 0) return 0
  if (input.index === input.width - 1) return 2
  return 1
}

export function validatePlatformBounds(input: {
  columns: number
  rows: number
  platforms: readonly PlatformRect[]
}): PlatformBoundsValidation {
  for (let index = 0; index < input.platforms.length; index += 1) {
    const platform = input.platforms[index]
    if (platform.col < 0 || platform.col + platform.width > input.columns) {
      return { valid: false, reason: `Platform at index ${index} exceeds terrain columns.` }
    }
    if (platform.row < 0 || platform.row + platform.height > input.rows) {
      return { valid: false, reason: `Platform at index ${index} exceeds terrain rows.` }
    }
  }

  return { valid: true }
}

export function buildTerrainTileGrid(input: {
  columns: number
  rows: number
  platforms: readonly PlatformRect[]
}): number[][] {
  const grid = Array.from({ length: input.rows }, () => Array.from({ length: input.columns }, () => -1))

  for (const platform of input.platforms) {
    for (let y = 0; y < platform.height; y += 1) {
      for (let x = 0; x < platform.width; x += 1) {
        grid[platform.row + y][platform.col + x] = getPlatformTileIndex({
          index: x,
          width: platform.width,
        })
      }
    }
  }

  return grid
}
```

- [ ] **Step 5: Run the focused test and verify GREEN**

Run:

```bash
npm run test -- src/domain/gameplay/terrain.test.ts
```

Expected: PASS for `terrain.test.ts`.

- [ ] **Step 6: Commit pure terrain rules**

```bash
git add src/domain/gameplay/gameplayMapTypes.ts src/domain/gameplay/terrain.ts src/domain/gameplay/terrain.test.ts
git commit -m "feat: add gameplay terrain rules"
```

## Task 3: Gameplay Stage Map Catalog

**Files:**
- Create: `src/domain/gameplay/gameplayStageMaps.ts`
- Create: `src/domain/gameplay/gameplayStageMaps.test.ts`

- [ ] **Step 1: Write the failing gameplay stage map catalog tests**

Create `src/domain/gameplay/gameplayStageMaps.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getTileColumnCount, getTileRowCount, validatePlatformBounds } from './terrain'
import { gameplayStageMaps, getGameplayStageMap } from './gameplayStageMaps'

describe('gameplayStageMaps', () => {
  it('contains the first gameplay stage map', () => {
    expect(gameplayStageMaps.order).toContain('1-1')
    expect(getGameplayStageMap('1-1')?.id).toBe('1-1')
  })

  it('references only root public asset paths', () => {
    const stage = getGameplayStageMap('1-1')
    expect(stage).toBeDefined()
    if (!stage) return

    const assetRefs = [
      ...stage.backgroundLayers.map((layer) => layer.assetRef),
      stage.terrain.tilesetAssetRef,
    ]

    expect(assetRefs).toEqual([
      '/assets/maps/white_palace_sky.webp',
      '/assets/maps/white_palace_far_bg.webp',
      '/assets/maps/white_palace_mid_bg_loop.webp',
      '/assets/tiles/white_palace_platform_tiles.webp',
    ])
    expect(assetRefs.every((assetRef) => assetRef.startsWith('/assets/'))).toBe(true)
    expect(assetRefs.every((assetRef) => !assetRef.includes('__prototype__'))).toBe(true)
  })

  it('defines sky, far, and mid background layers in depth order', () => {
    const stage = getGameplayStageMap('1-1')
    expect(stage?.backgroundLayers.map((layer) => layer.id)).toEqual(['sky', 'far', 'mid'])
    expect(stage?.backgroundLayers.map((layer) => layer.depth)).toEqual([-30, -20, -10])
  })

  it('validates terrain platforms against the world grid', () => {
    const stage = getGameplayStageMap('1-1')
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
  })

  it('does not return a map for stages outside this slice', () => {
    expect(getGameplayStageMap('1-2')).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm run test -- src/domain/gameplay/gameplayStageMaps.test.ts
```

Expected: FAIL because `src/domain/gameplay/gameplayStageMaps.ts` does not exist.

- [ ] **Step 3: Implement the stage `1-1` gameplay map catalog**

Create `src/domain/gameplay/gameplayStageMaps.ts`:

```ts
import type { StageId } from '../data/worlds/worldTypes'
import type { GameplayStageMap } from './gameplayMapTypes'

export type GameplayStageMapCatalog = {
  order: readonly StageId[]
  items: Partial<Record<StageId, GameplayStageMap>>
}

const stageOneOne: GameplayStageMap = {
  id: '1-1',
  theme: 'white-palace',
  world: {
    width: 9600,
    height: 1080,
    tileSize: 64,
  },
  backgroundLayers: [
    {
      id: 'sky',
      assetRef: '/assets/maps/white_palace_sky.webp',
      width: 1920,
      height: 1080,
      depth: -30,
      scrollFactor: 0,
      parallaxFactor: 0,
    },
    {
      id: 'far',
      assetRef: '/assets/maps/white_palace_far_bg.webp',
      width: 1920,
      height: 1080,
      depth: -20,
      scrollFactor: 0,
      parallaxFactor: 0.08,
    },
    {
      id: 'mid',
      assetRef: '/assets/maps/white_palace_mid_bg_loop.webp',
      width: 1920,
      height: 1080,
      depth: -10,
      scrollFactor: 0,
      parallaxFactor: 0.18,
    },
  ],
  terrain: {
    tilesetAssetRef: '/assets/tiles/white_palace_platform_tiles.webp',
    solidTileIndexes: [0, 1, 2],
    platforms: [
      { col: 2, row: 8, width: 12, height: 1 },
      { col: 16, row: 8, width: 5, height: 1 },
      { col: 23, row: 7, width: 4, height: 1 },
      { col: 30, row: 8, width: 5, height: 1 },
      { col: 38, row: 8, width: 13, height: 1 },
      { col: 54, row: 7, width: 3, height: 1 },
      { col: 59, row: 6, width: 3, height: 1 },
      { col: 65, row: 8, width: 12, height: 1 },
      { col: 80, row: 7, width: 4, height: 1 },
      { col: 86, row: 6, width: 4, height: 1 },
      { col: 92, row: 5, width: 7, height: 1 },
      { col: 103, row: 6, width: 5, height: 1 },
      { col: 111, row: 8, width: 10, height: 1 },
      { col: 124, row: 7, width: 4, height: 1 },
      { col: 130, row: 6, width: 4, height: 1 },
      { col: 136, row: 8, width: 12, height: 1 },
    ],
  },
}

export const gameplayStageMaps: GameplayStageMapCatalog = {
  order: [stageOneOne.id],
  items: {
    [stageOneOne.id]: stageOneOne,
  },
}

export function getGameplayStageMap(stageId: StageId): GameplayStageMap | undefined {
  return gameplayStageMaps.items[stageId]
}
```

- [ ] **Step 4: Run the focused catalog test and verify GREEN**

Run:

```bash
npm run test -- src/domain/gameplay/gameplayStageMaps.test.ts
```

Expected: PASS for `gameplayStageMaps.test.ts`.

- [ ] **Step 5: Run all gameplay domain tests**

Run:

```bash
npm run test -- src/domain/gameplay
```

Expected: PASS for terrain and gameplay stage map tests.

- [ ] **Step 6: Commit gameplay stage map catalog**

```bash
git add src/domain/gameplay/gameplayStageMaps.ts src/domain/gameplay/gameplayStageMaps.test.ts
git commit -m "feat: add first gameplay stage map"
```

## Task 4: App Flow Into Gameplay

**Files:**
- Modify: `src/domain/app/appFlow.ts`
- Modify: `src/domain/app/appFlow.test.ts`

- [ ] **Step 1: Replace the Stage Select confirmation test and add preservation coverage**

Edit the `describe('confirmSelectedStage', ...)` block in `src/domain/app/appFlow.test.ts` to:

```ts
describe('confirmSelectedStage', () => {
  it('opens gameplay for the selected stage', () => {
    const state = {
      screen: { type: 'stage-select', selectedWorldIndex: 1, worldId: 'world02', selectedStageIndex: 4 },
    } as const

    expect(confirmSelectedStage(state)).toEqual({
      screen: { type: 'gameplay', stageId: '2-5' },
    })
  })

  it('does not open gameplay outside stage select', () => {
    const state = createInitialAppState()

    expect(confirmSelectedStage(state)).toBe(state)
  })
})
```

- [ ] **Step 2: Run the focused app-flow test and verify RED**

Run:

```bash
npm run test -- src/domain/app/appFlow.test.ts
```

Expected: FAIL because `confirmSelectedStage` still preserves the Stage Select state and `AppScreen` has no `gameplay` variant.

- [ ] **Step 3: Add gameplay screen type and selected-stage id calculation**

Modify `src/domain/app/appFlow.ts`:

```ts
import {
  moveDeleteConfirmSelection,
  moveSettingsSelection,
  openDeleteConfirm,
  type DeleteConfirmState,
} from '../settings/settings'
import type { StageId, WorldId } from '../data/worlds/worldTypes'
```

Add this type after `StageSelectScreen`:

```ts
export type GameplayScreen = {
  type: 'gameplay'
  stageId: StageId
}
```

Add `GameplayScreen` to `AppScreen`:

```ts
export type AppScreen =
  | { type: 'title-intro' }
  | TitleMenuScreen
  | WorldSelectScreen
  | StageSelectScreen
  | GameplayScreen
  | SettingsScreen
```

Add this helper near the stage constants:

```ts
function getStageIdForSelection(screen: StageSelectScreen): StageId {
  const worldNumber = screen.selectedWorldIndex + 1
  const stageNumber = screen.selectedStageIndex + 1
  return `${worldNumber}-${stageNumber}` as StageId
}
```

Replace `confirmSelectedStage` with:

```ts
export function confirmSelectedStage(state: AppState): AppState {
  if (state.screen.type !== 'stage-select') return state

  return {
    screen: { type: 'gameplay', stageId: getStageIdForSelection(state.screen) },
  }
}
```

- [ ] **Step 4: Run the focused app-flow test and verify GREEN**

Run:

```bash
npm run test -- src/domain/app/appFlow.test.ts
```

Expected: PASS for `appFlow.test.ts`.

- [ ] **Step 5: Commit gameplay route transition**

```bash
git add src/domain/app/appFlow.ts src/domain/app/appFlow.test.ts
git commit -m "feat: enter gameplay from stage select"
```

## Task 5: Phaser Adapter Contract And Svelte Mount

**Files:**
- Create: `src/ui/gameplay/createGameplayRenderer.ts`
- Create: `src/ui/gameplay/createGameplayRenderer.test.ts`
- Create: `src/ui/gameplay/GameplayScreen.svelte`
- Modify: `src/App.svelte`

- [ ] **Step 1: Write the failing adapter contract test**

Create `src/ui/gameplay/createGameplayRenderer.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'
import { getGameplayStageMap } from '../../domain/gameplay/gameplayStageMaps'
import { createGameplayRendererConfig } from './createGameplayRenderer'

vi.mock('phaser', () => {
  class Scene {
    constructor(public readonly key?: string) {}
  }

  return {
    default: {
      AUTO: 'AUTO',
      Scale: {
        FIT: 'FIT',
        CENTER_BOTH: 'CENTER_BOTH',
      },
      Scene,
      Game: class Game {
        constructor(public readonly config: unknown) {}
      },
    },
  }
})

describe('createGameplayRendererConfig', () => {
  it('creates a Phaser config for the provided parent and stage map', () => {
    const stage = getGameplayStageMap('1-1')
    expect(stage).toBeDefined()
    if (!stage) return

    const parent = {} as HTMLElement
    const config = createGameplayRendererConfig({ parent, stage })

    expect(config.parent).toBe(parent)
    expect(config.width).toBe(1280)
    expect(config.height).toBe(720)
    expect(config.backgroundColor).toBe('#05070d')
    expect(config.scene).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run the focused adapter test and verify RED**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: FAIL because `src/ui/gameplay/createGameplayRenderer.ts` does not exist.

- [ ] **Step 3: Implement the Phaser adapter factory and scene**

Create `src/ui/gameplay/createGameplayRenderer.ts`:

```ts
import Phaser from 'phaser'
import type { GameplayStageMap } from '../../domain/gameplay/gameplayMapTypes'
import {
  buildTerrainTileGrid,
  getTileColumnCount,
  getTileRowCount,
  validatePlatformBounds,
} from '../../domain/gameplay/terrain'

type GameplayRendererInput = {
  parent: HTMLElement
  stage: GameplayStageMap
}

type BackgroundRuntimeLayer = {
  sprite: Phaser.GameObjects.TileSprite
  parallaxFactor: number
}

class GameplayMapScene extends Phaser.Scene {
  private readonly stageMap: GameplayStageMap
  private backgroundLayers: BackgroundRuntimeLayer[] = []

  constructor(stage: GameplayStageMap) {
    super(`GameplayMapScene:${stage.id}`)
    this.stageMap = stage
  }

  preload(): void {
    for (const layer of this.stageMap.backgroundLayers) {
      this.load.image(layer.id, layer.assetRef)
    }
    this.load.image('terrain-tiles', this.stageMap.terrain.tilesetAssetRef)
  }

  create(): void {
    const columns = getTileColumnCount({
      worldWidth: this.stageMap.world.width,
      tileSize: this.stageMap.world.tileSize,
    })
    const rows = getTileRowCount({
      worldHeight: this.stageMap.world.height,
      tileSize: this.stageMap.world.tileSize,
    })
    const validation = validatePlatformBounds({
      columns,
      rows,
      platforms: this.stageMap.terrain.platforms,
    })

    if (!validation.valid) {
      throw new Error(validation.reason)
    }

    this.physics.world.setBounds(0, 0, this.stageMap.world.width, this.stageMap.world.height)
    this.cameras.main.setBounds(0, 0, this.stageMap.world.width, this.stageMap.world.height)

    this.createBackgroundLayers()
    this.createTerrainLayer(columns, rows)
  }

  update(): void {
    for (const layer of this.backgroundLayers) {
      layer.sprite.setTilePosition(this.cameras.main.scrollX * layer.parallaxFactor, 0)
    }
  }

  private createBackgroundLayers(): void {
    this.backgroundLayers = this.stageMap.backgroundLayers.map((layer) => {
      const sprite = this.add
        .tileSprite(0, 0, layer.width, layer.height, layer.id)
        .setOrigin(0)
        .setScrollFactor(layer.scrollFactor)
        .setDepth(layer.depth)

      return { sprite, parallaxFactor: layer.parallaxFactor }
    })
  }

  private createTerrainLayer(columns: number, rows: number): void {
    const map = this.make.tilemap({
      data: buildTerrainTileGrid({
        columns,
        rows,
        platforms: this.stageMap.terrain.platforms,
      }),
      tileWidth: this.stageMap.world.tileSize,
      tileHeight: this.stageMap.world.tileSize,
    })
    const tileset = map.addTilesetImage(
      'terrain-tiles',
      undefined,
      this.stageMap.world.tileSize,
      this.stageMap.world.tileSize,
      0,
      0,
    )
    const layer = map.createLayer(0, tileset!, 0, 0)

    if (!layer) {
      throw new Error(`Unable to create terrain tilemap layer for stage ${this.stageMap.id}.`)
    }

    layer.setCollision(this.stageMap.terrain.solidTileIndexes)
    layer.setDepth(5)
  }
}

export function createGameplayRendererConfig(input: GameplayRendererInput): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent: input.parent,
    width: 1280,
    height: 720,
    backgroundColor: '#05070d',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [new GameplayMapScene(input.stage)],
  }
}

export function createGameplayRenderer(input: GameplayRendererInput): Phaser.Game {
  return new Phaser.Game(createGameplayRendererConfig(input))
}
```

- [ ] **Step 4: Run the focused adapter test and verify GREEN**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: PASS for `createGameplayRenderer.test.ts`.

- [ ] **Step 5: Create the Svelte gameplay screen lifecycle owner**

Create `src/ui/gameplay/GameplayScreen.svelte`:

```svelte
<script lang="ts">
  import { onMount } from 'svelte'
  import type { GameplayStageMap } from '../../domain/gameplay/gameplayMapTypes'
  import { createGameplayRenderer } from './createGameplayRenderer'

  type Props = {
    stage: GameplayStageMap
  }

  const { stage }: Props = $props()

  let container: HTMLDivElement

  onMount(() => {
    const game = createGameplayRenderer({ parent: container, stage })

    return () => {
      game.destroy(true)
    }
  })
</script>

<section class="gameplay-screen" aria-label={`Gameplay ${stage.id}`}>
  <div bind:this={container} class="gameplay-canvas"></div>
</section>

<style>
  .gameplay-screen {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #05070d;
  }

  .gameplay-canvas {
    width: 100%;
    height: 100%;
  }

  .gameplay-canvas :global(canvas) {
    display: block;
  }
</style>
```

- [ ] **Step 6: Wire gameplay screen into `App.svelte`**

Modify imports in `src/App.svelte`:

```ts
  import { getGameplayStageMap } from './domain/gameplay/gameplayStageMaps'
  import GameplayScreen from './ui/gameplay/GameplayScreen.svelte'
```

Add this derived value near the existing derived `locale`:

```ts
  const gameplayStageMap = $derived(
    appState.screen.type === 'gameplay' ? getGameplayStageMap(appState.screen.stageId) : undefined,
  )
```

Add this branch between `stage-select` and `settings`:

```svelte
    {:else if appState.screen.type === 'gameplay' && gameplayStageMap}
      <GameplayScreen stage={gameplayStageMap} />
```

- [ ] **Step 7: Run Svelte/TypeScript check**

Run:

```bash
npm run check
```

Expected: PASS. If the imported Phaser types expose a narrower config type than expected, adjust only `createGameplayRenderer.ts` types while preserving the public factory functions.

- [ ] **Step 8: Commit Phaser adapter and Svelte gameplay screen**

```bash
git add src/ui/gameplay/createGameplayRenderer.ts src/ui/gameplay/createGameplayRenderer.test.ts src/ui/gameplay/GameplayScreen.svelte src/App.svelte
git commit -m "feat: render gameplay map screen"
```

## Task 6: Full Verification

**Files:**
- No production file edits unless verification exposes a defect.

- [ ] **Step 1: Run the full test suite**

Run:

```bash
npm run test
```

Expected: PASS for all Vitest tests.

- [ ] **Step 2: Run Svelte/TypeScript checks**

Run:

```bash
npm run check
```

Expected: PASS.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: PASS and Vite emits a production build.

- [ ] **Step 4: Run whitespace/path sanity**

Run:

```bash
git diff --check
```

Expected: no output and exit status `0`.

- [ ] **Step 5: Inspect final worktree state**

Run:

```bash
git status --short
```

Expected: clean worktree after all task commits.
