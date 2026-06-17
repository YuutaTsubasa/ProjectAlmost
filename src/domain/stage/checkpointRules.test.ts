import { describe, expect, it } from 'vitest'
import { getReachedCheckpointCount } from './checkpointRules'

describe('getReachedCheckpointCount', () => {
  it.each([
    [-1, 0],
    [0, 1],
    [2, 3],
  ])('converts active checkpoint index %i to %i reached checkpoints', (activeCheckpointIndex, expected) => {
    expect(getReachedCheckpointCount({ activeCheckpointIndex })).toBe(expected)
  })
})
