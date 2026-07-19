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

  it('uses Emerald Sanctuary gameplay backgrounds with rebuild-aligned terrain tiles', () => {
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
      terrainTilesetAssetRef: '/assets/tiles/emerald_sanctuary_platform_tiles_surface_aligned.webp',
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
