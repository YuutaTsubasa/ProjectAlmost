# Gameplay Stage Visual Assets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make each converted gameplay stage choose Prototype-matching background and platform visual assets from rebuilt-project theme visual profiles.

**Architecture:** Extract gameplay visual profiles into pure domain data keyed by `GameplayStageSourceTheme`, and have the stage-source converter place those profiles into `GameplayStageMap`. The renderer remains data-driven and only applies presentation fields supplied by `BackgroundLayer`.

**Tech Stack:** TypeScript, Vitest, Vite/Svelte frontend, Phaser renderer boundary, static assets under `public/assets/`.

---

## File Structure

- Create `src/domain/gameplay/gameplayStageVisualProfile.ts`
  - Owns `GameplayStageVisualProfile`, `GameplayStageVisualLayer`, and `gameplayStageVisualProfiles`.
  - Contains no Svelte, Phaser, DOM, file reads, or Prototype imports.

- Create `src/domain/gameplay/gameplayStageVisualProfile.test.ts`
  - Locks all theme asset profiles and Prototype-matching layer presentation values.

- Modify `src/domain/gameplay/gameplayMapTypes.ts`
  - Extends `BackgroundLayer` with optional `alpha?: number` and `tint?: number`.

- Modify `src/domain/gameplay/gameplayStageSource.ts`
  - Keeps legacy visual-profile compatibility until converter wiring switches in Task 2.
  - Removes `theme-asset-fallback` from conversion diagnostics in Task 2 after all theme profiles are wired.

- Modify `src/domain/gameplay/gameplayStageMapConverter.ts`
  - Accepts visual profiles and emits `BackgroundLayer`/terrain assets from those profiles.

- Modify `src/domain/gameplay/gameplayStageMapConverter.test.ts`
  - Updates existing visual expectations to use complete theme profiles.
  - Removes expectations that non-white themes produce fallback diagnostics.

- Modify `src/domain/gameplay/gameplayStageMaps.ts`
  - Passes `gameplayStageVisualProfiles` to conversion.

- Modify `src/domain/gameplay/gameplayStageMaps.test.ts`
  - Adds representative converted-stage assertions for White Palace, Emerald Sanctuary, and worlds 3-6 stage-select visual rules.

- Modify `src/ui/gameplay/createGameplayRenderer.ts`
  - Applies optional `alpha` and `tint` from background layer data.

- Modify `src/ui/gameplay/createGameplayRenderer.test.ts`
  - Adds renderer contract coverage for background layer `alpha` and `tint`.

- Copy assets into rebuilt `public/assets/`
  - `public/assets/maps/emerald_sanctuary_sky.webp`
  - `public/assets/maps/emerald_sanctuary_far_bg.webp`
  - `public/assets/maps/emerald_sanctuary_mid_bg_loop.webp`
  - `public/assets/maps/emerald_sanctuary_gameplay_bg.webp`
  - `public/assets/tiles/emerald_sanctuary_platform_tiles.webp`

---

### Task 1: Domain Visual Profiles

**Files:**
- Create: `src/domain/gameplay/gameplayStageVisualProfile.ts`
- Create: `src/domain/gameplay/gameplayStageVisualProfile.test.ts`
- Modify: `src/domain/gameplay/gameplayMapTypes.ts`

- [ ] **Step 1: Write the failing visual profile tests**

