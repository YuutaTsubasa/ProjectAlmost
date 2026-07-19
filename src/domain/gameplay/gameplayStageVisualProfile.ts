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
    terrainTilesetAssetRef: '/assets/tiles/emerald_sanctuary_platform_tiles_surface_aligned.webp',
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
