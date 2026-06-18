export type MovingPlatformAxis = 'x' | 'y'
export type MovingPlatformUpdateDecision = 'stop' | 'update'

export const MOVING_PLATFORM_MIN_DELTA_SECONDS = 0.001

export function getMovingPlatformUpdateDecision(input: {
  dead: boolean
  stageCleared: boolean
}): MovingPlatformUpdateDecision {
  return input.dead || input.stageCleared ? 'stop' : 'update'
}

export function getMovingPlatformPosition(input: {
  startX: number
  startY: number
  axis: MovingPlatformAxis
  distance: number
  durationMs: number
  phase?: number
  nowMs: number
}): { x: number; y: number } {
  const phase = input.phase ?? 0
  const t = (input.nowMs / input.durationMs + phase) * Math.PI * 2
  const offset = Math.sin(t) * input.distance
  return {
    x: input.axis === 'x' ? input.startX + offset : input.startX,
    y: input.axis === 'y' ? input.startY + offset : input.startY,
  }
}

export function getMovingPlatformDeltaSeconds(input: {
  deltaMs: number
  minDeltaSeconds?: number
}): number {
  return Math.max(input.deltaMs / 1000, input.minDeltaSeconds ?? MOVING_PLATFORM_MIN_DELTA_SECONDS)
}

export function getMovingPlatformVelocity(input: {
  deltaX: number
  deltaY: number
  deltaSeconds: number
}): { x: number; y: number } {
  return {
    x: input.deltaX / input.deltaSeconds,
    y: input.deltaY / input.deltaSeconds,
  }
}

export function getMovingPlatformCarriedPlayerPosition(input: {
  playerX: number
  playerY: number
  deltaX: number
  deltaY: number
}): { x: number; y: number } {
  return {
    x: input.playerX + input.deltaX,
    y: input.playerY + input.deltaY,
  }
}

export function isMovingPlatformRider(input: {
  playerGravityDown: boolean
  playerLeft: number
  playerRight: number
  playerBottom: number
  platformLeft: number
  platformRight: number
  platformTop: number
  touchingDown: boolean
  blockedDown: boolean
}): boolean {
  if (!input.playerGravityDown) return false

  const horizontalOverlap = input.playerRight > input.platformLeft + 8
    && input.playerLeft < input.platformRight - 8
  const closeToTop = Math.abs(input.playerBottom - input.platformTop) <= 12
  return horizontalOverlap && (closeToTop || input.touchingDown || input.blockedDown)
}