Create `src/domain/gameplay/gameplayStageVisualProfile.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { gameplayStageVisualProfiles } from './gameplayStageVisualProfile'

describe('gameplayStageVisualProfiles', () => {
  it('defines complete rebuilt asset profiles for every gameplay theme', () => {
    expect(Object.keys(gameplayStageVisualProfiles).sort()).toEqual([
      'abyssal-hollow',
      'cerulean-depths',
      'emberfall-caldera',
      'emerald-sanctuary',
      'frostveil-peaks',
      'white-palace',
    ])

    for (const profile of Object.values(gameplayStageVisualProfiles)) {
      expect(profile.backgroundLayers.map((layer) => layer.id)).toEqual(['sky', 'far', 'mid'])
      expect(profile.backgroundLayers.every((layer) => layer.assetRef.startsWith('/assets/'))).toBe(true)
      expect(profile.backgroundLayers.every((layer) => !layer.assetRef.includes('__prototype__'))).toBe(true)
      expect(profile.terrainTilesetAssetRef).toMatch(/^\/assets\//)
      expect(profile.terrainTilesetAssetRef).not.toContain('__prototype__')
    }
  })

  it('matches Prototype White Palace gameplay visuals', () => {
    expect(gameplayStageVisualProfiles['white-palace']).toEqual({
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
      terrainTilesetAssetRef: '/assets/tiles/white_palace_platform_tiles.webp',
    })
  })

  it('matches Prototype Emerald Sanctuary gameplay visuals', () => {
    expect(gameplayStageVisualProfiles['emerald-sanctuary']).toEqual({
      backgroundLayers: [
        {
          id: 'sky',
          assetRef: '/assets/maps/emerald_sanctuary_sky.webp',
          width: 1920,
          height: 1080,
          depth: -30,
          scrollFactor: 0,
          parallaxFactor: 0,
        },
        {
          id: 'far',
          assetRef: '/assets/maps/emerald_sanctuary_far_bg.webp',
          width: 1920,
          height: 1080,
          depth: -20,
          scrollFactor: 0,
          parallaxFactor: 0.08,
        },
        {
          id: 'mid',
          assetRef: '/assets/maps/emerald_sanctuary_mid_bg_loop.webp',
          width: 3840,
          height: 1080,
          depth: -10,
          scrollFactor: 0,
          parallaxFactor: 0.18,
        },
      ],
      terrainTilesetAssetRef: '/assets/tiles/emerald_sanctuary_platform_tiles.webp',
    })
  })

  it('matches Prototype stage-select background treatment for worlds 3 through 6', () => {
    expect(gameplayStageVisualProfiles['cerulean-depths']).toMatchObject({
      backgroundLayers: [
        { id: 'sky', assetRef: '/assets/maps/cerulean_depths_stage_select.webp' },
        { id: 'far', assetRef: '/assets/maps/cerulean_depths_stage_select.webp', alpha: 0.32, tint: 0x8be7ff },
        { id: 'mid', assetRef: '/assets/maps/cerulean_depths_stage_select.webp', alpha: 0.2, tint: 0xdff8ff },
      ],
      terrainTilesetAssetRef: '/assets/tiles/white_palace_platform_tiles.webp',
    })
    expect(gameplayStageVisualProfiles['frostveil-peaks']).toMatchObject({
      backgroundLayers: [
        { id: 'sky', assetRef: '/assets/maps/frostveil_peaks_stage_select.webp' },
        { id: 'far', assetRef: '/assets/maps/frostveil_peaks_stage_select.webp', alpha: 0.32, tint: 0xccefff },
        { id: 'mid', assetRef: '/assets/maps/frostveil_peaks_stage_select.webp', alpha: 0.2, tint: 0xf3fbff },
      ],
      terrainTilesetAssetRef: '/assets/tiles/white_palace_platform_tiles.webp',
    })
    expect(gameplayStageVisualProfiles['emberfall-caldera']).toMatchObject({
      backgroundLayers: [
        { id: 'sky', assetRef: '/assets/maps/emberfall_caldera_stage_select.webp' },
        { id: 'far', assetRef: '/assets/maps/emberfall_caldera_stage_select.webp', alpha: 0.35, tint: 0xff8a4b },
        { id: 'mid', assetRef: '/assets/maps/emberfall_caldera_stage_select.webp', alpha: 0.22, tint: 0xffd19b },
      ],
      terrainTilesetAssetRef: '/assets/tiles/white_palace_platform_tiles.webp',
    })
    expect(gameplayStageVisualProfiles['abyssal-hollow']).toMatchObject({
      backgroundLayers: [
        { id: 'sky', assetRef: '/assets/maps/abyssal_hollow_stage_select.webp' },
        { id: 'far', assetRef: '/assets/maps/abyssal_hollow_stage_select.webp', alpha: 0.34, tint: 0xb58cff },
        { id: 'mid', assetRef: '/assets/maps/abyssal_hollow_stage_select.webp', alpha: 0.22, tint: 0xff8ee8 },
      ],
      terrainTilesetAssetRef: '/assets/tiles/white_palace_platform_tiles.webp',
    })
  })
})
```

