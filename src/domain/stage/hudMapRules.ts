export function getHudPlatformMarker(input: {
  platform: {
    col: number
    row: number
    width: number
  }
  tileColumns: number
  tileSize: number
  worldHeight: number
}): {
  x: number
  y: number
  width: number
} {
  return {
    x: input.platform.col / input.tileColumns,
    y: (input.platform.row * input.tileSize) / input.worldHeight,
    width: input.platform.width / input.tileColumns,
  }
}

export function getHudCheckpointMarker(input: {
  checkpoint: {
    x: number
    surfaceY: number
  }
  worldWidth: number
  worldHeight: number
}): {
  x: number
  y: number
} {
  return {
    x: input.checkpoint.x / input.worldWidth,
    y: input.checkpoint.surfaceY / input.worldHeight,
  }
}

export function getHudEnemyMarker(input: {
  enemyX: number
  enemyY: number
  worldWidth: number
  worldHeight: number
}): {
  x: number
  y: number
} {
  return {
    x: input.enemyX / input.worldWidth,
    y: input.enemyY / input.worldHeight,
  }
}

export function getHudEnemyMarkers(input: {
  enemies: readonly {
    x: number
    y: number
    defeated: boolean
  }[]
  worldWidth: number
  worldHeight: number
}): { x: number; y: number }[] {
  return input.enemies
    .filter((enemy) => !enemy.defeated)
    .map((enemy) => getHudEnemyMarker({
      enemyX: enemy.x,
      enemyY: enemy.y,
      worldWidth: input.worldWidth,
      worldHeight: input.worldHeight,
    }))
}

export function getHudGoalProgress(input: {
  goalX: number
  worldWidth: number
}): number {
  return input.goalX / input.worldWidth
}
