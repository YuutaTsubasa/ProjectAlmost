export type PlayerGravityDirection = 'down' | 'up'

export function isPlayerGroundedByContact(input: {
  direction: PlayerGravityDirection
  blockedDown: boolean
  touchingDown: boolean
  blockedUp: boolean
  touchingUp: boolean
}): boolean {
  return input.direction === 'down'
    ? input.blockedDown || input.touchingDown
    : input.blockedUp || input.touchingUp
}
