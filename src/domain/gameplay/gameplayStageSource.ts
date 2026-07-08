import type { StageId } from '../data/worlds/worldTypes'
import type { GameplayTheme } from './gameplayMapTypes'
import type { RankTargets } from './stageResult'

export type GameplayStageSourceTheme =
  | 'white-palace'
  | 'emerald-sanctuary'
  | 'cerulean-depths'
  | 'frostveil-peaks'
  | 'emberfall-caldera'
  | 'abyssal-hollow'

export type GameplayStageSource = {
  id: StageId
  theme?: GameplayStageSourceTheme
  rankTargets: RankTargets
  world: {
    width: number
    height: number
    tileSize: number
  }
  playerSpawn: {
    x: number
    surfaceY: number
    gravity?: 'down' | 'up'
  }
  platforms: readonly GameplayStageSourcePlatform[]
  movingPlatforms?: readonly GameplayStageSourceMovingPlatform[]
  hazards?: readonly GameplayStageSourceHazard[]
  gravityZones?: readonly GameplayStageSourceGravityZone[]
  surfaceZones?: readonly GameplayStageSourceSurfaceZone[]
  coins: readonly GameplayStageSourceCoin[]
  enemies: readonly GameplayStageSourceEnemy[]
  checkpoints: readonly GameplayStageSourceCheckpoint[]
  goal: {
    x: number
    surfaceY: number
  }
}

export type GameplayStageSourcePlatform = {
  col: number
  row: number
  width: number
  height: number
}

export type GameplayStageSourceMovingPlatform = GameplayStageSourcePlatform & {
  id: string
  axis: 'x' | 'y'
  distance: number
  durationMs: number
  phase?: number
}

export type GameplayStageSourceHazard = {
  id: string
  type: 'spikes' | 'lava'
  x: number
  surfaceY: number
  width: number
  height: number
  orientation?: 'floor' | 'ceiling' | 'left-wall' | 'right-wall'
}

export type GameplayStageSourceGravityZone = {
  id: string
  x: number
  y: number
  width: number
  height: number
  direction: 'down' | 'up'
}

export type GameplayStageSourceSurfaceZone = {
  id: string
  type: 'ice'
  x: number
  y: number
  width: number
  height: number
}

export type GameplayStageSourceCoin = {
  x: number
  y: number
}

export type GameplayStageSourceGuardEnemy = {
  id: string
  type?: 'guard'
  x: number
  surfaceY: number
  patrolMinX: number
  patrolMaxX: number
}

export type GameplayStageSourceAzureCoreEnemy = {
  id: string
  type: 'azure-core'
  respawnPolicy?: 'persistent' | 'regenerate'
  respawnDelayMs?: number
  countsForScore?: boolean
  x: number
  y: number
  patrolMinX: number
  patrolMaxX: number
}

export type GameplayStageSourceEnemy =
  | GameplayStageSourceGuardEnemy
  | GameplayStageSourceAzureCoreEnemy

export type GameplayStageSourceCheckpoint = {
  id: string
  x: number
  surfaceY: number
  spawnX: number
  spawnSurfaceY: number
  spawnGravity?: 'down' | 'up'
}

export type GameplayStageConversionDiagnosticCode =
  | 'unsupported-moving-platform'
  | 'unsupported-gravity-zone'
  | 'unsupported-surface-zone'
  | 'unsupported-hazard'
  | 'theme-asset-fallback'

export type GameplayStageConversionDiagnostic = {
  stageId: StageId
  code: GameplayStageConversionDiagnosticCode
  sourceId?: string
  message: string
}

export type GameplayThemeAssets = {
  backgroundLayers: readonly [
    { id: 'sky'; assetRef: string },
    { id: 'far'; assetRef: string },
    { id: 'mid'; assetRef: string },
  ]
  terrainTilesetAssetRef: string
  fallback?: true
}

export const defaultGameplayThemeAssets: Record<GameplayStageSourceTheme, GameplayThemeAssets> = {
  'white-palace': {
    backgroundLayers: [
      { id: 'sky', assetRef: '/assets/maps/white_palace_sky.webp' },
      { id: 'far', assetRef: '/assets/maps/white_palace_far_bg.webp' },
      { id: 'mid', assetRef: '/assets/maps/white_palace_mid_bg_loop.webp' },
    ],
    terrainTilesetAssetRef: '/assets/tiles/white_palace_platform_tiles.webp',
  },
  'emerald-sanctuary': {
    backgroundLayers: [
      { id: 'sky', assetRef: '/assets/maps/white_palace_sky.webp' },
      { id: 'far', assetRef: '/assets/maps/white_palace_far_bg.webp' },
      { id: 'mid', assetRef: '/assets/maps/white_palace_mid_bg_loop.webp' },
    ],
    terrainTilesetAssetRef: '/assets/tiles/white_palace_platform_tiles.webp',
    fallback: true,
  },
  'cerulean-depths': {
    backgroundLayers: [
      { id: 'sky', assetRef: '/assets/maps/white_palace_sky.webp' },
      { id: 'far', assetRef: '/assets/maps/white_palace_far_bg.webp' },
      { id: 'mid', assetRef: '/assets/maps/white_palace_mid_bg_loop.webp' },
    ],
    terrainTilesetAssetRef: '/assets/tiles/white_palace_platform_tiles.webp',
    fallback: true,
  },
  'frostveil-peaks': {
    backgroundLayers: [
      { id: 'sky', assetRef: '/assets/maps/white_palace_sky.webp' },
      { id: 'far', assetRef: '/assets/maps/white_palace_far_bg.webp' },
      { id: 'mid', assetRef: '/assets/maps/white_palace_mid_bg_loop.webp' },
    ],
    terrainTilesetAssetRef: '/assets/tiles/white_palace_platform_tiles.webp',
    fallback: true,
  },
  'emberfall-caldera': {
    backgroundLayers: [
      { id: 'sky', assetRef: '/assets/maps/white_palace_sky.webp' },
      { id: 'far', assetRef: '/assets/maps/white_palace_far_bg.webp' },
      { id: 'mid', assetRef: '/assets/maps/white_palace_mid_bg_loop.webp' },
    ],
    terrainTilesetAssetRef: '/assets/tiles/white_palace_platform_tiles.webp',
    fallback: true,
  },
  'abyssal-hollow': {
    backgroundLayers: [
      { id: 'sky', assetRef: '/assets/maps/white_palace_sky.webp' },
      { id: 'far', assetRef: '/assets/maps/white_palace_far_bg.webp' },
      { id: 'mid', assetRef: '/assets/maps/white_palace_mid_bg_loop.webp' },
    ],
    terrainTilesetAssetRef: '/assets/tiles/white_palace_platform_tiles.webp',
    fallback: true,
  },
}

export function toGameplayTheme(theme: GameplayStageSourceTheme): GameplayTheme {
  return theme
}
