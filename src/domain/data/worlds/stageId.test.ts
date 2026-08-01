import { describe, expect, it } from 'vitest'
import {
  STAGES_PER_WORLD,
  WORLD_COUNT,
  formatStageId,
  isStageId,
  parseStageId,
  worldIdFromNumber,
} from './stageId'

describe('isStageId', () => {
  it('accepts every canonical id within the world/stage grid', () => {
    for (let world = 1; world <= WORLD_COUNT; world++) {
      for (let stage = 1; stage <= STAGES_PER_WORLD; stage++) {
        expect(isStageId(`${world}-${stage}`)).toBe(true)
      }
    }
  })

  it('rejects ids outside the grid bounds', () => {
    expect(isStageId('0-1')).toBe(false)
    expect(isStageId('1-0')).toBe(false)
    expect(isStageId(`${WORLD_COUNT + 1}-1`)).toBe(false)
    expect(isStageId(`1-${STAGES_PER_WORLD + 1}`)).toBe(false)
  })

  it('rejects malformed and non-canonical spellings', () => {
    expect(isStageId('')).toBe(false)
    expect(isStageId('1')).toBe(false)
    expect(isStageId('1-2-3')).toBe(false)
    expect(isStageId('a-b')).toBe(false)
    expect(isStageId('-1')).toBe(false)
    expect(isStageId('01-2')).toBe(false)
    expect(isStageId(' 1-2')).toBe(false)
    expect(isStageId('1-2 ')).toBe(false)
    expect(isStageId('1.0-2')).toBe(false)
  })
})

describe('formatStageId / parseStageId', () => {
  it('round-trips canonical ids', () => {
    const id = formatStageId(3, 4)
    expect(id).toBe('3-4')
    expect(parseStageId(id)).toEqual({ worldNumber: 3, stageNumber: 4 })
  })
})

describe('worldIdFromNumber', () => {
  it('maps a world number to its padded world id', () => {
    expect(worldIdFromNumber(1)).toBe('world01')
    expect(worldIdFromNumber(6)).toBe('world06')
  })
})
