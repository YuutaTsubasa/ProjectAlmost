# Gameplay Stage Source Conversion Design

## Context

The rebuilt gameplay renderer currently receives `GameplayStageMap` from a hand-authored catalog. Only stage `1-1` is available through `getGameplayStageMap()`, and it is manually shaped for the renderer.

The prototype keeps 36 gameplay stage files under `__prototype__/src/game/stages/`. Those files describe stage layout and gameplay objects such as platforms, coins, enemies, hazards, checkpoints, and goals. They also include mechanics the rebuilt renderer does not fully support yet, such as moving platforms, gravity zones, surface zones, lava, and boss arenas.

This design adds a rebuilt-project conversion boundary. It uses the prototype stage files as reference material, but the runtime source data and conversion code live in the rebuilt project and do not import from `__prototype__/`.

## Goals

- Add a stage-source-to-runtime-map conversion pipeline in the rebuilt project.
- Make all 36 normal stage ids return a `GameplayStageMap`.
- Keep conversion logic pure and testable in `src/domain/gameplay/`.
- Preserve supported prototype-authored data for:
  - world size and tile size
  - rank targets
  - player spawn
  - terrain platforms
  - coins
  - Armor Guard and Azure Core enemies
  - spike hazards
  - checkpoints
  - stage goal
  - theme-derived background and terrain assets
- Emit explicit diagnostics for unsupported or deferred mechanics instead of silently dropping them.
- Keep renderer-facing data stable so `createGameplayRenderer.ts` can continue consuming `GameplayStageMap`.

## Non-Goals

- Implementing moving platform behavior.
- Implementing gravity-zone behavior.
- Implementing surface-zone behavior such as ice.
- Implementing lava behavior or new hazard presentations.
- Implementing boss arena stages or boss-specific gameplay.
- Claiming visual parity for unsupported mechanics in this slice.
- Runtime-importing prototype source files or JSON files from `__prototype__/`.

## Architecture

Use three layers of data:

1. **Stage source data**
   - Rebuilt-project authored data that mirrors the prototype stage file shape closely enough to preserve stage layout.
   - Lives under `src/domain/gameplay/` or a nearby data module in the rebuilt project.
   - Is static TypeScript data, not runtime imports from `__prototype__/`.

2. **Pure converter**
   - Converts a `GameplayStageSource` plus theme asset definitions into a `GameplayStageMap`.
   - Returns conversion diagnostics alongside the map.
   - Does not read files, mutate input, depend on Phaser, or access browser APIs.

3. **Runtime map catalog**
   - `gameplayStageMaps` is built from converted stage sources.
   - `getGameplayStageMap(stageId)` returns the converted map for every normal stage id from `1-1` through `6-6`.
   - The renderer remains coupled only to `GameplayStageMap`.

## Source Model

Add a rebuilt stage source model with the fields needed to represent prototype stage files:

- `id`
- `theme`
- `rankTargets`
- `world`
- `playerSpawn`
- `platforms`
- `movingPlatforms`
- `hazards`
- `gravityZones`
- `surfaceZones`
- `coins`
- `enemies`
- `checkpoints`
- `goal`

The model can be narrower than the prototype if a field is not used yet, but unsupported fields that exist in the copied stage data must remain visible enough to produce diagnostics.

Enemy conversion rules:

- Prototype guard enemies with `type` missing or `type: 'guard'` become `type: 'armor-guard'`.
- Prototype Azure Core enemies stay `type: 'azure-core'`.
- Enemy ids and patrol bounds are preserved.

Coin conversion rules:

- Prototype coin points do not have ids.
- The converter assigns stable ids using stage id and index, such as `1-1-coin-001`.
- Coin coordinates are preserved.

Hazard conversion rules:

- `spikes` convert to `GameplayHazardSpawn`.
- Unsupported hazard types such as `lava` produce diagnostics.
- Unsupported hazards are not emitted into `GameplayStageMap.hazards` until their runtime behavior and presentation exist.

Theme conversion rules:

