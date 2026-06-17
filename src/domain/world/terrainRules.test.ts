import { describe, expect, it } from 'vitest'
import { getPlatformTileIndex } from './terrainRules'

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
