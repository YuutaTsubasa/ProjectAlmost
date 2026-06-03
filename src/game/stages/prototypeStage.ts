export type PlatformRect = {
  col: number
  row: number
  width: number
  height: number
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
    height: 720,
    tileSize: 32,
  },
  playerSpawn: {
    x: 140,
    y: 560,
  },
  platforms: [
    { col: 0, row: 20, width: 30, height: 2 },
    { col: 28, row: 20, width: 21, height: 2 },
    { col: 11, row: 15, width: 7, height: 1 },
    { col: 22, row: 13, width: 8, height: 1 },
    { col: 35, row: 16, width: 9, height: 1 },
    { col: 47, row: 13, width: 9, height: 1 },
  ],
  enemy: {
    x: 1260,
    y: 470,
    patrolMinX: 1140,
    patrolMaxX: 1360,
  },
  goal: {
    x: 1660,
    y: 356,
  },
}
