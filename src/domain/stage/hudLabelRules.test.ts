import { describe, expect, it } from 'vitest'
import { formatCoinLabel, formatHealthLabel } from './hudLabelRules'

describe('formatHealthLabel', () => {
  it.each([
    [{ current: 3, max: 3 }, 'HP 3/3'],
    [{ current: 0, max: 3 }, 'HP 0/3'],
  ])('formats health %#', (input, expected) => {
    expect(formatHealthLabel(input)).toBe(expected)
  })
})

describe('formatCoinLabel', () => {
  it.each([
    [{ collected: 0, target: 25 }, 'COIN 000 / 25'],
    [{ collected: 7, target: 25 }, 'COIN 007 / 25'],
    [{ collected: 25, target: 25 }, 'COIN 025 / 25'],
    [{ collected: 125, target: 125 }, 'COIN 125 / 125'],
  ])('formats coins %#', (input, expected) => {
    expect(formatCoinLabel(input)).toBe(expected)
  })
})
