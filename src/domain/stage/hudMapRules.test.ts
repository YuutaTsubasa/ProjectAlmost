import { describe, expect, it } from 'vitest'
import { getHudCheckpointMarker, getHudPlatformMarker } from './hudMapRules'

describe('getHudPlatformMarker', () => {
  it('projects a platform from tile space into normalized map coordinates', () => {
    expect(getHudPlatformMarker({
      platform: { col: 0, row: 0, width: 4 },
      tileColumns: 100,
      tileSize: 48,
      worldHeight: 960,
    })).toEqual({ x: 0, y: 0, width: 0.04 })
  })

  it('uses tile row height for vertical marker position', () => {
    expect(getHudPlatformMarker({
      platform: { col: 25, row: 5, width: 10 },
      tileColumns: 100,
      tileSize: 48,
      worldHeight: 960,
    })).toEqual({ x: 0.25, y: 0.25, width: 0.1 })
  })

  it('preserves raw normalized values without clamping', () => {
    expect(getHudPlatformMarker({
      platform: { col: 98, row: 20, width: 8 },
      tileColumns: 100,
      tileSize: 48,
      worldHeight: 960,
    })).toEqual({ x: 0.98, y: 1, width: 0.08 })
  })
})

describe('getHudCheckpointMarker', () => {
  it('projects checkpoint origin into normalized map coordinates', () => {
    expect(getHudCheckpointMarker({
      checkpoint: { x: 0, surfaceY: 0 },
      worldWidth: 1000,
      worldHeight: 500,
    })).toEqual({ x: 0, y: 0 })
  })

  it('projects checkpoint surface position into normalized map coordinates', () => {
    expect(getHudCheckpointMarker({
      checkpoint: { x: 250, surfaceY: 125 },
      worldWidth: 1000,
      worldHeight: 500,
    })).toEqual({ x: 0.25, y: 0.25 })
  })

  it('preserves raw normalized values without clamping', () => {
    expect(getHudCheckpointMarker({
      checkpoint: { x: 1200, surfaceY: 600 },
      worldWidth: 1000,
      worldHeight: 500,
    })).toEqual({ x: 1.2, y: 1.2 })
  })
})