- [ ] **Step 2: Run visual profile tests and verify RED**

Run:

```bash
npm run test -- src/domain/gameplay/gameplayStageVisualProfile.test.ts
```

Expected: FAIL because `./gameplayStageVisualProfile` does not exist.

- [ ] **Step 3: Extend `BackgroundLayer` presentation fields**

Modify `src/domain/gameplay/gameplayMapTypes.ts`:

```ts
export type BackgroundLayer = {
  id: string
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

- [ ] **Step 4: Add visual profile domain module**

Create `src/domain/gameplay/gameplayStageVisualProfile.ts`:

```ts
import type { GameplayStageSourceTheme } from './gameplayStageSource'

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

const SKY_LAYER = {
  width: 1920,
  height: 1080,
  depth: -30,
  scrollFactor: 0,
  parallaxFactor: 0,
} as const

const FAR_LAYER = {
  width: 1920,
  height: 1080,
  depth: -20,
  scrollFactor: 0,
  parallaxFactor: 0.08,
} as const

const MID_LAYER = {
  width: 1920,
  height: 1080,
  depth: -10,
  scrollFactor: 0,
  parallaxFactor: 0.18,
} as const

const WHITE_PALACE_TILES = '/assets/tiles/white_palace_platform_tiles.webp'

function stageSelectProfile(input: {
  assetRef: string
  farAlpha: number
  farTint: number
  midAlpha: number
  midTint: number
}): GameplayStageVisualProfile {
  return {
    backgroundLayers: [
      { id: 'sky', assetRef: input.assetRef, ...SKY_LAYER },
      { id: 'far', assetRef: input.assetRef, ...FAR_LAYER, alpha: input.farAlpha, tint: input.farTint },
      { id: 'mid', assetRef: input.assetRef, ...MID_LAYER, alpha: input.midAlpha, tint: input.midTint },
    ],
    terrainTilesetAssetRef: WHITE_PALACE_TILES,
  }
}

export const gameplayStageVisualProfiles: Record<GameplayStageSourceTheme, GameplayStageVisualProfile> = {
  'white-palace': {
    backgroundLayers: [
      { id: 'sky', assetRef: '/assets/maps/white_palace_sky.webp', ...SKY_LAYER },
      { id: 'far', assetRef: '/assets/maps/white_palace_far_bg.webp', ...FAR_LAYER },
      { id: 'mid', assetRef: '/assets/maps/white_palace_mid_bg_loop.webp', ...MID_LAYER },
    ],
    terrainTilesetAssetRef: WHITE_PALACE_TILES,
  },
  'emerald-sanctuary': {
    backgroundLayers: [
      { id: 'sky', assetRef: '/assets/maps/emerald_sanctuary_sky.webp', ...SKY_LAYER },
      { id: 'far', assetRef: '/assets/maps/emerald_sanctuary_far_bg.webp', ...FAR_LAYER },
      {
        id: 'mid',
        assetRef: '/assets/maps/emerald_sanctuary_mid_bg_loop.webp',
        ...MID_LAYER,
        width: 3840,
      },
    ],
    terrainTilesetAssetRef: '/assets/tiles/emerald_sanctuary_platform_tiles.webp',
  },
  'cerulean-depths': stageSelectProfile({
    assetRef: '/assets/maps/cerulean_depths_stage_select.webp',
    farAlpha: 0.32,
    farTint: 0x8be7ff,
    midAlpha: 0.2,
    midTint: 0xdff8ff,
  }),
  'frostveil-peaks': stageSelectProfile({
    assetRef: '/assets/maps/frostveil_peaks_stage_select.webp',
    farAlpha: 0.32,
    farTint: 0xccefff,
    midAlpha: 0.2,
    midTint: 0xf3fbff,
  }),
  'emberfall-caldera': stageSelectProfile({
    assetRef: '/assets/maps/emberfall_caldera_stage_select.webp',
    farAlpha: 0.35,
    farTint: 0xff8a4b,
    midAlpha: 0.22,
    midTint: 0xffd19b,
  }),
  'abyssal-hollow': stageSelectProfile({
    assetRef: '/assets/maps/abyssal_hollow_stage_select.webp',
    farAlpha: 0.34,
    farTint: 0xb58cff,
    midAlpha: 0.22,
    midTint: 0xff8ee8,
  }),
}
```

- [ ] **Step 5: Run visual profile tests and verify GREEN**

Run:

```bash
npm run test -- src/domain/gameplay/gameplayStageVisualProfile.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run affected converter tests to verify compatibility**

