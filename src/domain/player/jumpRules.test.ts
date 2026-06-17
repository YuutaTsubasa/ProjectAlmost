import { describe, expect, test } from 'vitest'
import {
  COYOTE_TIME_MS,
  getJumpDecision,
} from './jumpRules'

describe('getJumpDecision', () => {
  test('uses the gameplay coyote time as the default', () => {
    expect(COYOTE_TIME_MS).toBe(120)
  })

  test('does not jump when the jump buffer has expired, even while grounded', () => {
    expect(getJumpDecision({
      now: 101,
      grounded: true,
      lastGroundedAt: 101,
      jumpBufferedUntil: 100,
      remainingAirJumps: 1,
    })).toEqual({ type: 'none' })
  })

  test('allows jump on the exact jump buffer boundary', () => {
    expect(getJumpDecision({
      now: 100,
      grounded: true,
      lastGroundedAt: 100,
      jumpBufferedUntil: 100,
      remainingAirJumps: 1,
    })).toEqual({ type: 'ground-jump' })
  })

  test('uses a ground jump while grounded', () => {
    expect(getJumpDecision({
      now: 200,
      grounded: true,
      lastGroundedAt: 80,
      jumpBufferedUntil: 260,
      remainingAirJumps: 1,
    })).toEqual({ type: 'ground-jump' })
  })

  test('uses a ground jump on the coyote time boundary', () => {
    expect(getJumpDecision({
      now: 220,
      grounded: false,
      lastGroundedAt: 100,
      jumpBufferedUntil: 260,
      remainingAirJumps: 1,
    })).toEqual({ type: 'ground-jump' })
  })

  test('uses an air jump just outside coyote time when an air jump remains', () => {
    expect(getJumpDecision({
      now: 221,
      grounded: false,
      lastGroundedAt: 100,
      jumpBufferedUntil: 260,
      remainingAirJumps: 1,
    })).toEqual({ type: 'air-jump' })
  })

  test('does not jump outside coyote time when no air jumps remain', () => {
    expect(getJumpDecision({
      now: 221,
      grounded: false,
      lastGroundedAt: 100,
      jumpBufferedUntil: 260,
      remainingAirJumps: 0,
    })).toEqual({ type: 'none' })
  })

  test('supports an explicit coyote time for boundary checks', () => {
    expect(getJumpDecision({
      now: 150,
      grounded: false,
      lastGroundedAt: 100,
      jumpBufferedUntil: 180,
      remainingAirJumps: 0,
      coyoteTimeMs: 50,
    })).toEqual({ type: 'ground-jump' })
    expect(getJumpDecision({
      now: 151,
      grounded: false,
      lastGroundedAt: 100,
      jumpBufferedUntil: 180,
      remainingAirJumps: 0,
      coyoteTimeMs: 50,
    })).toEqual({ type: 'none' })
  })
})
