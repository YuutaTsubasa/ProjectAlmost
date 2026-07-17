import { describe, expect, it } from 'vitest'
import {
  getMovingPlatformOrigin,
  getMovingPlatformPositionAtTime,
  normalizeMovingPlatformPhase,
} from './movingPlatform'

describe('getMovingPlatformOrigin', () => {
  it('converts tile grid placement into a world-space platform center', () => {
    expect(getMovingPlatformOrigin({
      col: 26,
      row: 9,
      width: 4,
      height: 1,
      tileSize: 64,
    })).toEqual({ x: 1792, y: 608 })
  })
})

describe('normalizeMovingPlatformPhase', () => {
  it('wraps phase values into the 0..1 range', () => {
    expect(normalizeMovingPlatformPhase(undefined)).toBe(0)
    expect(normalizeMovingPlatformPhase(0.35)).toBe(0.35)
    expect(normalizeMovingPlatformPhase(1.25)).toBe(0.25)
    expect(normalizeMovingPlatformPhase(-0.25)).toBe(0.75)
  })
})

describe('getMovingPlatformPositionAtTime', () => {
  const verticalPath = {
    origin: { x: 1792, y: 608 },
    axis: 'y' as const,
    distance: 72,
    durationMs: 2100,
    phase: 0,
  }

  it('moves from origin to endpoint and back over one ping-pong cycle', () => {
    expect(getMovingPlatformPositionAtTime({ path: verticalPath, elapsedMs: 0 })).toEqual({
      x: 1792,
      y: 608,
      progress: 0,
      direction: 1,
    })
    expect(getMovingPlatformPositionAtTime({ path: verticalPath, elapsedMs: 1050 })).toEqual({
      x: 1792,
      y: 680,
      progress: 1,
      direction: -1,
    })
    expect(getMovingPlatformPositionAtTime({ path: verticalPath, elapsedMs: 2100 })).toEqual({
      x: 1792,
      y: 608,
      progress: 0,
      direction: 1,
    })
  })

  it('moves only on the configured axis', () => {
    expect(getMovingPlatformPositionAtTime({
      path: {
        origin: { x: 3200, y: 608 },
        axis: 'x',
        distance: 112,
        durationMs: 2600,
        phase: 0,
      },
      elapsedMs: 650,
    })).toEqual({
      x: 3256,
      y: 608,
      progress: 0.5,
      direction: 1,
    })
  })

  it('applies phase directly as a normalized loop offset', () => {
    expect(getMovingPlatformPositionAtTime({
      path: { ...verticalPath, phase: 0.25 },
      elapsedMs: 0,
    })).toEqual({
      x: 1792,
      y: 644,
      progress: 0.5,
      direction: 1,
    })
  })

  it('keeps an upper-half authored phase on the backward half of the loop', () => {
    const earlyLoopPosition = getMovingPlatformPositionAtTime({
      path: { ...verticalPath, phase: 0.1 },
      elapsedMs: 0,
    })
    const upperHalfPosition = getMovingPlatformPositionAtTime({
      path: { ...verticalPath, phase: 0.6 },
      elapsedMs: 0,
    })

    expect(earlyLoopPosition).toMatchObject({ x: 1792, y: 622.4, direction: 1 })
    expect(earlyLoopPosition.progress).toBeCloseTo(0.2)
    expect(upperHalfPosition).toMatchObject({ x: 1792, y: 665.6, direction: -1 })
    expect(upperHalfPosition.progress).toBeCloseTo(0.8)
    expect(upperHalfPosition).not.toEqual(earlyLoopPosition)
  })

  it('defaults an omitted phase to the origin position', () => {
    expect(getMovingPlatformPositionAtTime({
      path: {
        origin: { x: 1792, y: 608 },
        axis: 'y',
        distance: 72,
        durationMs: 2100,
      },
      elapsedMs: 0,
    })).toEqual({
      x: 1792,
      y: 608,
      progress: 0,
      direction: 1,
    })
  })
})