Run:

```bash
npm run test -- src/domain/gameplay/gameplayStageMapConverter.test.ts
```

Expected: PASS because Task 1 has not removed the existing `defaultGameplayThemeAssets` compatibility path yet.

- [ ] **Step 7: Run typecheck and verify GREEN**

Run:

```bash
npm run check
```

Expected: PASS.

- [ ] **Step 8: Commit domain visual profile slice**

Run:

```bash
git add src/domain/gameplay/gameplayMapTypes.ts src/domain/gameplay/gameplayStageVisualProfile.ts src/domain/gameplay/gameplayStageVisualProfile.test.ts
git commit -m "feat: add gameplay stage visual profiles"
```

Expected: commit contains only visual profile domain model/tests and `BackgroundLayer` type extension.

---

### Task 2: Converter And Catalog Wiring

**Files:**
- Modify: `src/domain/gameplay/gameplayStageMapConverter.ts`
- Modify: `src/domain/gameplay/gameplayStageMapConverter.test.ts`
- Modify: `src/domain/gameplay/gameplayStageMaps.ts`
- Modify: `src/domain/gameplay/gameplayStageMaps.test.ts`
- Modify: `src/domain/gameplay/gameplayStageSource.ts`
- Copy assets under `public/assets/`

- [ ] **Step 1: Write failing converter tests for visual profile wiring**

Modify `src/domain/gameplay/gameplayStageMapConverter.test.ts`:

1. Replace imports of `defaultGameplayThemeAssets` with `gameplayStageVisualProfiles` from `./gameplayStageVisualProfile`.
2. Change every call from:

```ts
convertGameplayStageSource(firstGateSource, defaultGameplayThemeAssets)
```

to:

```ts
convertGameplayStageSource(firstGateSource, gameplayStageVisualProfiles)
```

3. Replace the test named `emits a theme asset fallback diagnostic for non-white themes while still producing renderable assets` with:

```ts
  it('uses complete non-white theme profiles without fallback diagnostics', () => {
    const result = convertGameplayStageSource(
      {
        ...firstGateSource,
        theme: 'emerald-sanctuary',
      },
      gameplayStageVisualProfiles,
    )

    expect(result.map.theme).toBe('emerald-sanctuary')
    expect(result.map.backgroundLayers.map((layer) => layer.assetRef)).toEqual([
      '/assets/maps/emerald_sanctuary_sky.webp',
      '/assets/maps/emerald_sanctuary_far_bg.webp',
      '/assets/maps/emerald_sanctuary_mid_bg_loop.webp',
    ])
    expect(result.map.backgroundLayers[2]).toMatchObject({
      id: 'mid',
      width: 3840,
    })
    expect(result.map.terrain.tilesetAssetRef).toBe('/assets/tiles/emerald_sanctuary_platform_tiles.webp')
    expect(result.diagnostics).toEqual([])
  })
```

4. In `maps every supported theme to renderable asset refs`, keep the `/assets/` assertions but change the expected diagnostics rule:

```ts
      expect(result.diagnostics).toEqual([])
```

- [ ] **Step 2: Run converter tests and verify RED**

Run:

```bash
npm run test -- src/domain/gameplay/gameplayStageMapConverter.test.ts
```

Expected: FAIL because `convertGameplayStageSource` still expects `GameplayThemeAssets` and still emits `theme-asset-fallback`.

- [ ] **Step 3: Rewire the converter to visual profiles**

