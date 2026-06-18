import { describe, expect, it } from 'vitest'
import { findNextCheckpointIndex, getCheckpointTargetCount, getReachedCheckpointCount } from './checkpointRules'

describe('getReachedCheckpointCount', () => {
  it.each([
    [-1, 0],
    [0, 1],
    [2, 3],
  ])('converts active checkpoint index %i to %i reached checkpoints', (activeCheckpointIndex, expected) => {
    expect(getReachedCheckpointCount({ activeCheckpointIndex })).toBe(expected)
  })
})

describe('getCheckpointTargetCount', () => {
  it('returns zero when a stage has no checkpoints', () => {
    expect(getCheckpointTargetCount({ checkpoints: [] })).toBe(0)
  })

  it('returns the number of checkpoint entries', () => {
    expect(getCheckpointTargetCount({
      checkpoints: [
        { x: 100 },
        { x: 250 },
        { x: 400 },
      ],
    })).toBe(3)
  })
})

describe('findNextCheckpointIndex', () => {
  it('returns -1 when no checkpoints exist', () => {
    expect(findNextCheckpointIndex({
      checkpoints: [],
      activeCheckpointIndex: -1,
      playerX: 100,
    })).toBe(-1)
  })

  it('ignores checkpoints at or before the active checkpoint index', () => {
    expect(findNextCheckpointIndex({
      checkpoints: [
        { x: 100 },
        { x: 200 },
      ],
      activeCheckpointIndex: 0,
      playerX: 150,
    })).toBe(-1)
  })

  it('counts a checkpoint as reached when player x is exactly on it', () => {
    expect(findNextCheckpointIndex({
      checkpoints: [
        { x: 100 },
        { x: 200 },
      ],
      activeCheckpointIndex: 0,
      playerX: 200,
    })).toBe(1)
  })

  it('returns the first reachable checkpoint after the active index', () => {
    expect(findNextCheckpointIndex({
      checkpoints: [
        { x: 100 },
        { x: 200 },
        { x: 300 },
      ],
      activeCheckpointIndex: -1,
      playerX: 350,
    })).toBe(0)
  })

  it('returns -1 when no checkpoint after the active index is reachable', () => {
    expect(findNextCheckpointIndex({
      checkpoints: [
        { x: 100 },
        { x: 200 },
      ],
      activeCheckpointIndex: 0,
      playerX: 199,
    })).toBe(-1)
  })
})
