# Gameplay Map Rendering Design

## Goal

Build the first rebuild gameplay rendering slice: entering a selected stage opens a gameplay screen that draws the White Palace multi-layer background and the stage platform floor from rebuild-owned assets and rebuild-owned stage data.

## Approved Scope

- Use Phaser as a thin imperative rendering adapter inside the rebuild.
- Keep gameplay rules, stage data validation, and tile decisions in pure TypeScript domain modules.
- Copy White Palace gameplay runtime assets from `__prototype__/public/assets/` into root `public/assets/`.
- Render stage `1-1` background layers and terrain platforms only.
- Wire Stage Select confirmation into a new `gameplay` app screen for the selected stage.
- Keep this slice deterministic and testable at the domain/application boundary.

The slice is intentionally visual and structural. It does not add player movement, physics gameplay, enemies, hazards, pickups, checkpoints, goals, HUD, save data, or stage completion.

## Architecture

The rebuild keeps the existing DDD/FP/Reactive split.

Domain code under `src/domain/gameplay/` owns the map data model and terrain calculations. It does not import Svelte, Phaser, DOM APIs, browser storage, timers, or prototype runtime code. The domain layer exposes:

- stage map types for `GameplayStageMap`, `BackgroundLayer`, `TerrainDefinition`, and `PlatformRect`
- tile grid helpers for column and row counts
- platform tile selection for left, middle, and right platform tile indexes
- pure terrain-grid creation from platform rectangles
- validation that platforms fit inside the stage tile grid

Application code may expose lookup/use-case helpers such as `getGameplayStageMap(stageId)`. It returns rebuild-owned stage map data keyed by the existing stage id, beginning with `1-1`.

UI code owns the reactive lifecycle. `GameplayScreen.svelte` mounts a Phaser game into a fixed container, passes the selected `GameplayStageMap` to the adapter, and destroys the Phaser instance when the component unmounts or stage data changes. Svelte does not calculate terrain rules.

The Phaser adapter owns side effects only:

- asset loading
- canvas creation
- background layer creation
- tilemap layer creation
- camera and world bounds
- game destruction

The adapter consumes already-validated stage map data and pure terrain output. Any Phaser-specific failure, such as a missing tile layer, stays in the adapter and is reported as a clear thrown error.

## Stage Data Shape

The first gameplay map definition lives in the rebuild, not under `__prototype__`. It should be narrow enough for this slice but shaped for future gameplay objects.

```ts
export type GameplayStageMap = {
  id: StageId
  theme: 'white-palace'
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

`GameplayStageMap` deliberately leaves room for future object groups without implementing them in this slice. Later specs can add `actors`, `enemies`, `hazards`, `pickups`, `checkpoints`, and `goal` as explicit groups. For now, only `backgroundLayers` and `terrain.platforms` are rendered.

## Asset Boundary

Runtime assets used by the rebuild must live under root `public/`, not `__prototype__/public/`.

Copy these assets from the prototype into the matching root-level paths if they are not already present:

- `__prototype__/public/assets/maps/white_palace_far_bg.webp` -> `public/assets/maps/white_palace_far_bg.webp`
- `__prototype__/public/assets/maps/white_palace_mid_bg_loop.webp` -> `public/assets/maps/white_palace_mid_bg_loop.webp`
- `__prototype__/public/assets/tiles/white_palace_platform_tiles.webp` -> `public/assets/tiles/white_palace_platform_tiles.webp`

The root project already has `public/assets/maps/white_palace_sky.webp`, so the stage map should reference that existing asset for the sky layer. The rebuild must never reference prototype asset paths at runtime.

## Rendering Behavior

When the current app screen is `gameplay`, the app renders `GameplayScreen`.

For stage `1-1`, the Phaser scene:

1. Sets world and camera bounds from `stage.world`.
2. Preloads the sky, far background, mid background loop, and platform tileset from `stage.backgroundLayers` and `stage.terrain.tilesetAssetRef`.
3. Draws background layers as tile sprites at their configured depths.
4. Applies each layer's scroll factor and updates tile position from camera scroll using `parallaxFactor`.
5. Builds tilemap data from `stage.terrain.platforms` through the pure terrain-grid function.
6. Creates a tilemap layer using the White Palace platform tileset.
7. Marks `solidTileIndexes` as collidable even though player collision is out of scope for this slice.

The camera may start at the stage origin. Following a player and user-controlled camera movement are out of scope.

## App Flow

Extend the app screen union with:

```ts
export type GameplayScreen = {
  type: 'gameplay'
  stageId: StageId
}
```

`confirmSelectedStage` should transition from `stage-select` into `gameplay` with the selected stage id. If called from any other screen, it should preserve the current app state.

Back navigation from gameplay is not required in this slice. A separate gameplay shell spec must define pause, back, result, and route-exit behavior before those routes are implemented.

## Future Object System Direction

Do not build a full gameplay object system in this slice. The correct near-term direction is a data-first stage object model with explicit groups and pure eligibility/geometry rules before adapter rendering:

- `backgroundLayers`: visual layers rendered behind gameplay.
- `terrain.platforms`: static collidable tile rectangles.
- future `actors`: player spawn and controllable character state.
- future `enemies`: enemy spawn definitions, patrol bounds, scoring flags, and respawn policy.
- future `hazards`: damaging geometry and presentation asset refs.
- future `pickups`: coins and other collectible points.
- future `checkpoints` and `goal`: progression objects.

Each group should have domain rules before Phaser rendering is added. Phaser runtime objects should be adapter projections of domain data, not the source of gameplay truth.

## Testing Plan

Use TDD for domain and application behavior.

Domain tests:

- `getTileColumnCount` divides world width by tile size.
- `getTileRowCount` rounds up partial rows.
- `getPlatformTileIndex` returns middle for width `1`, left for first tile, right for last tile, and middle for interior tiles.
- `buildTerrainTileGrid` creates an empty grid and writes platform tile indexes into the expected cells.
- `validatePlatformBounds` accepts platforms inside the grid and rejects platforms that exceed row or column bounds.

Gameplay map catalog tests:

- Stage `1-1` exists in the gameplay map catalog.
- Stage `1-1` references only root `/assets/` paths.
- Stage `1-1` includes sky, far, and mid background layers in depth order.
- Stage `1-1` includes the White Palace platform tileset.
- Stage `1-1` terrain validates against its world grid.

Application tests:

- Confirming a selected Stage Select node transitions to `gameplay`.
- The gameplay screen stores the selected stage id.
- Calling `confirmSelectedStage` outside Stage Select preserves state.

Adapter/UI checks:

- Svelte check validates the `GameplayScreen` lifecycle and props.
- Build validates Phaser import/bundling and asset references.

Before finishing implementation, run:

```bash
npm run test
npm run check
npm run build
git diff --check
```

Report any command that cannot run and why.

## Out Of Scope

- Moving all prototype stage JSON files.
- Rendering any stage other than `1-1`.
- Player sprite, input, movement, camera follow, gravity, crouch, jump, attack, hurt, death, or respawn.
- Enemy, boss, projectile, hazard, coin, checkpoint, goal, HUD, timer, score, rank, or stage-clear systems.
- Save data, unlocks, or records.
- Audio changes for gameplay music.
- Tauri Rust changes.
- Importing runtime code from `__prototype__/src`.
