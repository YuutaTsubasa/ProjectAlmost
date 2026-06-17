import { describe, expect, it } from 'vitest'
import { getHudProgress } from './hudProgressRules'

describe('getHudProgress', () => {
  it.each([
    [{ position: 0, worldSize: 1000 }, 0],
    [{ position: 250, worldSize: 1000 }, 0.25],
    [{ position: 1000, worldSize: 1000 }, 1],
    [{ position: -20, worldSize: 1000 }, 0],
    [{ position: 1200, worldSize: 1000 }, 1],
  ])('normalizes and clamps progress %#', (input, expected) => {
    expect(getHudProgress(input)).toBe(expected)
  })
})
