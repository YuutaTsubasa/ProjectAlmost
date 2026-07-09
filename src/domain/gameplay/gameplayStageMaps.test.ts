import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { hazardActorDefinitions } from './hazardActor'
import { enemyActorDefinitions } from './enemyActor'
import { checkpointActorDefinition } from './checkpointActor'
import { goalActorDefinition } from './goalActor'
import { playerActorDefinition } from './playerActor'
import { getTileColumnCount, getTileRowCount, validatePlatformBounds } from './terrain'
import type { RankTargets } from './stageResult'
import { stages } from '../data/stages/stageCatalog'
import {
  gameplayStageConversionDiagnostics,
  gameplayStageMaps,
  getGameplayStageMap,
} from './gameplayStageMaps'
import { gameplayStageSources } from './gameplayStageSources'

describe('gameplayStageMaps', () => {
  it('contains the first gameplay stage map', () => {
    expect(gameplayStageMaps.order).toContain('1-1')
    expect(getGameplayStageMap('1-1')?.id).toBe('1-1')
  })

  it('references only root public asset paths', () => {
    const stage = getGameplayStageMap('1-1')
    expect(stage).toBeDefined()
    if (!stage) return

    const enemyAssetRefs = Object.values(enemyActorDefinitions)
      .flatMap((definition) => {
        if (!('sprites' in definition) || !definition.sprites) {
          return []
        }

        return Object.values(definition.sprites)
      })
      .map((sprite) => sprite.assetRef)
    const hazardAssetRefs = Object.values(hazardActorDefinitions)
      .map((definition) => definition.sprite.assetRef)

    const assetRefs = [
      ...stage.backgroundLayers.map((layer) => layer.assetRef),
      stage.terrain.tilesetAssetRef,
      ...Object.values(playerActorDefinition.sprites).map((sprite) => sprite.assetRef),
      ...enemyAssetRefs,
      ...hazardAssetRefs,
      checkpointActorDefinition.sprite.assetRef,
      goalActorDefinition.sprite.assetRef,
    ]

    expect(assetRefs).toEqual([
      '/assets/maps/white_palace_sky.webp',
      '/assets/maps/white_palace_far_bg.webp',
      '/assets/maps/white_palace_mid_bg_loop.webp',
      '/assets/tiles/white_palace_platform_tiles.webp',
      '/assets/sprites/player_idle/sheet-transparent.webp',
      '/assets/sprites/player_run/sheet-transparent.webp',
      '/assets/sprites/player_jump/sheet-transparent.webp',
      '/assets/sprites/player_attack/sheet-transparent.webp',
      '/assets/sprites/player_hurt/sheet-transparent.webp',
      '/assets/sprites/player_death/sheet-transparent.webp',
      '/assets/sprites/enemy_guard_walk/sheet-transparent.webp',
      '/assets/sprites/enemy_guard_death/sheet-transparent.webp',
      '/assets/props/emerald_sanctuary_spikes.webp',
      '/assets/props/white_palace_checkpoint.webp',
      '/assets/props/white_palace_goal_idle.webp',
    ])
    expect(assetRefs.every((assetRef) => assetRef.startsWith('/assets/'))).toBe(true)
    expect(assetRefs.every((assetRef) => !assetRef.includes('__prototype__'))).toBe(true)
  })

  it('uses only supported gameplay enemy types across converted stages', () => {
    const enemyTypes = new Set<string>()

    for (const stageId of gameplayStageMaps.order) {
      const stage = getGameplayStageMap(stageId)
      expect(stage).toBeDefined()
      if (!stage) return

      for (const enemy of stage.enemies) {
        enemyTypes.add(enemy.type)
        expect(enemyActorDefinitions[enemy.type]).toBeDefined()
      }
    }

    expect(enemyTypes).toEqual(new Set(['armor-guard', 'azure-core']))
  })

  it('defines ordered rank targets for the first gameplay stage', () => {
    const stage = getGameplayStageMap('1-1')
    expect(stage).toBeDefined()
    if (!stage) return

    const rankTargets: RankTargets = stage.rankTargets
    expect(rankTargets).toEqual({
      sTime: 30,
      aTime: 42,
      bTime: 58,
      cTime: 78,
    })
    expect(rankTargets.sTime).toBeLessThan(rankTargets.aTime)
    expect(rankTargets.aTime).toBeLessThan(rankTargets.bTime)
    expect(rankTargets.bTime).toBeLessThan(rankTargets.cTime)
  })

  it('keeps gameplay enemy ids unique within the first stage', () => {
    const stage = getGameplayStageMap('1-1')
    expect(stage).toBeDefined()
    if (!stage) return

    const ids = stage.enemies.map((enemy) => enemy.id)

    expect(new Set(ids).size).toBe(ids.length)
  })

  it('places Armor Guard patrol bounds on the authored platform surface', () => {
    const stage = getGameplayStageMap('1-1')
    expect(stage).toBeDefined()
    if (!stage) return

    const guard = stage.enemies.find((enemy) => enemy.type === 'armor-guard')
    expect(guard).toBeDefined()
    if (!guard || guard.type !== 'armor-guard') return

    const platform = stage.terrain.platforms.find(
      (candidate) =>
        candidate.row * stage.world.tileSize === guard.surfaceY &&
        guard.patrolMinX >= candidate.col * stage.world.tileSize &&
        guard.patrolMaxX <= (candidate.col + candidate.width) * stage.world.tileSize,
    )

    expect(platform).toBeDefined()
  })

  it('defines the player spawn on the first platform surface', () => {
    const stage = getGameplayStageMap('1-1')
    expect(stage).toBeDefined()
    if (!stage) return

    expect(stage.player).toEqual({
      actorId: 'player',
      spawn: {
        x: 256,
        surfaceY: 512,
      },
    })
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

  it('returns converted gameplay maps for all 36 normal stages', () => {
    expect(gameplayStageMaps.order).toHaveLength(36)

    for (const stageId of gameplayStageMaps.order) {
      expect(getGameplayStageMap(stageId)?.id).toBe(stageId)
    }
  })

  it('defines collectible coins for the first gameplay stage', () => {
    const stage = getGameplayStageMap('1-1')
    expect(stage).toBeDefined()
    if (!stage) return

    expect(stage.coins).toHaveLength(25)
    expect(stage.coins.slice(0, 2)).toEqual([
      { id: '1-1-coin-001', x: 420, y: 456 },
      { id: '1-1-coin-002', x: 560, y: 456 },
    ])
    expect(stage.coins.at(-1)).toEqual({ id: '1-1-coin-025', x: 9240, y: 456 })
  })

  it('defines fixed hazard data for every gameplay stage map', () => {
    const stage = getGameplayStageMap('1-1')
    expect(stage).toBeDefined()
    if (!stage) return

    expect(stage.hazards).toEqual([])
  })

  it('keeps gameplay coin ids unique within the first stage', () => {
    const stage = getGameplayStageMap('1-1')
    expect(stage).toBeDefined()
    if (!stage) return

    const ids = stage.coins.map((coin) => coin.id)

    expect(new Set(ids).size).toBe(ids.length)
  })

  it('places gameplay coins inside the first stage world bounds', () => {
    const stage = getGameplayStageMap('1-1')
    expect(stage).toBeDefined()
    if (!stage) return

    expect(
      stage.coins.every((coin) =>
        Number.isFinite(coin.x)
        && Number.isFinite(coin.y)
        && coin.x >= 0
        && coin.x <= stage.world.width
        && coin.y >= 0
        && coin.y <= stage.world.height,
      ),
    ).toBe(true)
  })

  it('keeps gameplay hazard ids unique within each stage', () => {
    for (const stageId of gameplayStageMaps.order) {
      const stage = getGameplayStageMap(stageId)
      expect(stage).toBeDefined()
      if (!stage) continue

      const ids = stage.hazards.map((hazard) => hazard.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('places gameplay hazards inside their stage world bounds', () => {
    for (const stageId of gameplayStageMaps.order) {
      const stage = getGameplayStageMap(stageId)
      expect(stage).toBeDefined()
      if (!stage) continue

      expect(
        stage.hazards.every((hazard) =>
          Number.isFinite(hazard.x)
          && Number.isFinite(hazard.surfaceY)
          && hazard.x >= 0
          && hazard.x <= stage.world.width
          && hazard.surfaceY >= 0
          && hazard.surfaceY <= stage.world.height
          && hazard.width > 0
          && hazard.height > 0,
        ),
      ).toBe(true)
    }
  })

  it('defines prototype-inspired checkpoints for the first gameplay stage', () => {
    const stage = getGameplayStageMap('1-1')
    expect(stage).toBeDefined()
    if (!stage) return

    expect(stage.checkpoints).toEqual([
      {
        id: 'combat-gate',
        x: 2540,
        surfaceY: 512,
        spawnX: 2600,
        spawnSurfaceY: 512,
      },
      {
        id: 'final-ascent',
        x: 4320,
        surfaceY: 512,
        spawnX: 4380,
        spawnSurfaceY: 512,
      },
      {
        id: 'final-trial',
        x: 7300,
        surfaceY: 512,
        spawnX: 7360,
        spawnSurfaceY: 512,
      },
    ])
  })

  it('defines the prototype-inspired goal for the first gameplay stage', () => {
    const stage = getGameplayStageMap('1-1')
    expect(stage).toBeDefined()
    if (!stage) return

    expect(stage.goal).toEqual({
      x: 9340,
      surfaceY: 512,
    })
  })

  it('keeps gameplay checkpoint ids unique within each stage', () => {
    for (const stageId of gameplayStageMaps.order) {
      const stage = getGameplayStageMap(stageId)
      expect(stage).toBeDefined()
      if (!stage) continue

      const ids = stage.checkpoints.map((checkpoint) => checkpoint.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('places gameplay checkpoints and respawn points inside their stage world bounds', () => {
    for (const stageId of gameplayStageMaps.order) {
      const stage = getGameplayStageMap(stageId)
      expect(stage).toBeDefined()
      if (!stage) continue

      expect(
        stage.checkpoints.every((checkpoint) =>
          Number.isFinite(checkpoint.x)
          && Number.isFinite(checkpoint.surfaceY)
          && Number.isFinite(checkpoint.spawnX)
          && Number.isFinite(checkpoint.spawnSurfaceY)
          && checkpoint.x >= 0
          && checkpoint.x <= stage.world.width
          && checkpoint.surfaceY >= 0
          && checkpoint.surfaceY <= stage.world.height
          && checkpoint.spawnX >= 0
          && checkpoint.spawnX <= stage.world.width
          && checkpoint.spawnSurfaceY >= 0
          && checkpoint.spawnSurfaceY <= stage.world.height,
        ),
      ).toBe(true)
    }
  })

  it('places gameplay goals inside their stage world bounds', () => {
    for (const stageId of gameplayStageMaps.order) {
      const stage = getGameplayStageMap(stageId)
      expect(stage).toBeDefined()
      if (!stage) continue

      expect(Number.isFinite(stage.goal.x)).toBe(true)
      expect(Number.isFinite(stage.goal.surfaceY)).toBe(true)
      expect(stage.goal.x).toBeGreaterThanOrEqual(0)
      expect(stage.goal.x).toBeLessThanOrEqual(stage.world.width)
      expect(stage.goal.surfaceY).toBeGreaterThanOrEqual(0)
      expect(stage.goal.surfaceY).toBeLessThanOrEqual(stage.world.height)
    }
  })

  it('places the first gameplay goal on an authored platform surface', () => {
    const stage = getGameplayStageMap('1-1')
    expect(stage).toBeDefined()
    if (!stage) return

    const platform = stage.terrain.platforms.find(
      (candidate) =>
        candidate.row * stage.world.tileSize === stage.goal.surfaceY
        && stage.goal.x >= candidate.col * stage.world.tileSize
        && stage.goal.x <= (candidate.col + candidate.width) * stage.world.tileSize,
    )

    expect(platform).toBeDefined()
  })

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

  it('preserves prototype enemy metadata in gameplay stage sources', () => {
    const thornCore = gameplayStageSources.items['2-1'].enemies.find((enemy) => enemy.id === 'thorn-core-a')
    const approachCore = gameplayStageSources.items['1-6'].enemies.find((enemy) => enemy.id === 'approach-core-1')

    expect(thornCore).toMatchObject({
      id: 'thorn-core-a',
      type: 'azure-core',
      respawnPolicy: 'regenerate',
      countsForScore: false,
    })
    expect(approachCore).toMatchObject({
      id: 'approach-core-1',
      type: 'azure-core',
      respawnDelayMs: 650,
    })
  })

  it('preserves boss-prototype metadata in boss source stages', () => {
    for (const stageId of ['2-6', '3-6', '4-6', '5-6', '6-6'] as const) {
      const bossPrototype = gameplayStageSources.items[stageId].enemies.find(
        ({ id }) => id === 'boss-prototype',
      )

      expect(bossPrototype).toMatchObject({
        id: 'boss-prototype',
        type: 'azure-core',
        respawnPolicy: 'persistent',
        countsForScore: true,
      })
    }
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
})
