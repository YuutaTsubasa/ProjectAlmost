export const COYOTE_TIME_MS = 120

export type JumpDecision =
  | { type: 'none' }
  | { type: 'ground-jump' }
  | { type: 'air-jump' }

export function getJumpDecision(input: {
  now: number
  grounded: boolean
  lastGroundedAt: number
  jumpBufferedUntil: number
  remainingAirJumps: number
  coyoteTimeMs?: number
}): JumpDecision {
  if (input.jumpBufferedUntil < input.now) return { type: 'none' }
  const coyoteTimeMs = input.coyoteTimeMs ?? COYOTE_TIME_MS
  if (input.grounded || input.now - input.lastGroundedAt <= coyoteTimeMs) return { type: 'ground-jump' }
  if (input.remainingAirJumps > 0) return { type: 'air-jump' }
  return { type: 'none' }
}
