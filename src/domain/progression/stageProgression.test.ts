import { describe, expect, it } from 'vitest'
import {
  createEmptyStageRecords,
  mergeStageClearRecord,
  parseStageTimeMs,
  getNextStageId,
  isStageUnlocked,
  projectStageProgressionOptions,
  type StageRecordMap,
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
    const records: StageRecordMap<'1-1' | '1-2'> = mergeStageClearRecord({}, '1-1', {
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

describe('stage unlock projection', () => {
  const order: readonly string[] = ['1-1', '1-2', '1-3']
  const clearRecord = {
    cleared: true,
    bestTimeMs: 10_000,
    bestTime: '00:10.00',
    bestRank: 'A',
    maxCoins: 3,
  } as const

  it('unlocks the first ordered stage for empty records', () => {
    expect(isStageUnlocked(order, {}, '1-1', false)).toBe(true)
  })

  it('locks later stages until the previous ordered stage is cleared', () => {
    expect(isStageUnlocked(order, {}, '1-2', false)).toBe(false)
    expect(isStageUnlocked(order, { '1-1': clearRecord }, '1-2', false)).toBe(true)
    expect(isStageUnlocked(order, { '1-2': clearRecord }, '1-3', false)).toBe(true)
  })

  it('does not unlock unknown stages unless debug unlock is enabled', () => {
    expect(isStageUnlocked(order, { '1-1': clearRecord }, '9-9', false)).toBe(false)
    expect(isStageUnlocked(order, {}, '9-9', true)).toBe(true)
  })

  it('looks up the next stage from catalog order', () => {
    expect(getNextStageId(order, '1-1')).toBe('1-2')
    expect(getNextStageId(order, '1-3')).toBeNull()
    expect(getNextStageId(order, '9-9')).toBeNull()
  })

  it('projects locked, unlocked, and cleared option states', () => {
    expect(projectStageProgressionOptions(order, { '1-1': clearRecord }, false)).toEqual([
      { stageId: '1-1', unlocked: true, cleared: true, record: clearRecord },
      { stageId: '1-2', unlocked: true, cleared: false, record: undefined },
      { stageId: '1-3', unlocked: false, cleared: false, record: undefined },
    ])
  })

  it('projects every ordered stage as unlocked when debug unlock is enabled', () => {
    expect(projectStageProgressionOptions(order, {}, true).map((state) => state.unlocked)).toEqual([
      true,
      true,
      true,
    ])
  })
})
