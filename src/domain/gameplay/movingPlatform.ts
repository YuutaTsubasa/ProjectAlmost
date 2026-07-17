export type MovingPlatformAxis = 'x' | 'y'
export type MovingPlatformDirection = -1 | 1

export type MovingPlatformOriginInput = {
  col: number
  row: number
  width: number
  height: number
  tileSize: number
}

export type MovingPlatformPath = {
  origin: { x: number; y: number }
  axis: MovingPlatformAxis
  distance: number
  durationMs: number
  phase?: number
}

export type MovingPlatformPosition = {
  x: number
  y: number
  progress: number
  direction: MovingPlatformDirection
}

export function getMovingPlatformOrigin(input: MovingPlatformOriginInput): { x: number; y: number } {
  return {
    x: (input.col + input.width / 2) * input.tileSize,
    y: (input.row + input.height / 2) * input.tileSize,
  }
}

export function normalizeMovingPlatformPhase(phase: number | undefined): number {
  if (phase === undefined || !Number.isFinite(phase)) return 0
  if (phase >= 0 && phase < 1) return phase
  return ((phase % 1) + 1) % 1
}

export function getMovingPlatformPositionAtTime(input: {
  path: MovingPlatformPath
  elapsedMs: number
}): MovingPlatformPosition {
  const durationMs = Math.max(1, input.path.durationMs)
  const cycleProgress = ((Math.max(0, input.elapsedMs) / durationMs + normalizeMovingPlatformPhase(input.path.phase) * 2) % 1 + 1) % 1
  const progress = cycleProgress <= 0.5 ? cycleProgress * 2 : (1 - cycleProgress) * 2
  const direction: MovingPlatformDirection = cycleProgress < 0.5 ? 1 : -1
  const offset = input.path.distance * progress

  return {
    x: input.path.origin.x + (input.path.axis === 'x' ? offset : 0),
    y: input.path.origin.y + (input.path.axis === 'y' ? offset : 0),
    progress,
    direction,
  }
}
