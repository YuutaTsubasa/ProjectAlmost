import { describe, expect, test } from 'vitest'
import {
  BOSS_PATTERN_BASE_DELAY_MS,
  BOSS_PATTERN_MIN_DELAY_MS,
  BOSS_PATTERN_PHASE_DELAY_STEP_MS,
  BOSS_PHASE_COUNT,
  getBossPatternDelayMs,
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

describe('getBossPatternDelayMs', () => {
  test('keeps boss cadence constants explicit', () => {
    expect(BOSS_PATTERN_BASE_DELAY_MS).toBe(980)
    expect(BOSS_PATTERN_PHASE_DELAY_STEP_MS).toBe(90)
    expect(BOSS_PATTERN_MIN_DELAY_MS).toBe(540)
  })

  test('reduces delay by phase without clamping during playable boss phases', () => {
    expect(getBossPatternDelayMs({ phase: 0 })).toBe(980)
    expect(getBossPatternDelayMs({ phase: 1 })).toBe(890)
    expect(getBossPatternDelayMs({ phase: 2 })).toBe(800)
    expect(getBossPatternDelayMs({ phase: 3 })).toBe(710)
  })

  test('does not clamp phase 4 but clamps phase 5 and above', () => {
    expect(getBossPatternDelayMs({ phase: 4 })).toBe(620)
    expect(getBossPatternDelayMs({ phase: 5 })).toBe(540)
    expect(getBossPatternDelayMs({ phase: 100 })).toBe(540)
  })
})
