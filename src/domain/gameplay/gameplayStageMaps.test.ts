import { describe, expect, it } from 'vitest'
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

    const assetRefs = [
      ...stage.backgroundLayers.map((layer) => layer.assetRef),
      stage.terrain.tilesetAssetRef,
      playerActorDefinition.sprites.idle.assetRef,
      playerActorDefinition.sprites.run.assetRef,
    ]

    expect(assetRefs).toEqual([
      '/assets/maps/white_palace_sky.webp',
      '/assets/maps/white_palace_far_bg.webp',
      '/assets/maps/white_palace_mid_bg_loop.webp',
      '/assets/tiles/white_palace_platform_tiles.webp',
      '/assets/sprites/player_idle/sheet-transparent.webp',
      '/assets/sprites/player_run/sheet-transparent.webp',
    ])
    expect(assetRefs.every((assetRef) => assetRef.startsWith('/assets/'))).toBe(true)
    expect(assetRefs.every((assetRef) => !assetRef.includes('__prototype__'))).toBe(true)
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
