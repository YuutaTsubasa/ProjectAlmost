import { describe, expect, it } from 'vitest'
import { projectData } from '../data/projectData'
import { getGameplayStageMap } from '../gameplay/gameplayStageMaps'
import {
  buildBootPreloadPlan,
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
    expect(sources).toContain('/assets/sprites/enemy_guard_walk/sheet-transparent.webp')
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

  it('includes boss assets and boss music for boss stages', () => {
    const stage = getGameplayStageMap('1-6')

    expect(stage).toBeDefined()
    const sources = buildStagePreloadPlan(projectData, stage!).map((asset) => asset.source)

    expect(sources).toContain('/assets/sprites/boss_priestess_cast/sheet-transparent.webp')
    expect(sources).toContain('/assets/sprites/boss_priestess_hurt/sheet-transparent.webp')
    expect(sources).toContain('/assets/sprites/boss_priestess_death/sheet-transparent.webp')
    expect(sources).toContain('/assets/audio/world01_boss.mp3')
  })
})
