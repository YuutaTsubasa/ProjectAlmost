export type VerticalGravityDirection = 'down' | 'up'

export function getVerticalGravitySign(input: {
  direction: VerticalGravityDirection
}): 1 | -1 {
  return input.direction === 'down' ? 1 : -1
}

export function getPlayerBodyGravityY(input: {
  direction: VerticalGravityDirection
  worldGravityY: number
}): number {
  return input.direction === 'down' ? 0 : -input.worldGravityY * 2
}

export function shouldFlipPlayerYForGravity(input: {
  direction: VerticalGravityDirection
}): boolean {
  return input.direction === 'up'
}
