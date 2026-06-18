export type VerticalGravityDirection = 'down' | 'up'

export type GravityZoneLike = {
  x: number
  y: number
  width: number
  height: number
  direction: VerticalGravityDirection
}

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

export function findActiveGravityZone<TZone extends GravityZoneLike>(input: {
  pointX: number
  pointY: number
  zones: readonly TZone[]
}): TZone | undefined {
  return input.zones.find((zone) =>
    input.pointX >= zone.x
    && input.pointX <= zone.x + zone.width
    && input.pointY >= zone.y
    && input.pointY <= zone.y + zone.height,
  )
}
