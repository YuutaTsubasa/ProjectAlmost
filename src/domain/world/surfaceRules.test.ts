import { describe, expect, it } from 'vitest'

import { findActiveSurfaceZone } from './surfaceRules'

describe('findActiveSurfaceZone', () => {
  const zones = [
    { id: 'ice-a', type: 'ice' as const, x: 10, y: 20, width: 100, height: 50 },
    { id: 'ice-b', type: 'ice' as const, x: 50, y: 40, width: 100, height: 50 },
  ]

  it('returns the first matching surface zone containing the point', () => {
    expect(findActiveSurfaceZone({
      pointX: 60,
      pointY: 45,
      surfaceType: 'ice',
      zones,
    })?.id).toBe('ice-a')
  })

  it('uses inclusive zone edges', () => {
    expect(findActiveSurfaceZone({
      pointX: 110,
      pointY: 70,
      surfaceType: 'ice',
      zones,
    })?.id).toBe('ice-a')
  })

  it('returns undefined when no matching zone contains the point', () => {
    expect(findActiveSurfaceZone({
      pointX: 9,
      pointY: 20,
      surfaceType: 'ice',
      zones,
    })).toBeUndefined()
  })
})
