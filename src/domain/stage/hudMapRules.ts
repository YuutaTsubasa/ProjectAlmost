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
