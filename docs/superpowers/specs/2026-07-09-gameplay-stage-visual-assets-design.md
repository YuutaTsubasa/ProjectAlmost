# Gameplay Stage Visual Assets Design

## Goal

Move gameplay background and platform visual selection from hard-coded fallback behavior into rebuilt-project stage visual asset data.

Each converted gameplay stage must resolve its visual assets from the stage theme, producing `GameplayStageMap.backgroundLayers` and `GameplayStageMap.terrain.tilesetAssetRef` that match the current Prototype appearance without importing Prototype runtime code.

## Current State

The rebuilt project already converts all 36 normal stage source files into `GameplayStageMap` objects. The converter currently uses `defaultGameplayThemeAssets` in `src/domain/gameplay/gameplayStageSource.ts`.

Only `white-palace` has real gameplay visual assets in the rebuilt mapping today. Other themes intentionally produce `theme-asset-fallback` diagnostics and reuse White Palace background and platform assets. This was acceptable for the stage-source conversion slice, but it is now the behavior to replace.

The renderer already consumes `GameplayStageMap.backgroundLayers` and `GameplayStageMap.terrain.tilesetAssetRef`, so the new slice should keep the renderer data-driven.

## Prototype Reference

Prototype behavior is reference-only. Do not copy Prototype runtime code.

Observed Prototype gameplay visual rules:

| Theme | Background Behavior | Platform Tiles |
| --- | --- | --- |
| `white-palace` | Uses `white_palace_sky.webp`, `white_palace_far_bg.webp`, `white_palace_mid_bg_loop.webp` as three parallax layers. | `white_palace_platform_tiles.webp` |
| `emerald-sanctuary` | Uses `emerald_sanctuary_sky.webp`, `emerald_sanctuary_far_bg.webp`, `emerald_sanctuary_mid_bg_loop.webp` as three parallax layers. Mid layer width is `3840`. | `emerald_sanctuary_platform_tiles.webp` |
| `cerulean-depths` | Uses `cerulean_depths_stage_select.webp` as the source image for all three background layers. Far layer has `alpha: 0.32`, `tint: 0x8be7ff`; mid layer has `alpha: 0.2`, `tint: 0xdff8ff`. | `white_palace_platform_tiles.webp` |
| `frostveil-peaks` | Uses `frostveil_peaks_stage_select.webp` as the source image for all three background layers. Far layer has `alpha: 0.32`, `tint: 0xccefff`; mid layer has `alpha: 0.2`, `tint: 0xf3fbff`. | `white_palace_platform_tiles.webp` |
| `emberfall-caldera` | Uses `emberfall_caldera_stage_select.webp` as the source image for all three background layers. Far layer has `alpha: 0.35`, `tint: 0xff8a4b`; mid layer has `alpha: 0.22`, `tint: 0xffd19b`. | `white_palace_platform_tiles.webp` |
| `abyssal-hollow` | Uses `abyssal_hollow_stage_select.webp` as the source image for all three background layers. Far layer has `alpha: 0.34`, `tint: 0xb58cff`; mid layer has `alpha: 0.22`, `tint: 0xff8ee8`. | `white_palace_platform_tiles.webp` |

Prototype also contains Emerald Sanctuary gameplay-specific background and tile images that are not yet in rebuilt `public/assets/`:

- `__prototype__/public/assets/maps/emerald_sanctuary_sky.webp`
- `__prototype__/public/assets/maps/emerald_sanctuary_far_bg.webp`
- `__prototype__/public/assets/maps/emerald_sanctuary_mid_bg_loop.webp`
- `__prototype__/public/assets/maps/emerald_sanctuary_gameplay_bg.webp`
- `__prototype__/public/assets/tiles/emerald_sanctuary_platform_tiles.webp`

The rebuilt project already has all stage-select background images for worlds 3-6 in `public/assets/maps/`.

## Chosen Approach

Use a **Theme Asset Catalog**.

The converter will resolve visuals like this:

```ts
source.theme ?? 'white-palace'
  -> gameplayStageVisualProfiles[theme]
  -> GameplayStageMap.backgroundLayers
  -> GameplayStageMap.terrain.tilesetAssetRef
```

This keeps raw stage data focused on gameplay layout and keeps visual policy in one domain-level catalog. It also avoids repeating identical asset references on every stage source entry.

The type shape should leave room for future stage-specific overrides, but this slice will not add overrides until a stage actually needs them.

## Domain Model

Create or extract a focused visual profile model in `src/domain/gameplay/`.

Recommended shape:

