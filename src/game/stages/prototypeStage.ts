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

export type EnemyPoint = {
  id: string
  x: number
  y: number
  patrolMinX: number
  patrolMaxX: number
}

export type CheckpointPoint = {
  id: string
  x: number
  y: number
  spawnX: number
  spawnY: number
}

export type StageSection = {
  id: string
  startX: number
  endX: number
  purpose: string
}

export type PrototypeStageData = {
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
    y: number
  }
  platforms: PlatformRect[]
  coins: CoinPoint[]
  enemies: EnemyPoint[]
  checkpoints: CheckpointPoint[]
  sections: StageSection[]
  goal: {
    x: number
    y: number
  }
}

export const prototypeStage: PrototypeStageData = {
  objective: 'Reach the Goal',
  rankTargets: {
    sTime: 20,
    aTime: 30,
    bTime: 45,
    cTime: 60,
  },
  world: {
    width: 6400,
    height: 1080,
    tileSize: 64,
  },
  playerSpawn: {
    x: 256,
    y: 436,
  },
  platforms: [
    { col: 2, row: 8, width: 12, height: 1 },
    { col: 16, row: 8, width: 5, height: 1 },
    { col: 23, row: 7, width: 4, height: 1 },
    { col: 30, row: 8, width: 5, height: 1 },
    { col: 38, row: 8, width: 13, height: 1 },
    { col: 54, row: 7, width: 3, height: 1 },
    { col: 59, row: 6, width: 3, height: 1 },
    { col: 65, row: 8, width: 12, height: 1 },
    { col: 80, row: 7, width: 4, height: 1 },
    { col: 86, row: 6, width: 4, height: 1 },
    { col: 92, row: 5, width: 7, height: 1 },
  ],
  coins: [
    { x: 420, y: 456 }, { x: 560, y: 456 }, { x: 700, y: 456 },
    { x: 1100, y: 456 }, { x: 1540, y: 392 }, { x: 2000, y: 456 },
    { x: 2540, y: 456 }, { x: 2740, y: 456 }, { x: 2940, y: 456 },
    { x: 3520, y: 392 }, { x: 3840, y: 328 }, { x: 4280, y: 456 },
    { x: 4700, y: 456 }, { x: 5200, y: 392 }, { x: 5580, y: 328 },
    { x: 5960, y: 264 }, { x: 6160, y: 264 },
  ],
  enemies: [
    { id: 'first-guard', x: 2700, y: 442, patrolMinX: 2520, patrolMaxX: 3060 },
    { id: 'homing-perch-a', x: 3552, y: 378, patrolMinX: 3500, patrolMaxX: 3604 },
    { id: 'homing-perch-b', x: 3840, y: 314, patrolMinX: 3800, patrolMaxX: 3880 },
    { id: 'final-guard', x: 5600, y: 314, patrolMinX: 5520, patrolMaxX: 5680 },
  ],
  checkpoints: [
    { id: 'combat-gate', x: 2440, y: 512, spawnX: 2490, spawnY: 436 },
    { id: 'final-ascent', x: 4220, y: 512, spawnX: 4280, spawnY: 436 },
  ],
  sections: [
    { id: 'safe-start', startX: 0, endX: 900, purpose: 'Movement and jump introduction' },
    { id: 'jump-school', startX: 900, endX: 2380, purpose: 'Basic platforming and coin routing' },
    { id: 'first-combat', startX: 2380, endX: 3260, purpose: 'First grounded enemy encounter' },
    { id: 'homing-crossing', startX: 3260, endX: 4220, purpose: 'Homing Attack traversal lesson' },
    { id: 'final-ascent', startX: 4220, endX: 6400, purpose: 'Combined movement and final goal' },
  ],
  goal: {
    x: 6220,
    y: 272,
  },
}
