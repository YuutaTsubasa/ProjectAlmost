export type PlatformRect = {
  col: number
  row: number
  width: number
  height: number
}

export type CoinPoint = {
  x: number
  y: number
}

export type GuardEnemyPoint = {
  id: string
  type?: 'guard'
  respawnPolicy?: 'persistent' | 'regenerate'
  countsForScore?: boolean
  respawnDelayMs?: number
  x: number
  surfaceY: number
  patrolMinX: number
  patrolMaxX: number
}

export type AzureCoreEnemyPoint = {
  id: string
  type: 'azure-core'
  respawnPolicy?: 'persistent' | 'regenerate'
  countsForScore?: boolean
  respawnDelayMs?: number
  x: number
  y: number
  patrolMinX: number
  patrolMaxX: number
}

export type EnemyPoint = GuardEnemyPoint | AzureCoreEnemyPoint

export type CheckpointPoint = {
  id: string
  x: number
  surfaceY: number
  spawnX: number
  spawnSurfaceY: number
}

export type StageSection = {
  id: string
  startX: number
  endX: number
  purpose: string
}

export type StageData = {
  id: string
  subtitle: string
  objective: string
  rankTargets: {
    sTime: number
    aTime: number
    bTime: number
    cTime: number
  }
  world: {
    width: number
    height: number
    tileSize: number
  }
  playerSpawn: {
    x: number
    surfaceY: number
  }
  platforms: PlatformRect[]
  coins: CoinPoint[]
  enemies: EnemyPoint[]
  checkpoints: CheckpointPoint[]
  sections: StageSection[]
  goal: {
    x: number
    surfaceY: number
  }
}