```ts
export type GameplayStageVisualProfile = {
  backgroundLayers: readonly GameplayStageVisualLayer[]
  terrainTilesetAssetRef: string
}

export type GameplayStageVisualLayer = {
  id: 'sky' | 'far' | 'mid'
  assetRef: string
  width: number
  height: number
  depth: number
  scrollFactor: number
  parallaxFactor: number
  alpha?: number
  tint?: number
}
```

`GameplayStageMap.backgroundLayers` should support the same optional `alpha` and `tint` fields.

The visual catalog should be complete for all `GameplayStageSourceTheme` values. After this slice, non-white themes should no longer produce `theme-asset-fallback` diagnostics merely because their visual profile is missing.

## Renderer Contract

`createGameplayRenderer.ts` should remain data-driven:

- `preload()` loads every `stageMap.backgroundLayers[].assetRef`.
- `preload()` loads `stageMap.terrain.tilesetAssetRef`.
- background creation uses each layer's `id`, `assetRef`, `width`, `height`, `depth`, `scrollFactor`, and parallax metadata.
- if a layer has `alpha`, the renderer applies it.
- if a layer has `tint`, the renderer applies it.

The renderer must not branch on stage theme to choose images. It may only branch on data shape when applying optional presentation fields.

## Asset Movement

Copy Emerald Sanctuary gameplay assets from Prototype into rebuilt `public/assets/`:

- from `__prototype__/public/assets/maps/emerald_sanctuary_sky.webp` to `public/assets/maps/emerald_sanctuary_sky.webp`
- from `__prototype__/public/assets/maps/emerald_sanctuary_far_bg.webp` to `public/assets/maps/emerald_sanctuary_far_bg.webp`
- from `__prototype__/public/assets/maps/emerald_sanctuary_mid_bg_loop.webp` to `public/assets/maps/emerald_sanctuary_mid_bg_loop.webp`
- from `__prototype__/public/assets/maps/emerald_sanctuary_gameplay_bg.webp` to `public/assets/maps/emerald_sanctuary_gameplay_bg.webp`
- from `__prototype__/public/assets/tiles/emerald_sanctuary_platform_tiles.webp` to `public/assets/tiles/emerald_sanctuary_platform_tiles.webp`

The runtime must reference these files through `/assets/...` URLs only.

Do not import from `__prototype__/`.

## Testing Strategy

Use TDD for every behavior change.

Domain tests:

- `white-palace` resolves the three White Palace parallax layers and White Palace platform tiles.
- `emerald-sanctuary` resolves the three Emerald Sanctuary parallax layers and Emerald Sanctuary platform tiles.
- `cerulean-depths`, `frostveil-peaks`, `emberfall-caldera`, and `abyssal-hollow` resolve their stage-select image as all three background layers, with Prototype-matching `alpha` and `tint` on far/mid layers.
- all theme profiles use `/assets/...` refs and no `__prototype__` paths.
- non-white themes no longer emit `theme-asset-fallback` diagnostics when a visual profile exists.
- stage catalog tests prove representative converted stages use the expected theme assets:
  - `1-1` -> White Palace assets
  - `2-1` -> Emerald Sanctuary assets
  - `3-1`, `4-1`, `5-1`, `6-1` -> stage-select fallback visual rules for their themes

Renderer tests:

- preloading includes background layers and terrain tiles from the stage map.
- creating background layers applies optional `alpha` and `tint`.
- renderer tests should use data fixtures or representative converted stages; do not reintroduce theme-specific hard-coded image selection.

Asset tests or checks:

- Emerald Sanctuary gameplay assets exist under rebuilt `public/assets/`.
- runtime references do not include `__prototype__`.

Verification before completion:

- `npm run test`
- `npm run check`
- `npm run build`
- `git diff --check`
- `rg -n "__prototype__" src public package.json`

Expected `rg` output may include tests that assert asset refs do not contain `__prototype__`; runtime imports or runtime asset paths from `__prototype__` are not acceptable.

## Out Of Scope

- Generating new art for worlds 3-6.
- Adding stage-specific visual overrides.
- Changing gameplay physics, collision, moving platforms, hazards, enemies, or checkpoints.
- Changing character, enemy, checkpoint, goal, coin, or HUD art.
- Rewriting renderer architecture.
- Copying Prototype runtime code.

## Acceptance Criteria

- All gameplay themes have explicit rebuilt-project visual profiles.
- Emerald Sanctuary gameplay background and platform assets are present in rebuilt `public/assets/`.
- Converted stages choose background and platform assets from theme visual profiles.
- Renderer applies layer `alpha` and `tint` from map data.
- Non-white themes do not use White Palace visual fallback unless Prototype behavior specifically does so for platform tiles in worlds 3-6.
- Runtime code contains no `__prototype__` imports or paths.
- Full required checks pass.
