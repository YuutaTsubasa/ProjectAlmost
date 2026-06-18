export const OUT_OF_BOUNDS_MARGIN = 80

export type OutOfBoundsInput = {
  playerY: number
  worldHeight: number
  isDownGravity: boolean
}

export function isOutOfBounds(input: OutOfBoundsInput): boolean {
  return input.isDownGravity
    ? input.playerY > input.worldHeight + OUT_OF_BOUNDS_MARGIN
    : input.playerY < -OUT_OF_BOUNDS_MARGIN
}