- `theme` defaults to `white-palace` if omitted.
- Theme controls background layer assets and terrain tile asset.
- This slice must at least define theme asset mappings for all prototype stage themes so every stage can produce a renderable map.
- If a final asset is unavailable for a non-white-palace theme, the mapping must point to an existing rebuilt-project asset and the diagnostic must make the fallback explicit.

## Diagnostics

The converter returns diagnostics with stable codes and enough context to act on later. Initial codes:

- `unsupported-moving-platform`
- `unsupported-gravity-zone`
- `unsupported-surface-zone`
- `unsupported-hazard`
- `theme-asset-fallback`

Diagnostics include:

- `stageId`
- `code`
- optional `sourceId`
- human-readable `message`

Diagnostics are part of the domain API. Tests should assert specific codes rather than relying only on message text.

## Catalog Behavior

`gameplayStageMaps.order` must contain all 36 normal stage ids in stage catalog order.

`getGameplayStageMap(stageId)` must return a defined `GameplayStageMap` for every normal stage id from `1-1` through `6-6`.

Converted maps must preserve:

- stage id
- world dimensions
- rank targets
- player spawn
- platform rectangles
- supported enemies
- supported hazards
- checkpoints
- goal
- background layer order
- terrain tileset asset ref

Unsupported mechanics must be represented through diagnostics available from the conversion/catalog layer. They must not be silently ignored.

## Renderer Compatibility

The renderer should continue to accept `GameplayStageMap`. This slice does not require renderer behavior for unsupported mechanics.

Renderer contract tests should verify representative converted maps can be created by the renderer without throwing. Suggested samples:

- `1-1`: baseline white-palace stage
- `2-1`: stage with moving platforms and spike hazards
- `4-4`: stage with moving platforms and surface zones

Those tests prove the conversion produces renderable maps for supported data while diagnostics track deferred mechanics.

## Prototype Boundary

Prototype files are reference material only. The rebuilt project must not:

- import JSON or TypeScript from `__prototype__/`
- keep runtime asset refs pointing into `__prototype__/`
- rely on prototype validation or registry code at runtime

Copying stage data into rebuilt-project data files is allowed for this slice because the goal is to rebuild the stage source catalog. Any transformation logic must be newly implemented in the rebuilt project.

## Testing Strategy

Use TDD in focused slices.

Domain converter tests:

- Convert `1-1` source into a `GameplayStageMap` with exact world, rank targets, player spawn, platform count, coin count, enemy conversion, checkpoints, and goal.
- Assign stable coin ids.
- Convert missing guard type or `type: 'guard'` into `armor-guard`.
- Convert spike hazards and diagnose unsupported hazards.
- Emit diagnostics for moving platforms, gravity zones, and surface zones.
- Map every theme to renderable background and terrain asset refs.

Catalog tests:

- All 36 stage ids are present in `gameplayStageMaps.order`.
- `getGameplayStageMap(stageId)` is defined for all 36 ids.
- Converted stage ids align with `src/domain/data/stages/stageCatalog.ts`.
- Asset refs start with `/assets/` and do not contain `__prototype__`.
- Platform bounds validate for every converted map.
- Enemy ids and coin ids are unique within every converted map.
- Conversion diagnostics are available and include known unsupported mechanics from representative stages.

Renderer contract tests:

- Create renderer scenes for representative converted maps without throwing.
- Verify non-white-palace stages receive background layers and terrain asset refs.
- Do not assert unsupported mechanics as rendered until their dedicated slices implement them.

Full verification after implementation:

- `npm run test`
- `npm run check`
- `npm run build`
- `git diff --check`
- `rg -n "__prototype__" src public package.json`

## Implementation Constraints

- Keep conversion in pure domain code.
- Keep renderer-facing `GameplayStageMap` stable unless a type extension is required and covered by tests.
- Do not add behavior for unsupported mechanics in this slice.
- Do not add UI copy.
- Do not alter stage select behavior except for making gameplay map lookup succeed for all normal stage ids.