Modify `src/domain/gameplay/gameplayStageMapConverter.ts`:

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
} from './gameplayStageSource'
import type { GameplayStageVisualProfile } from './gameplayStageVisualProfile'
```

Remove `BACKGROUND_LAYER_PRESENTATION`.

Change the function signature and body:

```ts
export function convertGameplayStageSource(
  source: GameplayStageSource,
  visualProfiles: Record<GameplayStageSourceTheme, GameplayStageVisualProfile>,
): GameplayStageMapConversionResult {
  const theme = source.theme ?? 'white-palace'
  const visualProfile = visualProfiles[theme]
  const diagnostics: GameplayStageConversionDiagnostic[] = []

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
      backgroundLayers: visualProfile.backgroundLayers.map((layer) => ({ ...layer })),
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
        tilesetAssetRef: visualProfile.terrainTilesetAssetRef,
        solidTileIndexes: [0, 1, 2],
        platforms: source.platforms.map((platform) => ({ ...platform })),
      },
    },
    diagnostics,
  }
}
```

- [ ] **Step 4: Remove legacy fallback visual diagnostics and assets from stage source**

Modify `src/domain/gameplay/gameplayStageSource.ts`:

1. Delete `GameplayThemeAssets`.
2. Delete `defaultGameplayThemeAssets`.
3. Remove `'theme-asset-fallback'` from `GameplayStageConversionDiagnosticCode`.
4. Keep `GameplayStageSourceTheme` and `toGameplayTheme`.

The diagnostic union should become:

```ts
export type GameplayStageConversionDiagnosticCode =
  | 'unsupported-moving-platform'
  | 'unsupported-gravity-zone'
  | 'unsupported-surface-zone'
  | 'unsupported-hazard'
