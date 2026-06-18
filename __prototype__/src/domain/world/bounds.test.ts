import { describe, expect, test } from 'vitest'
import { OUT_OF_BOUNDS_MARGIN, isOutOfBounds } from './bounds'

describe('isOutOfBounds', () => {
  test('treats down-gravity players below the lower margin as out of bounds', () => {
    expect(isOutOfBounds({
      playerY: 1_000 + OUT_OF_BOUNDS_MARGIN + 1,
      worldHeight: 1_000,
      isDownGravity: true,
    })).toBe(true)
  })

  test('keeps down-gravity players exactly on the lower margin in bounds', () => {
    expect(isOutOfBounds({
      playerY: 1_000 + OUT_OF_BOUNDS_MARGIN,
      worldHeight: 1_000,
      isDownGravity: true,
    })).toBe(false)
  })

  test('treats non-down-gravity players above the upper margin as out of bounds', () => {
    expect(isOutOfBounds({
      playerY: -OUT_OF_BOUNDS_MARGIN - 1,
      worldHeight: 1_000,
      isDownGravity: false,
    })).toBe(true)
  })

  test('keeps non-down-gravity players exactly on the upper margin in bounds', () => {
    expect(isOutOfBounds({
      playerY: -OUT_OF_BOUNDS_MARGIN,
      worldHeight: 1_000,
      isDownGravity: false,
    })).toBe(false)
  })
})
