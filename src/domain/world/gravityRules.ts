export type VerticalGravityDirection = 'down' | 'up'

export function getVerticalGravitySign(input: {
  direction: VerticalGravityDirection
}): 1 | -1 {
  return input.direction === 'down' ? 1 : -1
}
