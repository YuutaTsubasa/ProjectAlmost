import { describe, expect, it } from 'vitest'
import {
  buildTerrainTileGrid,
  getPlatformTileIndex,
  getTileColumnCount,
  getTileRowCount,
  validatePlatformBounds,
} from './terrain'
import type { PlatformRect } from './gameplayMapTypes'

describe('getTileColumnCount', () => {
  it('divides world width by tile size', () => {
    expect(getTileColumnCount({ worldWidth: 9600, tileSize: 64 })).toBe(150)
  })
})

describe('getTileRowCount', () => {
  it('rounds world rows up to cover partial tiles', () => {
    expect(getTileRowCount({ worldHeight: 1080, tileSize: 64 })).toBe(17)
  })
})

describe('getPlatformTileIndex', () => {
  it('uses middle tile for a single-tile platform', () => {
    expect(getPlatformTileIndex({ index: 0, width: 1 })).toBe(1)
  })

  it('uses left, middle, and right tile indexes for wider platforms', () => {
    expect(getPlatformTileIndex({ index: 0, width: 4 })).toBe(0)
    expect(getPlatformTileIndex({ index: 1, width: 4 })).toBe(1)
    expect(getPlatformTileIndex({ index: 2, width: 4 })).toBe(1)
    expect(getPlatformTileIndex({ index: 3, width: 4 })).toBe(2)
  })
})

describe('buildTerrainTileGrid', () => {
  it('creates an empty grid and writes platform tile indexes into cells', () => {
    const platforms: PlatformRect[] = [
      { col: 1, row: 1, width: 4, height: 1 },
      { col: 0, row: 3, width: 1, height: 1 },
    ]

    expect(buildTerrainTileGrid({ columns: 6, rows: 4, platforms })).toEqual([
      [-1, -1, -1, -1, -1, -1],
      [-1, 0, 1, 1, 2, -1],
      [-1, -1, -1, -1, -1, -1],
      [1, -1, -1, -1, -1, -1],
    ])
  })
})

describe('validatePlatformBounds', () => {
  it('accepts platforms inside the tile grid', () => {
    const result = validatePlatformBounds({
      columns: 6,
      rows: 4,
      platforms: [{ col: 1, row: 2, width: 4, height: 1 }],
    })

    expect(result).toEqual({ valid: true })
  })

  it('rejects platforms that exceed the tile grid columns', () => {
    const result = validatePlatformBounds({
      columns: 6,
      rows: 4,
      platforms: [{ col: 4, row: 2, width: 3, height: 1 }],
    })

    expect(result).toEqual({
      valid: false,
      reason: 'Platform at index 0 exceeds terrain columns.',
    })
  })

  it('rejects platforms that exceed the tile grid rows', () => {
    const result = validatePlatformBounds({
      columns: 6,
      rows: 4,
      platforms: [{ col: 2, row: 3, width: 2, height: 2 }],
    })

    expect(result).toEqual({
      valid: false,
      reason: 'Platform at index 0 exceeds terrain rows.',
    })
  })

  it('rejects platforms with zero width', () => {
    const result = validatePlatformBounds({
      columns: 6,
      rows: 4,
      platforms: [{ col: 1, row: 1, width: 0, height: 2 }],
    })

    expect(result).toEqual({
      valid: false,
      reason: 'Platform at index 0 must have positive width and height.',
    })
  })

  it('rejects platforms with zero height', () => {
    const result = validatePlatformBounds({
      columns: 6,
      rows: 4,
      platforms: [{ col: 1, row: 1, width: 2, height: 0 }],
    })

    expect(result).toEqual({
      valid: false,
      reason: 'Platform at index 0 must have positive width and height.',
    })
  })

  it('rejects platforms with negative width', () => {
    const result = validatePlatformBounds({
      columns: 6,
      rows: 4,
      platforms: [{ col: 1, row: 1, width: -2, height: 2 }],
    })

    expect(result).toEqual({
      valid: false,
      reason: 'Platform at index 0 must have positive width and height.',
    })
  })

  it('rejects platforms with negative height', () => {
    const result = validatePlatformBounds({
      columns: 6,
      rows: 4,
      platforms: [{ col: 1, row: 1, width: 2, height: -1 }],
    })

    expect(result).toEqual({
      valid: false,
      reason: 'Platform at index 0 must have positive width and height.',
    })
  })
})
