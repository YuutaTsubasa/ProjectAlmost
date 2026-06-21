import type { StageId } from '../data/worlds/worldTypes'

export type GameplayTheme = 'white-palace'

export type GameplayStageMap = {
  id: StageId
  theme: GameplayTheme
  world: {
    width: number
    height: number
    tileSize: number
  }
  backgroundLayers: readonly BackgroundLayer[]
  player: GameplayPlayerSpawn
  enemies: readonly GameplayEnemySpawn[]
  terrain: TerrainDefinition
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
