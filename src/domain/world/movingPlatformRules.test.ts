import { describe, expect, it } from 'vitest'
import {
  getMovingPlatformUpdateDecision,
  getMovingPlatformPosition,
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
