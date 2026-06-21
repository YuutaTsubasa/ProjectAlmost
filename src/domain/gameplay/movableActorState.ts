export type MovableActorGroundState = 'grounded' | 'airborne'

export type MovableActorJumpState = {
  groundState: MovableActorGroundState
  lastGroundedAt: number
  jumpBufferedUntil: number
  remainingAirJumps: number
}

export type MovableActorJumpConfig = {
  coyoteTimeMs: number
  jumpBufferMs: number
  maxAirJumps: number
}

export type MovableActorJumpDecision =
  | { type: 'none'; state: MovableActorJumpState }
  | { type: 'ground-jump'; state: MovableActorJumpState }
  | { type: 'air-jump'; state: MovableActorJumpState }

export function createMovableActorJumpState(input: {
  now: number
  grounded: boolean
  config: MovableActorJumpConfig
}): MovableActorJumpState {
  return {
    groundState: input.grounded ? 'grounded' : 'airborne',
    lastGroundedAt: input.grounded ? input.now : 0,
    jumpBufferedUntil: 0,
    remainingAirJumps: input.config.maxAirJumps,
  }
}

export function updateMovableActorGroundContact(input: {
  state: MovableActorJumpState
  now: number
  grounded: boolean
  config: MovableActorJumpConfig
}): MovableActorJumpState {
  if (input.grounded) {
    return {
      ...input.state,
      groundState: 'grounded',
      lastGroundedAt: input.now,
      remainingAirJumps: input.config.maxAirJumps,
    }
  }

  return {
    ...input.state,
    groundState: 'airborne',
  }
}

export function bufferMovableActorJump(input: {
  state: MovableActorJumpState
  now: number
  config: MovableActorJumpConfig
}): MovableActorJumpState {
  return {
    ...input.state,
    jumpBufferedUntil: input.now + input.config.jumpBufferMs,
  }
}

export function getMovableActorJumpDecision(input: {
  state: MovableActorJumpState
  now: number
  config: MovableActorJumpConfig
}): MovableActorJumpDecision {
  if (input.state.jumpBufferedUntil < input.now) {
    return { type: 'none', state: input.state }
  }

  if (
    input.state.groundState === 'grounded' ||
    input.now - input.state.lastGroundedAt <= input.config.coyoteTimeMs
  ) {
    return {
      type: 'ground-jump',
      state: {
        ...input.state,
        groundState: 'airborne',
        lastGroundedAt: 0,
        jumpBufferedUntil: 0,
      },
    }
  }

  if (input.state.remainingAirJumps > 0) {
    return {
      type: 'air-jump',
      state: {
        ...input.state,
        groundState: 'airborne',
        lastGroundedAt: 0,
        jumpBufferedUntil: 0,
        remainingAirJumps: input.state.remainingAirJumps - 1,
      },
    }
  }

  return { type: 'none', state: input.state }
}
