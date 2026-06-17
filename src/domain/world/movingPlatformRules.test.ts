import { describe, expect, it } from 'vitest'
import { getMovingPlatformPosition } from './movingPlatformRules'

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
