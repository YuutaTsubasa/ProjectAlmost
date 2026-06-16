export type PlatformRect = {
  col: number
  row: number
  width: number
  height: number
}

export type StageTheme = 'white-palace' | 'emerald-sanctuary' | 'cerulean-depths' | 'frostveil-peaks' | 'emberfall-caldera' | 'abyssal-hollow'

export type HazardRect = {
  id: string
  type: 'spikes' | 'lava'
  x: number
  surfaceY: number
  width: number
  height: number
  orientation?: 'floor' | 'ceiling' | 'left-wall' | 'right-wall'
}

export type MovingPlatformRect = {
  id: string
  col: number
  row: number
  width: number
  height: number
  axis: 'x' | 'y'
  distance: number
  durationMs: number
  phase?: number
}

export type GravityZone = {
  id: string
  x: number
  y: number
  width: number
  height: number
  direction: 'down' | 'up'
}

export type SurfaceZone = {
  id: string
  type: 'ice'
  x: number
  y: number
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
  spawnGravity?: 'down' | 'up'
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
  theme?: StageTheme
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
    gravity?: 'down' | 'up'
  }
  platforms: PlatformRect[]
  movingPlatforms?: MovingPlatformRect[]
  hazards?: HazardRect[]
  gravityZones?: GravityZone[]
  surfaceZones?: SurfaceZone[]
  coins: CoinPoint[]
  enemies: EnemyPoint[]
  checkpoints: CheckpointPoint[]
  sections: StageSection[]
  goal: {
    x: number
    surfaceY: number
  }
}
