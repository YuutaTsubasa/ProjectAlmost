import { describe, expect, test } from 'vitest'
import {
  createEmptyStageRecords,
  isStageUnlockedByRecords,
  mergeStageClearRecord,
  parseStageTimeMs,
  rankValue,
  type StageRecordMap,
} from './progressionRules'

describe('parseStageTimeMs', () => {
  test('parses minute, second, and hundredth display time into milliseconds', () => {
    expect(parseStageTimeMs('01:23.45')).toBe(83_450)
  })
})

describe('rankValue', () => {
  test('orders ranks from uncleared through S', () => {
    expect(rankValue('--')).toBeLessThan(rankValue('D'))
    expect(rankValue('A')).toBeLessThan(rankValue('S'))
  })
})

describe('mergeStageClearRecord', () => {
  test('keeps best time, best rank, and max coins independently', () => {
    const records = createEmptyStageRecords()
    const first = mergeStageClearRecord(records, '1-1', { time: '00:30.00', rank: 'B', coins: 10 })
    const second = mergeStageClearRecord(first, '1-1', { time: '00:35.00', rank: 'A', coins: 8 })

    expect(second['1-1']).toEqual({
      cleared: true,
      bestTimeMs: 30_000,
      bestTime: '00:30.00',
      bestRank: 'A',
      maxCoins: 10,
    })
  })
})

describe('isStageUnlockedByRecords', () => {
  const stageOrder = ['1-1', '1-2', '1-3'] as const

  test('unlocks the first stage by default', () => {
    expect(isStageUnlockedByRecords({}, stageOrder, '1-1')).toBe(true)
  })

  test('unlocks a later stage when the previous stage is cleared', () => {
    const records: StageRecordMap<string> = {
      '1-1': { cleared: true, bestTimeMs: 20_000, bestTime: '00:20.00', bestRank: 'B', maxCoins: 5 },
    }
    expect(isStageUnlockedByRecords(records, stageOrder, '1-2')).toBe(true)
  })

  test('keeps a later stage locked when the previous stage is not cleared', () => {
    expect(isStageUnlockedByRecords({}, stageOrder, '1-2')).toBe(false)
  })
})
