import { describe, expect, it } from 'vitest'
import {
  createEmptyStageRecords,
  mergeStageClearRecord,
  parseStageTimeMs,
} from './stageProgression'

describe('stage progression record rules', () => {
  it('starts with no stage records', () => {
    expect(createEmptyStageRecords<'1-1'>()).toEqual({})
  })

  it('parses Prototype stage result time strings as milliseconds', () => {
    expect(parseStageTimeMs('00:00.00')).toBe(0)
    expect(parseStageTimeMs('01:23.45')).toBe(83_450)
    expect(parseStageTimeMs('12:03.07')).toBe(723_070)
  })

  it('creates a cleared record from the first result', () => {
    expect(
      mergeStageClearRecord({}, '1-1', {
        time: '01:23.45',
        rank: 'B',
        coins: 7,
      }),
    ).toEqual({
      '1-1': {
        cleared: true,
        bestTimeMs: 83_450,
        bestTime: '01:23.45',
        bestRank: 'B',
        maxCoins: 7,
      },
    })
  })

  it('keeps best time, best rank, and max coins independently', () => {
    const records = mergeStageClearRecord({}, '1-1', {
      time: '01:23.45',
      rank: 'B',
      coins: 7,
    })

    expect(
      mergeStageClearRecord(records, '1-1', {
        time: '01:30.00',
        rank: 'S',
        coins: 5,
      }),
    ).toEqual({
      '1-1': {
        cleared: true,
        bestTimeMs: 83_450,
        bestTime: '01:23.45',
        bestRank: 'S',
        maxCoins: 7,
      },
    })

    expect(
      mergeStageClearRecord(records, '1-1', {
        time: '01:00.00',
        rank: 'C',
        coins: 9,
      }),
    ).toEqual({
      '1-1': {
        cleared: true,
        bestTimeMs: 60_000,
        bestTime: '01:00.00',
        bestRank: 'B',
        maxCoins: 9,
      },
    })
  })

  it('preserves other stage records when merging one stage', () => {
    const records = mergeStageClearRecord({}, '1-1', {
      time: '00:50.00',
      rank: 'A',
      coins: 4,
    })

    expect(
      mergeStageClearRecord(records, '1-2', {
        time: '01:10.00',
        rank: 'B',
        coins: 6,
      }),
    ).toMatchObject({
      '1-1': {
        cleared: true,
        bestTime: '00:50.00',
      },
      '1-2': {
        cleared: true,
        bestTime: '01:10.00',
      },
    })
  })
})
