import type { StageId } from '../data/worlds/worldTypes'
import type { RankTargets } from './stageResult'

export type GameplayTheme = 'white-palace'
  | 'emerald-sanctuary'
  | 'cerulean-depths'
  | 'frostveil-peaks'
  | 'emberfall-caldera'
  | 'abyssal-hollow'

export type GameplayStageMap = {
  id: StageId
  theme: GameplayTheme
  world: {
    width: number
    height: number
    tileSize: number
  }
  rankTargets: RankTargets
  backgroundLayers: readonly BackgroundLayer[]
  player: GameplayPlayerSpawn
  enemies: readonly GameplayEnemySpawn[]
  coins: readonly GameplayCoinPoint[]
  hazards: readonly GameplayHazardSpawn[]
  checkpoints: readonly GameplayCheckpointSpawn[]
  goal: GameplayGoalSpawn
  terrain: TerrainDefinition
}

export type GameplayCoinPoint = {
  id: string
  x: number
  y: number
}

export type GameplayHazardSpawn = {
  id: string
  type: 'spikes'
  x: number
  surfaceY: number
  width: number
  height: number
  orientation?: 'floor' | 'ceiling' | 'left-wall' | 'right-wall'
}

export type GameplayCheckpointSpawn = {
  id: string
  x: number
  surfaceY: number
  spawnX: number
  spawnSurfaceY: number
  spawnGravity?: 'down' | 'up'
}

export type GameplayGoalSpawn = {
  x: number
  surfaceY: number
}

export type GameplayPlayerSpawn = {
  actorId: 'player'
  spawn: {
    x: number
    surfaceY: number
  }
}

export type GameplayEnemySpawn = ArmorGuardSpawn | AzureCoreSpawn

export type ArmorGuardSpawn = {
  id: string
  type: 'armor-guard'
  x: number
  surfaceY: number
  patrolMinX: number
  patrolMaxX: number
}

export type AzureCoreSpawn = {
  id: string
  type: 'azure-core'
  x: number
  y: number
  patrolMinX: number
  patrolMaxX: number
}

export type BackgroundLayer = {
  id: string
  assetRef: string
  width: number
  height: number
  depth: number
  scrollFactor: number
  parallaxFactor: number
}

export type TerrainDefinition = {
  tilesetAssetRef: string
  solidTileIndexes: readonly number[]
  platforms: readonly PlatformRect[]
}

export type PlatformRect = {
  col: number
  row: number
  width: number
  height: number
}
