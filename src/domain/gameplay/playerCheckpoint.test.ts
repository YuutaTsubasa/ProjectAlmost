import { describe, expect, it } from 'vitest'
import {
  findNextCheckpointIndex,
  getCheckpointRespawnState,
  getCheckpointTargetCount,
  getReachedCheckpointCount,
} from './playerCheckpoint'

describe('player checkpoint counts', () => {
  it('returns zero reached checkpoints before any activation', () => {
    expect(getReachedCheckpointCount({ activeCheckpointIndex: -1 })).toBe(0)
  })

  it('returns one-based reached count from the active checkpoint index', () => {
    expect(getReachedCheckpointCount({ activeCheckpointIndex: 0 })).toBe(1)
    expect(getReachedCheckpointCount({ activeCheckpointIndex: 2 })).toBe(3)
  })

  it('returns the checkpoint target count', () => {
    expect(getCheckpointTargetCount({ checkpoints: [{ x: 10 }, { x: 20 }] })).toBe(2)
  })
})

describe('next checkpoint activation', () => {
  const checkpoints = [{ x: 100 }, { x: 200 }, { x: 300 }]

  it('returns -1 when no checkpoints exist', () => {
    expect(findNextCheckpointIndex({
      checkpoints: [],
      activeCheckpointIndex: -1,
      playerX: 500,
    })).toBe(-1)
  })

  it('ignores checkpoints at or before the active index', () => {
    expect(findNextCheckpointIndex({
      checkpoints,
      activeCheckpointIndex: 1,
      playerX: 250,
    })).toBe(-1)
  })

  it('counts exact X equality as reached', () => {
    expect(findNextCheckpointIndex({
      checkpoints,
      activeCheckpointIndex: -1,
      playerX: 100,
    })).toBe(0)
  })

  it('returns the first later checkpoint reached by player X', () => {
    expect(findNextCheckpointIndex({
      checkpoints,
      activeCheckpointIndex: 0,
      playerX: 350,
    })).toBe(1)
  })

  it('returns -1 when no later checkpoint is reached', () => {
    expect(findNextCheckpointIndex({
      checkpoints,
      activeCheckpointIndex: 0,
      playerX: 150,
    })).toBe(-1)
  })
})

describe('checkpoint respawn state', () => {
  it('maps spawn fields and defaults missing gravity to the current gravity', () => {
    expect(getCheckpointRespawnState({
      checkpoint: {
        spawnX: 2600,
        spawnSurfaceY: 512,
      },
      currentGravity: 'down',
    })).toEqual({
      x: 2600,
      surfaceY: 512,
      gravity: 'down',
    })
  })

  it('preserves explicit spawn gravity', () => {
    expect(getCheckpointRespawnState({
      checkpoint: {
        spawnX: 5900,
        spawnSurfaceY: 576,
        spawnGravity: 'up',
      },
      currentGravity: 'down',
    })).toEqual({
      x: 5900,
      surfaceY: 576,
      gravity: 'up',
    })
  })
})
