export const BOSS_PHASE_COUNT = 4
export const BOSS_PATTERN_BASE_DELAY_MS = 980
export const BOSS_PATTERN_PHASE_DELAY_STEP_MS = 90
export const BOSS_PATTERN_MIN_DELAY_MS = 540

export type BossHitOutcome =
  | { type: 'advance-phase'; nextPhase: number }
  | { type: 'defeated'; nextPhase: number }

export function getBossHitOutcome(input: {
  currentPhase: number
  phaseCount?: number
}): BossHitOutcome {
  const phaseCount = input.phaseCount ?? BOSS_PHASE_COUNT
  const nextPhase = input.currentPhase + 1
  return nextPhase >= phaseCount
    ? { type: 'defeated', nextPhase }
    : { type: 'advance-phase', nextPhase }
}

export function getBossPatternDelayMs(input: { phase: number }): number {
  return Math.max(
    BOSS_PATTERN_MIN_DELAY_MS,
    BOSS_PATTERN_BASE_DELAY_MS - input.phase * BOSS_PATTERN_PHASE_DELAY_STEP_MS,
  )
}
