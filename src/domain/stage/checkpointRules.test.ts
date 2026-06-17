import { describe, expect, it } from 'vitest'
import { getCheckpointTargetCount, getReachedCheckpointCount } from './checkpointRules'

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
