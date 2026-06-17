export type MovingPlatformAxis = 'x' | 'y'

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
