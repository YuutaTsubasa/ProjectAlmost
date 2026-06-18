import { describe, expect, it } from 'vitest'
import { getPlatformTileIndex, getTileColumnCount, getTileRowCount } from './terrainRules'

describe('getPlatformTileIndex', () => {
  it('uses the middle tile for a single-tile platform', () => {
    expect(getPlatformTileIndex({ index: 0, width: 1 })).toBe(1)
  })

  it('uses the left tile for the first tile of wider platforms', () => {
    expect(getPlatformTileIndex({ index: 0, width: 4 })).toBe(0)
  })

  it('uses the right tile for the last tile of wider platforms', () => {
    expect(getPlatformTileIndex({ index: 3, width: 4 })).toBe(2)
  })

  it('uses the middle tile for interior tiles', () => {
    expect(getPlatformTileIndex({ index: 1, width: 4 })).toBe(1)
    expect(getPlatformTileIndex({ index: 2, width: 4 })).toBe(1)
  })
})

describe('getTileColumnCount', () => {
  it('divides world width by tile size', () => {
    expect(getTileColumnCount({ worldWidth: 1920, tileSize: 64 })).toBe(30)
  })

  it('preserves fractional columns', () => {
    expect(getTileColumnCount({ worldWidth: 100, tileSize: 64 })).toBe(1.5625)
  })
})

describe('getTileRowCount', () => {
  it('rounds world rows up to cover partial tiles', () => {
    expect(getTileRowCount({ worldHeight: 1080, tileSize: 64 })).toBe(17)
  })

  it('keeps exact row counts when divisible', () => {
    expect(getTileRowCount({ worldHeight: 1024, tileSize: 64 })).toBe(16)
  })
})
