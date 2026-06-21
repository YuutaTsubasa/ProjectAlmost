import { describe, expect, it } from 'vitest'
import { enemyActorDefinitions } from './enemyActor'
import { playerActorDefinition } from './playerActor'
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

    const enemyAssetRefs = Object.values(enemyActorDefinitions)
      .flatMap((definition) => {
        if (!('sprites' in definition) || !definition.sprites) {
          return []
        }

        return Object.values(definition.sprites)
      })
      .map((sprite) => sprite.assetRef)

    const assetRefs = [
      ...stage.backgroundLayers.map((layer) => layer.assetRef),
      stage.terrain.tilesetAssetRef,
      ...Object.values(playerActorDefinition.sprites).map((sprite) => sprite.assetRef),
      ...enemyAssetRefs,
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
      '/assets/sprites/enemy_guard_walk/sheet-transparent.webp',
      '/assets/sprites/enemy_guard_death/sheet-transparent.webp',
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
})
