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

export type PrototypeStageData = {
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
  enemy: {
    x: number
    y: number
    patrolMinX: number
    patrolMaxX: number
  }
  goal: {
    x: number
    y: number
  }
}

export const prototypeStage: PrototypeStageData = {
  world: {
    width: 1920,
    height: 1080,
    tileSize: 64,
  },
  playerSpawn: {
    x: 360,
    y: 372,
  },
  platforms: [
    { col: 3, row: 7, width: 8, height: 1 },
    { col: 13, row: 8, width: 5, height: 1 },
    { col: 19, row: 6, width: 4, height: 1 },
    { col: 23, row: 5, width: 7, height: 1 },
  ],
  coins: [
    { x: 470, y: 362 },
    { x: 600, y: 362 },
    { x: 745, y: 292 },
    { x: 940, y: 452 },
    { x: 1060, y: 452 },
    { x: 1210, y: 312 },
    { x: 1300, y: 327 },
    { x: 1410, y: 312 },
    { x: 1490, y: 252 },
    { x: 1560, y: 242 },
    { x: 1650, y: 227 },
    { x: 1740, y: 267 },
  ],
  enemy: {
    x: 1010,
    y: 442,
    patrolMinX: 900,
    patrolMaxX: 1120,
  },
  goal: {
    x: 1772,
    y: 272,
  },
}
