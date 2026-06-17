import { describe, expect, test } from 'vitest'
import {
  BOSS_PHASE_COUNT,
  getBossHitOutcome,
} from './bossRules'

describe('getBossHitOutcome', () => {
  test('uses four boss phases by default', () => {
    expect(BOSS_PHASE_COUNT).toBe(4)
  })

  test('advances when the next phase is below the phase count', () => {
    expect(getBossHitOutcome({ currentPhase: 0 })).toEqual({ type: 'advance-phase', nextPhase: 1 })
    expect(getBossHitOutcome({ currentPhase: 1 })).toEqual({ type: 'advance-phase', nextPhase: 2 })
    expect(getBossHitOutcome({ currentPhase: 2 })).toEqual({ type: 'advance-phase', nextPhase: 3 })
  })

  test('defeats the boss when the next phase reaches the phase count', () => {
    expect(getBossHitOutcome({ currentPhase: 3 })).toEqual({ type: 'defeated', nextPhase: 4 })
  })

  test('supports an explicit phase count for boundary checks', () => {
    expect(getBossHitOutcome({ currentPhase: 1, phaseCount: 3 })).toEqual({ type: 'advance-phase', nextPhase: 2 })
    expect(getBossHitOutcome({ currentPhase: 2, phaseCount: 3 })).toEqual({ type: 'defeated', nextPhase: 3 })
  })
})
