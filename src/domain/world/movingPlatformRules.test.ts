import { describe, expect, it } from 'vitest'
import {
  MOVING_PLATFORM_MIN_DELTA_SECONDS,
  getMovingPlatformDeltaSeconds,
  getMovingPlatformUpdateDecision,
  getMovingPlatformPosition,
  getMovingPlatformCarriedPlayerPosition,
  getMovingPlatformVelocity,
  isMovingPlatformRider,
} from './movingPlatformRules'

describe('getMovingPlatformPosition', () => {
  it('keeps x-axis platform at start position at the beginning of its cycle', () => {
    expect(getMovingPlatformPosition({
      startX: 100,
      startY: 200,
      axis: 'x',
      distance: 80,
      durationMs: 1000,
      nowMs: 0,
    })).toEqual({ x: 100, y: 200 })
  })

  it('moves x-axis platform by positive distance at a quarter cycle', () => {
    expect(getMovingPlatformPosition({
      startX: 100,
      startY: 200,
      axis: 'x',
      distance: 80,
      durationMs: 1000,
      nowMs: 250,
    })).toEqual({ x: 180, y: 200 })
  })

  it('keeps y-axis x position fixed and applies offset to y', () => {
    expect(getMovingPlatformPosition({
      startX: 100,
      startY: 200,
      axis: 'y',
      distance: 80,
      durationMs: 1000,
      nowMs: 250,
    })).toEqual({ x: 100, y: 280 })
  })

  it('uses the provided phase before calculating the sine offset', () => {
    expect(getMovingPlatformPosition({
      startX: 100,
      startY: 200,
      axis: 'x',
      distance: 80,
      durationMs: 1000,
      phase: 0.25,
      nowMs: 0,
    })).toEqual({ x: 180, y: 200 })
  })

  it('supports negative offset at three quarters of a cycle', () => {
    expect(getMovingPlatformPosition({
      startX: 100,
      startY: 200,
      axis: 'y',
      distance: 80,
      durationMs: 1000,
      nowMs: 750,
    })).toEqual({ x: 100, y: 120 })
  })
})

describe('getMovingPlatformUpdateDecision', () => {
  it('stops moving platforms while the player is dead', () => {
    expect(getMovingPlatformUpdateDecision({
      dead: true,
      stageCleared: false,
    })).toBe('stop')
  })

  it('stops moving platforms after the stage is cleared', () => {
    expect(getMovingPlatformUpdateDecision({
      dead: false,
      stageCleared: true,
    })).toBe('stop')
  })

  it('stops moving platforms when the player is dead and the stage is cleared', () => {
    expect(getMovingPlatformUpdateDecision({
      dead: true,
      stageCleared: true,
    })).toBe('stop')
  })

  it('updates moving platforms during active gameplay', () => {
    expect(getMovingPlatformUpdateDecision({
      dead: false,
      stageCleared: false,
    })).toBe('update')
  })
})

describe('getMovingPlatformDeltaSeconds', () => {
  it('converts frame delta milliseconds to seconds', () => {
    expect(getMovingPlatformDeltaSeconds({ deltaMs: 16 })).toBe(0.016)
  })

  it('clamps one millisecond to the minimum delta seconds', () => {
    expect(getMovingPlatformDeltaSeconds({ deltaMs: 1 })).toBe(MOVING_PLATFORM_MIN_DELTA_SECONDS)
  })

  it('clamps zero milliseconds to the minimum delta seconds', () => {
    expect(getMovingPlatformDeltaSeconds({ deltaMs: 0 })).toBe(MOVING_PLATFORM_MIN_DELTA_SECONDS)
  })

  it('supports a custom minimum delta seconds', () => {
    expect(getMovingPlatformDeltaSeconds({
      deltaMs: 1,
      minDeltaSeconds: 0.01,
    })).toBe(0.01)
  })
})