```

- [ ] **Step 5: Wire catalog conversion to visual profiles**

Modify `src/domain/gameplay/gameplayStageMaps.ts` imports:

```ts
import { convertGameplayStageSource } from './gameplayStageMapConverter'
import type { GameplayStageConversionDiagnostic } from './gameplayStageSource'
import { gameplayStageSources } from './gameplayStageSources'
import { gameplayStageVisualProfiles } from './gameplayStageVisualProfile'
```

Change the conversion call:

```ts
return [stageId, convertGameplayStageSource(source, gameplayStageVisualProfiles)] as const
```

- [ ] **Step 6: Copy Emerald Sanctuary gameplay assets into rebuilt public assets**

Run:

```bash
cp __prototype__/public/assets/maps/emerald_sanctuary_sky.webp public/assets/maps/emerald_sanctuary_sky.webp
cp __prototype__/public/assets/maps/emerald_sanctuary_far_bg.webp public/assets/maps/emerald_sanctuary_far_bg.webp
cp __prototype__/public/assets/maps/emerald_sanctuary_mid_bg_loop.webp public/assets/maps/emerald_sanctuary_mid_bg_loop.webp
cp __prototype__/public/assets/maps/emerald_sanctuary_gameplay_bg.webp public/assets/maps/emerald_sanctuary_gameplay_bg.webp
cp __prototype__/public/assets/tiles/emerald_sanctuary_platform_tiles.webp public/assets/tiles/emerald_sanctuary_platform_tiles.webp
```

Expected: five new rebuilt-project asset files are present under `public/assets/`.

- [ ] **Step 7: Add catalog tests for representative stage visual assets**

Modify `src/domain/gameplay/gameplayStageMaps.test.ts` by adding:

```ts
  it('uses Prototype-matching visual assets for representative converted themes', () => {
    expect(getGameplayStageMap('1-1')).toMatchObject({
      backgroundLayers: [
        { id: 'sky', assetRef: '/assets/maps/white_palace_sky.webp' },
        { id: 'far', assetRef: '/assets/maps/white_palace_far_bg.webp' },
        { id: 'mid', assetRef: '/assets/maps/white_palace_mid_bg_loop.webp' },
      ],
      terrain: {
        tilesetAssetRef: '/assets/tiles/white_palace_platform_tiles.webp',
      },
    })

    expect(getGameplayStageMap('2-1')).toMatchObject({
      backgroundLayers: [
        { id: 'sky', assetRef: '/assets/maps/emerald_sanctuary_sky.webp' },
        { id: 'far', assetRef: '/assets/maps/emerald_sanctuary_far_bg.webp' },
        { id: 'mid', assetRef: '/assets/maps/emerald_sanctuary_mid_bg_loop.webp', width: 3840 },
      ],
      terrain: {
        tilesetAssetRef: '/assets/tiles/emerald_sanctuary_platform_tiles.webp',
      },
    })

    expect(getGameplayStageMap('3-1')).toMatchObject({
      backgroundLayers: [
        { id: 'sky', assetRef: '/assets/maps/cerulean_depths_stage_select.webp' },
        { id: 'far', assetRef: '/assets/maps/cerulean_depths_stage_select.webp', alpha: 0.32, tint: 0x8be7ff },
        { id: 'mid', assetRef: '/assets/maps/cerulean_depths_stage_select.webp', alpha: 0.2, tint: 0xdff8ff },
      ],
      terrain: {
        tilesetAssetRef: '/assets/tiles/white_palace_platform_tiles.webp',
      },
    })

    expect(getGameplayStageMap('4-1')).toMatchObject({
      backgroundLayers: [
        { id: 'sky', assetRef: '/assets/maps/frostveil_peaks_stage_select.webp' },
        { id: 'far', assetRef: '/assets/maps/frostveil_peaks_stage_select.webp', alpha: 0.32, tint: 0xccefff },
        { id: 'mid', assetRef: '/assets/maps/frostveil_peaks_stage_select.webp', alpha: 0.2, tint: 0xf3fbff },
      ],
    })

    expect(getGameplayStageMap('5-1')).toMatchObject({
      backgroundLayers: [
        { id: 'sky', assetRef: '/assets/maps/emberfall_caldera_stage_select.webp' },
        { id: 'far', assetRef: '/assets/maps/emberfall_caldera_stage_select.webp', alpha: 0.35, tint: 0xff8a4b },
        { id: 'mid', assetRef: '/assets/maps/emberfall_caldera_stage_select.webp', alpha: 0.22, tint: 0xffd19b },
      ],
    })

    expect(getGameplayStageMap('6-1')).toMatchObject({
      backgroundLayers: [
        { id: 'sky', assetRef: '/assets/maps/abyssal_hollow_stage_select.webp' },
        { id: 'far', assetRef: '/assets/maps/abyssal_hollow_stage_select.webp', alpha: 0.34, tint: 0xb58cff },
        { id: 'mid', assetRef: '/assets/maps/abyssal_hollow_stage_select.webp', alpha: 0.22, tint: 0xff8ee8 },
      ],
    })
  })

  it('has copied Emerald Sanctuary gameplay assets into rebuilt public assets', () => {
    expect(readFileSync('public/assets/maps/emerald_sanctuary_sky.webp').byteLength).toBeGreaterThan(0)
    expect(readFileSync('public/assets/maps/emerald_sanctuary_far_bg.webp').byteLength).toBeGreaterThan(0)
    expect(readFileSync('public/assets/maps/emerald_sanctuary_mid_bg_loop.webp').byteLength).toBeGreaterThan(0)
    expect(readFileSync('public/assets/maps/emerald_sanctuary_gameplay_bg.webp').byteLength).toBeGreaterThan(0)
    expect(readFileSync('public/assets/tiles/emerald_sanctuary_platform_tiles.webp').byteLength).toBeGreaterThan(0)
  })
