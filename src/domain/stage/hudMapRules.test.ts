import { describe, expect, it } from 'vitest'
import {
  getHudCheckpointMarker,
  getHudEnemyMarker,
  getHudEnemyMarkers,
  getHudGoalProgress,
  getHudPlatformMarker,
  getHudPlatformMarkers,
} from './hudMapRules'

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

describe('getHudPlatformMarkers', () => {
  it('returns no markers when no platforms exist', () => {
    expect(getHudPlatformMarkers({
      platforms: [],
      tileColumns: 100,
      tileSize: 48,
      worldHeight: 960,
    })).toEqual([])
  })

  it('projects every platform in input order', () => {
    expect(getHudPlatformMarkers({
      platforms: [
        { col: 0, row: 0, width: 4 },
        { col: 25, row: 5, width: 10 },
      ],
      tileColumns: 100,
      tileSize: 48,
      worldHeight: 960,
    })).toEqual([
      { x: 0, y: 0, width: 0.04 },
      { x: 0.25, y: 0.25, width: 0.1 },
    ])
  })

  it('preserves raw normalized values without clamping', () => {
    expect(getHudPlatformMarkers({
      platforms: [
        { col: 98, row: 20, width: 8 },
      ],
      tileColumns: 100,
      tileSize: 48,
      worldHeight: 960,
    })).toEqual([{ x: 0.98, y: 1, width: 0.08 }])
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

describe('getHudEnemyMarker', () => {
  it('projects enemy origin into normalized map coordinates', () => {
    expect(getHudEnemyMarker({
      enemyX: 0,
      enemyY: 0,
      worldWidth: 1000,
      worldHeight: 500,
    })).toEqual({ x: 0, y: 0 })
  })

  it('projects enemy position into normalized map coordinates', () => {
    expect(getHudEnemyMarker({
      enemyX: 250,
      enemyY: 125,
      worldWidth: 1000,
      worldHeight: 500,
    })).toEqual({ x: 0.25, y: 0.25 })
  })

  it('preserves raw normalized values without clamping', () => {
    expect(getHudEnemyMarker({
      enemyX: 1200,
      enemyY: 600,
      worldWidth: 1000,
      worldHeight: 500,
    })).toEqual({ x: 1.2, y: 1.2 })
  })
})

describe('getHudEnemyMarkers', () => {
  it('returns no markers when no enemies exist', () => {
    expect(getHudEnemyMarkers({
      enemies: [],
      worldWidth: 1000,
      worldHeight: 500,
    })).toEqual([])
  })

  it('filters out defeated enemies', () => {
    expect(getHudEnemyMarkers({
      enemies: [
        { x: 100, y: 50, defeated: true },
        { x: 250, y: 125, defeated: false },
        { x: 750, y: 375, defeated: true },
      ],
      worldWidth: 1000,
      worldHeight: 500,
    })).toEqual([{ x: 0.25, y: 0.25 }])
  })

  it('projects every undefeated enemy without clamping', () => {
    expect(getHudEnemyMarkers({
      enemies: [
        { x: 250, y: 125, defeated: false },
        { x: 1200, y: 600, defeated: false },
      ],
      worldWidth: 1000,
      worldHeight: 500,
    })).toEqual([
      { x: 0.25, y: 0.25 },
      { x: 1.2, y: 1.2 },
    ])
  })
})

describe('getHudGoalProgress', () => {
  it('projects goal origin into normalized map progress', () => {
    expect(getHudGoalProgress({
      goalX: 0,
      worldWidth: 1000,
    })).toBe(0)
  })

  it('projects goal x position into normalized map progress', () => {
    expect(getHudGoalProgress({
      goalX: 250,
      worldWidth: 1000,
    })).toBe(0.25)
  })

  it('preserves raw normalized values without clamping', () => {
    expect(getHudGoalProgress({
      goalX: 1200,
      worldWidth: 1000,
    })).toBe(1.2)
  })
})