describe('getMovingPlatformVelocity', () => {
  it('calculates positive velocities from positive deltas', () => {
    expect(getMovingPlatformVelocity({
      deltaX: 12,
      deltaY: 6,
      deltaSeconds: 0.5,
    })).toEqual({ x: 24, y: 12 })
  })

  it('returns zero velocity for zero movement on an axis', () => {
    expect(getMovingPlatformVelocity({
      deltaX: 0,
      deltaY: 8,
      deltaSeconds: 0.25,
    })).toEqual({ x: 0, y: 32 })
  })

  it('calculates negative velocities from negative deltas', () => {
    expect(getMovingPlatformVelocity({
      deltaX: -10,
      deltaY: -4,
      deltaSeconds: 0.5,
    })).toEqual({ x: -20, y: -8 })
  })

  it('calculates x and y velocities independently', () => {
    expect(getMovingPlatformVelocity({
      deltaX: 3,
      deltaY: -9,
      deltaSeconds: 0.3,
    })).toEqual({ x: 10, y: -30 })
  })
})

describe('getMovingPlatformCarriedPlayerPosition', () => {
  it('applies positive platform deltas to both player axes', () => {
    expect(getMovingPlatformCarriedPlayerPosition({
      playerX: 100,
      playerY: 200,
      deltaX: 12,
      deltaY: 6,
    })).toEqual({ x: 112, y: 206 })
  })

  it('leaves an axis unchanged when its delta is zero', () => {
    expect(getMovingPlatformCarriedPlayerPosition({
      playerX: 100,
      playerY: 200,
      deltaX: 0,
      deltaY: 8,
    })).toEqual({ x: 100, y: 208 })
  })

  it('applies negative platform deltas to both player axes', () => {
    expect(getMovingPlatformCarriedPlayerPosition({
      playerX: 100,
      playerY: 200,
      deltaX: -10,
      deltaY: -4,
    })).toEqual({ x: 90, y: 196 })
  })

  it('applies x and y deltas independently', () => {
    expect(getMovingPlatformCarriedPlayerPosition({
      playerX: 100,
      playerY: 200,
      deltaX: 3,
      deltaY: -9,
    })).toEqual({ x: 103, y: 191 })
  })
})

describe('isMovingPlatformRider', () => {
  const baseInput = {
    playerGravityDown: true,
    playerLeft: 100,
    playerRight: 160,
    playerBottom: 200,
    platformLeft: 80,
    platformRight: 220,
    platformTop: 204,
    touchingDown: false,
    blockedDown: false,
  }

  it('allows riding when horizontally overlapping and close to platform top', () => {
    expect(isMovingPlatformRider(baseInput)).toBe(true)
  })

  it('blocks riding while gravity is not down', () => {
    expect(isMovingPlatformRider({
      ...baseInput,
      playerGravityDown: false,
    })).toBe(false)
  })

  it('requires strict overlap past the left platform inset', () => {
    expect(isMovingPlatformRider({
      ...baseInput,
      playerRight: baseInput.platformLeft + 8,
    })).toBe(false)
    expect(isMovingPlatformRider({
      ...baseInput,
      playerRight: baseInput.platformLeft + 9,
    })).toBe(true)
  })

  it('requires strict overlap before the right platform inset', () => {
    expect(isMovingPlatformRider({
      ...baseInput,
      playerLeft: baseInput.platformRight - 8,
    })).toBe(false)
    expect(isMovingPlatformRider({
      ...baseInput,
      playerLeft: baseInput.platformRight - 9,
    })).toBe(true)
  })

  it('keeps the top tolerance inclusive', () => {
    expect(isMovingPlatformRider({
      ...baseInput,
      playerBottom: baseInput.platformTop - 12,
    })).toBe(true)
    expect(isMovingPlatformRider({
      ...baseInput,
      playerBottom: baseInput.platformTop - 13,
    })).toBe(false)
  })

  it('allows touching down to count as riding outside top tolerance', () => {
    expect(isMovingPlatformRider({
      ...baseInput,
      playerBottom: baseInput.platformTop - 20,
      touchingDown: true,
    })).toBe(true)
  })

  it('allows blocked down to count as riding outside top tolerance', () => {
    expect(isMovingPlatformRider({
      ...baseInput,
      playerBottom: baseInput.platformTop - 20,
      blockedDown: true,
    })).toBe(true)
  })
})