```

Also add this import at the top:

```ts
import { readFileSync } from 'node:fs'
```

- [ ] **Step 8: Run converter and catalog tests and verify GREEN**

Run:

```bash
npm run test -- src/domain/gameplay/gameplayStageMapConverter.test.ts src/domain/gameplay/gameplayStageMaps.test.ts src/domain/gameplay/gameplayStageVisualProfile.test.ts
```

Expected: PASS.

- [ ] **Step 9: Confirm no runtime Prototype boundary violation**

Run:

```bash
rg -n "__prototype__" src/domain/gameplay/gameplayStageMapConverter.ts src/domain/gameplay/gameplayStageMaps.ts src/domain/gameplay/gameplayStageVisualProfile.ts public/assets
```

Expected: no output.

- [ ] **Step 10: Commit converter and catalog wiring slice**

Run:

```bash
git add src/domain/gameplay/gameplayStageSource.ts src/domain/gameplay/gameplayStageMapConverter.ts src/domain/gameplay/gameplayStageMapConverter.test.ts src/domain/gameplay/gameplayStageMaps.ts src/domain/gameplay/gameplayStageMaps.test.ts public/assets/maps/emerald_sanctuary_sky.webp public/assets/maps/emerald_sanctuary_far_bg.webp public/assets/maps/emerald_sanctuary_mid_bg_loop.webp public/assets/maps/emerald_sanctuary_gameplay_bg.webp public/assets/tiles/emerald_sanctuary_platform_tiles.webp
git commit -m "feat: wire gameplay stage visual profiles"
```

Expected: commit includes converter/catalog wiring, tests, and copied rebuilt assets.

---

### Task 3: Renderer Background Presentation

**Files:**
- Modify: `src/ui/gameplay/createGameplayRenderer.ts`
- Modify: `src/ui/gameplay/createGameplayRenderer.test.ts`

- [ ] **Step 1: Write failing renderer test for background alpha and tint**

Modify `src/ui/gameplay/createGameplayRenderer.test.ts`.

First extend `createFakeTileSprite()` to track fields but do not implement setters yet:

```ts
function createFakeTileSprite() {
  const sprite = {
    depth: 0,
    scrollFactor: 0,
    tilePositionX: 0,
    tilePositionY: 0,
    alpha: 1,
    tint: undefined as number | undefined,
    setOrigin: () => sprite,
    setScrollFactor: (value: number) => {
      sprite.scrollFactor = value
      return sprite
    },
    setDepth: (value: number) => {
      sprite.depth = value
      return sprite
    },
    setTilePosition: (x: number, y: number) => {
      sprite.tilePositionX = x
      sprite.tilePositionY = y
      return sprite
    },
  }

  return sprite
}
```

Then add this test near the existing background/render contract tests:

```ts
  it('applies background layer alpha and tint from converted stage data', () => {
    const stage = getGameplayStageMap('3-1')
    expect(stage).toBeDefined()
    if (!stage) return

    const runtime = createSceneRuntime({ stage })

    runtime.scene.preload()
    runtime.scene.create()

    const farLayer = runtime.tileSprites.find((sprite) => sprite.texture === 'far')
    const midLayer = runtime.tileSprites.find((sprite) => sprite.texture === 'mid')

    expect(farLayer).toBeDefined()
    expect(midLayer).toBeDefined()
    if (!farLayer || !midLayer) return

    expect(farLayer.alpha).toBe(0.32)
    expect(farLayer.tint).toBe(0x8be7ff)
    expect(midLayer.alpha).toBe(0.2)
    expect(midLayer.tint).toBe(0xdff8ff)
  })
```

If the fake runtime does not expose `tileSprites`, add `const tileSprites: Array<ReturnType<typeof createFakeTileSprite>> = []`, push every tileSprite result into it, and return it from `createSceneRuntime`.

- [ ] **Step 2: Run renderer test and verify RED**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts -t "background layer alpha and tint"
```

Expected: FAIL because `createBackgroundLayers()` does not apply `alpha` or `tint`, or because fake tile sprites do not yet implement `setAlpha`/`setTint`.

- [ ] **Step 3: Implement renderer data application**

Modify `src/ui/gameplay/createGameplayRenderer.ts` inside `createBackgroundLayers()`:

```ts
  private createBackgroundLayers(): void {
    this.backgroundLayers = this.stageMap.backgroundLayers.map((layer) => {
      const sprite = this.add
        .tileSprite(0, 0, layer.width, layer.height, layer.id)
        .setOrigin(0)
        .setScrollFactor(layer.scrollFactor)
        .setDepth(layer.depth)

      if (layer.alpha !== undefined) {
        sprite.setAlpha(layer.alpha)
      }

      if (layer.tint !== undefined) {
        sprite.setTint(layer.tint)
      }

      return { sprite, parallaxFactor: layer.parallaxFactor }
    })
  }
```

- [ ] **Step 4: Complete fake tile sprite support**

Modify `createFakeTileSprite()` in `src/ui/gameplay/createGameplayRenderer.test.ts`:

```ts
    setAlpha: (value: number) => {
      sprite.alpha = value
      return sprite
    },
    setTint: (value: number) => {
      sprite.tint = value
      return sprite
    },
```

