export const BOSS_PHASE_COUNT = 4

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
