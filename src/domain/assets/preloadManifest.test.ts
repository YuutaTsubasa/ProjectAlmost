import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { projectData } from '../data/projectData'
import type { GameplayStageMap } from '../gameplay/gameplayMapTypes'
import { getGameplayStageMap } from '../gameplay/gameplayStageMaps'
import {
  buildBootPreloadPlan,
  buildGameplayEntryPreloadPlan,
  buildSharedGameplayPreloadPlan,
  buildStagePreloadPlan,
  collectRuntimeAssetSources,
} from './preloadManifest'

describe('preload manifest', () => {
  it('collects only rebuild-owned runtime asset paths', () => {
    const sources = collectRuntimeAssetSources(projectData)

    expect(sources.length).toBeGreaterThan(40)
    expect(sources.every((source) => source.startsWith('/assets/'))).toBe(true)
    expect(sources.every((source) => !source.includes('__prototype__'))).toBe(true)
    expect(new Set(sources).size).toBe(sources.length)
  })

  it('builds a boot plan with title, font, ui sfx, title music, and world select assets', () => {
    const plan = buildBootPreloadPlan(projectData)
    const sources = plan.map((asset) => asset.source)

    expect(sources).toContain('/assets/title/project-almost-title-background.webp')
    expect(sources).toContain('/assets/audio/titlescreen.mp3')
    expect(sources).toContain('/assets/audio/sfx/ui-confirm.wav')
    expect(sources).toContain('/assets/fonts/rajdhani-latin-700.woff2')
    expect(sources).toContain('/assets/maps/white_palace_stage_select.webp')
    expect(sources).toContain('/assets/maps/abyssal_hollow_stage_select.webp')
    expect(new Set(sources).size).toBe(sources.length)
  })

  it('builds a shared gameplay plan with common player, prop, hud, tile, sfx, and result assets', () => {
    const plan = buildSharedGameplayPreloadPlan()
    const sources = plan.map((asset) => asset.source)

    expect(sources).toContain('/assets/sprites/player_idle/sheet-transparent.webp')
    expect(sources).not.toContain('/assets/sprites/enemy_guard_walk/sheet-transparent.webp')
    expect(sources).not.toContain('/assets/sprites/enemy_guard_death/sheet-transparent.webp')
    expect(sources).not.toContain('/assets/sprites/thorn_beetle_walk/sheet-transparent.webp')
    expect(sources).not.toContain('/assets/sprites/thorn_beetle_death/sheet-transparent.webp')
    expect(sources).not.toContain('/assets/sprites/seed_lantern_idle/sheet-transparent.webp')
    expect(sources).toContain('/assets/props/white_palace_checkpoint.webp')
    expect(sources).toContain('/assets/hud/player-portrait.webp')
    expect(sources).toContain('/assets/results/yuuta-stage-result-standee.webp')
    expect(sources).toContain('/assets/tiles/white_palace_platform_tiles.webp')
    expect(sources).toContain('/assets/audio/sfx/hit.wav')
    expect(sources).toContain('/assets/audio/game_result.mp3')
    expect(new Set(sources).size).toBe(sources.length)
  })

  it('builds a stage plan with selected stage visuals and world music', () => {
    const stage = getGameplayStageMap('2-1')

    expect(stage).toBeDefined()
    const plan = buildStagePreloadPlan(projectData, stage!)
    const sources = plan.map((asset) => asset.source)

    expect(sources).toContain('/assets/maps/emerald_sanctuary_sky.webp')
    expect(sources).toContain('/assets/maps/emerald_sanctuary_far_bg.webp')
    expect(sources).toContain('/assets/maps/emerald_sanctuary_mid_bg_loop.webp')
    expect(sources).toContain('/assets/tiles/emerald_sanctuary_platform_tiles_surface_aligned.webp')
    expect(sources).toContain('/assets/audio/world02_bgm.mp3')
    expect(new Set(sources).size).toBe(sources.length)
  })

  it('uses visual asset refs from the supplied gameplay stage map', () => {
    const stage = getGameplayStageMap('2-1')

    expect(stage).toBeDefined()
    const customizedStage = {
      ...stage!,
      backgroundLayers: stage!.backgroundLayers.map((layer, index) => ({
        ...layer,
        assetRef: `/assets/maps/custom-stage-layer-${index}.webp`,
      })),
      terrain: {
        ...stage!.terrain,
        tilesetAssetRef: '/assets/tiles/custom-stage-tiles.webp',
      },
    }
    const sources = buildStagePreloadPlan(projectData, customizedStage).map((asset) => asset.source)

    expect(sources).toContain('/assets/maps/custom-stage-layer-0.webp')
    expect(sources).toContain('/assets/maps/custom-stage-layer-1.webp')
    expect(sources).toContain('/assets/maps/custom-stage-layer-2.webp')
    expect(sources).toContain('/assets/tiles/custom-stage-tiles.webp')
    expect(sources).not.toContain('/assets/maps/emerald_sanctuary_sky.webp')
  })

  it('includes stage enemy sprite assets from the supplied gameplay stage map', () => {
    const stage = getGameplayStageMap('1-1')
    expect(stage).toBeDefined()
    const customizedStage: GameplayStageMap = {
      ...stage!,
      enemies: [
        {
          id: 'beetle-a',
          type: 'thorn-beetle',
          x: 520,
          surfaceY: 640,
          patrolMinX: 420,
          patrolMaxX: 620,
        },
        {
          id: 'lantern-a',
          type: 'seed-lantern',
          x: 900,
          y: 420,
          patrolMinX: 900,
          patrolMaxX: 900,
        },
      ],
    }
    const sources = buildGameplayEntryPreloadPlan(projectData, customizedStage).map((asset) => asset.source)

    expect(sources).toContain('/assets/sprites/thorn_beetle_walk/sheet-transparent.webp')
    expect(sources).toContain('/assets/sprites/thorn_beetle_death/sheet-transparent.webp')
    expect(sources).toContain('/assets/sprites/seed_lantern_idle/sheet-transparent.webp')
  })

  it('loads first-world enemy sprite assets from stage-specific preload', () => {
    const stage = getGameplayStageMap('1-1')

    expect(stage).toBeDefined()
    const sources = buildStagePreloadPlan(projectData, stage!).map((asset) => asset.source)

    expect(sources).toContain('/assets/sprites/enemy_guard_walk/sheet-transparent.webp')
    expect(sources).toContain('/assets/sprites/enemy_guard_death/sheet-transparent.webp')
  })

  it('includes every world map music track in collected runtime sources', () => {
    const sources = collectRuntimeAssetSources(projectData)

    for (const worldId of projectData.worlds.order) {
      expect(sources).toContain(projectData.worlds.items[worldId].musicRefs.map)
    }
  })

  it('de-duplicates repeated background assets within a stage plan', () => {
    const stage = getGameplayStageMap('3-1')

    expect(stage).toBeDefined()
    const sources = buildStagePreloadPlan(projectData, stage!).map((asset) => asset.source)
    const repeatedBackground = '/assets/maps/cerulean_depths_stage_select.webp'

    expect(stage!.backgroundLayers.filter((layer) => layer.assetRef === repeatedBackground)).toHaveLength(3)
    expect(sources.filter((source) => source === repeatedBackground)).toHaveLength(1)
  })

  it('rejects invalid runtime asset sources instead of silently omitting them', () => {
    const stage = getGameplayStageMap('2-1')

    expect(stage).toBeDefined()

    const prototypeStage = {
      ...stage!,
      terrain: { ...stage!.terrain, tilesetAssetRef: '/__prototype__/public/tiles/legacy.webp' },
    }
    const externalStage = {
      ...stage!,
      terrain: { ...stage!.terrain, tilesetAssetRef: 'https://example.com/tiles.webp' },
    }

    expect(() => buildStagePreloadPlan(projectData, prototypeStage)).toThrow(/invalid runtime asset source/i)
    expect(() => buildStagePreloadPlan(projectData, externalStage)).toThrow(/invalid runtime asset source/i)
  })

  it('throws clear errors when project data is missing stage or world records', () => {
    const stage = getGameplayStageMap('2-1')

    expect(stage).toBeDefined()

    const orphanStage = { ...stage!, id: 'missing-stage' } as unknown as GameplayStageMap
    const missingWorldProject = {
      ...projectData,
      stages: {
        ...projectData.stages,
        items: {
          ...projectData.stages.items,
          [stage!.id]: {
            ...projectData.stages.items[stage!.id],
            worldId: 'missing-world',
          },
        },
      },
    } as typeof projectData

    expect(() => buildStagePreloadPlan(projectData, orphanStage)).toThrow(
      'Missing preload stage data for stage missing-stage',
    )
    expect(() => buildStagePreloadPlan(missingWorldProject, stage!)).toThrow(
      'Missing preload world data for world missing-world',
    )
  })

  it('throws a clear error when boot preload references a missing world record', () => {
    const missingWorldProject = {
      ...projectData,
      worlds: {
        ...projectData.worlds,
        order: ['missing-world', ...projectData.worlds.order],
      },
    } as typeof projectData

    expect(() => buildBootPreloadPlan(missingWorldProject)).toThrow(
      'Missing boot preload world data for world missing-world',
    )
  })

  it('includes boss assets and boss music for boss stages', () => {
    const stage = getGameplayStageMap('1-6')

    expect(stage).toBeDefined()
    const sources = buildStagePreloadPlan(projectData, stage!).map((asset) => asset.source)

    expect(sources).toContain('/assets/sprites/boss_priestess_cast/sheet-transparent.webp')
    expect(sources).toContain('/assets/sprites/boss_priestess_hurt/sheet-transparent.webp')
    expect(sources).toContain('/assets/sprites/boss_priestess_death/sheet-transparent.webp')
    expect(sources).toContain('/assets/audio/world01_boss.mp3')
  })

  it('has imported AVG portrait assets under rebuild public assets', () => {
    const avgPortraitSources = [
      '/assets/avg/yuuta-dialogue.webp',
      '/assets/avg/white-priestess-dialogue.webp',
    ]

    for (const source of avgPortraitSources) {
      expect(readFileSync(`public${source}`, 'utf8').length).toBeGreaterThan(0)
    }
  })

  it('includes AVG portraits in runtime sources and 1-6 gameplay entry preload plan', () => {
    const stage = getGameplayStageMap('1-6')

    expect(stage).toBeDefined()
    const runtimeSources = collectRuntimeAssetSources(projectData)
    const entrySources = buildGameplayEntryPreloadPlan(projectData, stage!).map((asset) => asset.source)

    expect(runtimeSources).toContain('/assets/avg/yuuta-dialogue.webp')
    expect(runtimeSources).toContain('/assets/avg/white-priestess-dialogue.webp')
    expect(entrySources).toContain('/assets/avg/yuuta-dialogue.webp')
    expect(entrySources).toContain('/assets/avg/white-priestess-dialogue.webp')
    expect(runtimeSources.every((source) => !source.includes('__prototype__'))).toBe(true)
  })

  it('builds gameplay entry plans with source de-duplication before progress totals are presented', () => {
    const stage = getGameplayStageMap('2-1')

    expect(stage).toBeDefined()

    const sharedPlan = buildSharedGameplayPreloadPlan()
    const stagePlan = buildStagePreloadPlan(projectData, stage!)
    const entryPlan = buildGameplayEntryPreloadPlan(projectData, stage!)
    const entrySources = entryPlan.map((asset) => asset.source)

    expect(sharedPlan.map((asset) => asset.source)).toContain(stage!.terrain.tilesetAssetRef)
    expect(stagePlan.map((asset) => asset.source)).toContain(stage!.terrain.tilesetAssetRef)
    expect(entryPlan.length).toBeLessThan(sharedPlan.length + stagePlan.length)
    expect(new Set(entrySources).size).toBe(entrySources.length)
  })
})