Add `texture` to fake tile sprites by changing the factory to accept an input:

```ts
function createFakeTileSprite(input: { texture: string }) {
  const sprite = {
    texture: input.texture,
    // existing fields...
  }
```

Change tile sprite creation in the fake runtime from:

```ts
tileSprite: () => createFakeTileSprite(),
```

to:

```ts
tileSprite: (_x, _y, _width, _height, texture) => {
  const sprite = createFakeTileSprite({ texture })
  tileSprites.push(sprite)
  return sprite
},
```

Return `tileSprites` from `createSceneRuntime`.

- [ ] **Step 5: Run focused renderer test and verify GREEN**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts -t "background layer alpha and tint"
```

Expected: PASS.

- [ ] **Step 6: Run full renderer test file**

Run:

```bash
npm run test -- src/ui/gameplay/createGameplayRenderer.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit renderer presentation slice**

Run:

```bash
git add src/ui/gameplay/createGameplayRenderer.ts src/ui/gameplay/createGameplayRenderer.test.ts
git commit -m "feat: apply gameplay background presentation"
```

Expected: commit contains only renderer data application and tests.

---

### Task 4: Full Verification And Review

**Files:**
- Verify current branch state.

- [ ] **Step 1: Run full tests**

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

Expected: 0 errors and 0 warnings.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: build succeeds. The existing Vite chunk-size warning is acceptable if unchanged.

- [ ] **Step 4: Run whitespace check**

Run:

```bash
git diff --check
```

Expected: no output.

- [ ] **Step 5: Confirm Prototype boundary**

Run:

```bash
rg -n "__prototype__" src public package.json
```

Expected: no runtime imports or runtime asset paths from `__prototype__`. Test assertions that intentionally reject `__prototype__` are acceptable after inspection.

- [ ] **Step 6: Confirm rebuilt asset files exist**

Run:

```bash
test -s public/assets/maps/emerald_sanctuary_sky.webp
test -s public/assets/maps/emerald_sanctuary_far_bg.webp
test -s public/assets/maps/emerald_sanctuary_mid_bg_loop.webp
test -s public/assets/maps/emerald_sanctuary_gameplay_bg.webp
test -s public/assets/tiles/emerald_sanctuary_platform_tiles.webp
```

Expected: all commands exit 0.

- [ ] **Step 7: Review final diff**

Run:

```bash
git status --short
git diff --stat
git diff -- src/domain/gameplay/gameplayStageVisualProfile.ts src/domain/gameplay/gameplayStageMapConverter.ts src/domain/gameplay/gameplayStageMaps.ts src/ui/gameplay/createGameplayRenderer.ts
```

Expected:

- visual selection is domain data, not renderer theme branching.
- stage maps choose assets through theme visual profiles.
- renderer only applies optional data-driven `alpha` and `tint`.
- runtime code contains no `__prototype__` paths.

- [ ] **Step 8: Commit final verification fixes only when Step 7 shows uncommitted changes**

If Step 7 shows uncommitted fixes, run:

```bash
git add src/domain/gameplay/gameplayStageVisualProfile.ts src/domain/gameplay/gameplayStageVisualProfile.test.ts src/domain/gameplay/gameplayMapTypes.ts src/domain/gameplay/gameplayStageSource.ts src/domain/gameplay/gameplayStageMapConverter.ts src/domain/gameplay/gameplayStageMapConverter.test.ts src/domain/gameplay/gameplayStageMaps.ts src/domain/gameplay/gameplayStageMaps.test.ts src/ui/gameplay/createGameplayRenderer.ts src/ui/gameplay/createGameplayRenderer.test.ts public/assets/maps/emerald_sanctuary_sky.webp public/assets/maps/emerald_sanctuary_far_bg.webp public/assets/maps/emerald_sanctuary_mid_bg_loop.webp public/assets/maps/emerald_sanctuary_gameplay_bg.webp public/assets/tiles/emerald_sanctuary_platform_tiles.webp
git commit -m "chore: finalize gameplay stage visual assets"
```

Expected when Step 7 shows changes: a final fix commit exists and `git status --short` is clean afterward.

If Step 7 shows a clean working tree, do not run `git commit`; record in the task report that no final verification fix commit was needed.
