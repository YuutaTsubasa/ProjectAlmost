import { describe, expect, it } from 'vitest'
import { hazardActorDefinitions } from './hazardActor'
import { enemyActorDefinitions } from './enemyActor'
import { checkpointActorDefinition } from './checkpointActor'
import { goalActorDefinition } from './goalActor'
import { playerActorDefinition } from './playerActor'
import { getTileColumnCount, getTileRowCount, validatePlatformBounds } from './terrain'
import type { RankTargets } from './stageResult'
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

  it('defines both baseline enemy types for the first gameplay stage', () => {
    const stage = getGameplayStageMap('1-1')
    expect(stage).toBeDefined()
    if (!stage) return

    expect(stage.enemies).toEqual([
      {
        id: 'first-armor-guard',
        type: 'armor-guard',
        x: 720,
        surfaceY: 512,
        patrolMinX: 608,
        patrolMaxX: 832,
      },
      {
        id: 'first-azure-core',
        type: 'azure-core',
        x: 1760,
        y: 320,
        patrolMinX: 1760,
        patrolMaxX: 1760,
      },
    ])
  })

  it('defines ordered rank targets for the first gameplay stage', () => {
    const stage = getGameplayStageMap('1-1')
    expect(stage).toBeDefined()
    if (!stage) return

    const rankTargets: RankTargets = stage.rankTargets
    expect(rankTargets).toEqual({
      sTime: 80,
      aTime: 100,
      bTime: 125,
      cTime: 150,
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

  it('does not return a map for stages outside this slice', () => {
    expect(getGameplayStageMap('1-2')).toBeUndefined()
  })

  it('defines collectible coins for the first gameplay stage', () => {
    const stage = getGameplayStageMap('1-1')
    expect(stage).toBeDefined()
    if (!stage) return

    expect(stage.coins).toEqual([
      { id: 'coin-start-1', x: 320, y: 430 },
      { id: 'coin-start-2', x: 384, y: 430 },
      { id: 'coin-homing-line-1', x: 1680, y: 320 },
      { id: 'coin-homing-line-2', x: 1720, y: 320 },
      { id: 'coin-route-1', x: 1504, y: 430 },
    ])
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
})
