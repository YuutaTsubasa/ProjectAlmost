import { describe, expect, it } from 'vitest'
import {
  bufferMovableActorJump,
  createMovableActorJumpState,
  getMovableActorJumpDecision,
  updateMovableActorGroundContact,
  type MovableActorJumpConfig,
} from './movableActorState'

const config: MovableActorJumpConfig = {
  coyoteTimeMs: 120,
  jumpBufferMs: 140,
  maxAirJumps: 1,
}

describe('createMovableActorJumpState', () => {
  it('creates a grounded state with configured air jumps', () => {
    expect(createMovableActorJumpState({ now: 25, grounded: true, config })).toEqual({
      groundState: 'grounded',
      lastGroundedAt: 25,
      jumpBufferedUntil: 0,
      remainingAirJumps: 1,
    })
  })

  it('creates an airborne state without a grounded timestamp', () => {
    expect(createMovableActorJumpState({ now: 25, grounded: false, config })).toEqual({
      groundState: 'airborne',
      lastGroundedAt: 0,
      jumpBufferedUntil: 0,
      remainingAirJumps: 1,
    })
  })
})

describe('updateMovableActorGroundContact', () => {
  it('resets air jumps and last grounded time while grounded', () => {
    const state = {
      groundState: 'airborne' as const,
      lastGroundedAt: 50,
      jumpBufferedUntil: 0,
      remainingAirJumps: 0,
    }

    expect(updateMovableActorGroundContact({ state, now: 200, grounded: true, config })).toEqual({
      groundState: 'grounded',
      lastGroundedAt: 200,
      jumpBufferedUntil: 0,
      remainingAirJumps: 1,
    })
  })

  it('does not reset air jumps while airborne', () => {
    const state = {
      groundState: 'grounded' as const,
      lastGroundedAt: 100,
      jumpBufferedUntil: 0,
      remainingAirJumps: 0,
    }

    expect(updateMovableActorGroundContact({ state, now: 180, grounded: false, config })).toEqual({
      groundState: 'airborne',
      lastGroundedAt: 100,
      jumpBufferedUntil: 0,
      remainingAirJumps: 0,
    })
  })
})

describe('bufferMovableActorJump', () => {
  it('buffers a jump until now plus the configured buffer duration', () => {
    const state = createMovableActorJumpState({ now: 10, grounded: true, config })

    expect(bufferMovableActorJump({ state, now: 300, config })).toEqual({
      ...state,
      jumpBufferedUntil: 440,
    })
  })
})

describe('getMovableActorJumpDecision', () => {
  it('returns none when the jump buffer has expired', () => {
    const state = {
      groundState: 'grounded' as const,
      lastGroundedAt: 100,
      jumpBufferedUntil: 199,
      remainingAirJumps: 1,
    }

    expect(getMovableActorJumpDecision({ state, now: 200, config })).toEqual({
      type: 'none',
      state,
    })
  })

  it('returns ground-jump while grounded and clears consumed timing state', () => {
    const state = {
      groundState: 'grounded' as const,
      lastGroundedAt: 200,
      jumpBufferedUntil: 320,
      remainingAirJumps: 1,
    }

    expect(getMovableActorJumpDecision({ state, now: 220, config })).toEqual({
      type: 'ground-jump',
      state: {
        groundState: 'airborne',
        lastGroundedAt: 0,
        jumpBufferedUntil: 0,
        remainingAirJumps: 1,
      },
    })
  })

  it('returns ground-jump on the coyote time boundary', () => {
    const state = {
      groundState: 'airborne' as const,
      lastGroundedAt: 100,
      jumpBufferedUntil: 260,
      remainingAirJumps: 1,
    }

    expect(getMovableActorJumpDecision({ state, now: 220, config })).toEqual({
      type: 'ground-jump',
      state: {
        groundState: 'airborne',
        lastGroundedAt: 0,
        jumpBufferedUntil: 0,
        remainingAirJumps: 1,
      },
    })
  })

  it('returns air-jump outside coyote time and consumes one air jump', () => {
    const state = {
      groundState: 'airborne' as const,
      lastGroundedAt: 100,
      jumpBufferedUntil: 260,
      remainingAirJumps: 1,
    }

    expect(getMovableActorJumpDecision({ state, now: 221, config })).toEqual({
      type: 'air-jump',
      state: {
        groundState: 'airborne',
        lastGroundedAt: 0,
        jumpBufferedUntil: 0,
        remainingAirJumps: 0,
      },
    })
  })

  it('returns none outside coyote time when no air jumps remain', () => {
    const state = {
      groundState: 'airborne' as const,
      lastGroundedAt: 100,
      jumpBufferedUntil: 260,
      remainingAirJumps: 0,
    }

    expect(getMovableActorJumpDecision({ state, now: 221, config })).toEqual({
      type: 'none',
      state,
    })
  })
})
