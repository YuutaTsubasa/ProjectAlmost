import { describe, expect, it } from 'vitest'
import {
  createEmptySave,
  deleteStageProgressionSave,
  loadStageProgressionSave,
  recordStageClear,
  STAGE_PROGRESSION_SAVE_KEY,
  type ProgressionStorage,
} from './browserStageProgressionStore'

function createMemoryStorage(initial: Record<string, string> = {}): ProgressionStorage & {
  snapshot: () => Record<string, string>
} {
  const values = { ...initial }

  return {
    getItem: (key) => values[key] ?? null,
    setItem: (key, value) => {
      values[key] = value
    },
    removeItem: (key) => {
      delete values[key]
    },
    snapshot: () => ({ ...values }),
  }
}

describe('browser stage progression store', () => {
  it('creates an empty versioned save', () => {
    expect(createEmptySave()).toEqual({ version: 1, stageRecords: {} })
  })

  it('loads an empty save when storage has no save', () => {
    expect(loadStageProgressionSave(createMemoryStorage())).toEqual(createEmptySave())
  })

  it('loads an empty save when storage JSON is malformed', () => {
    const storage = createMemoryStorage({ [STAGE_PROGRESSION_SAVE_KEY]: '{not-json' })

    expect(loadStageProgressionSave(storage)).toEqual(createEmptySave())
  })

  it('loads an empty save when storage version is unsupported', () => {
    const storage = createMemoryStorage({
      [STAGE_PROGRESSION_SAVE_KEY]: JSON.stringify({ version: 99, stageRecords: { '1-1': { cleared: true } } }),
    })

    expect(loadStageProgressionSave(storage)).toEqual(createEmptySave())
  })

  it('records a stage clear by merging records and writing storage', () => {
    const storage = createMemoryStorage()
    const first = recordStageClear(storage, createEmptySave(), '1-1', {
      time: '01:23.45',
      rank: 'B',
      coins: 7,
    })
    const second = recordStageClear(storage, first, '1-1', {
      time: '01:30.00',
      rank: 'S',
      coins: 5,
    })

    expect(second.stageRecords['1-1']).toEqual({
      cleared: true,
      bestTimeMs: 83_450,
      bestTime: '01:23.45',
      bestRank: 'S',
      maxCoins: 7,
    })
    expect(JSON.parse(storage.snapshot()[STAGE_PROGRESSION_SAVE_KEY] ?? '')).toEqual(second)
  })

  it('deletes the save key and returns an empty save', () => {
    const storage = createMemoryStorage({
      [STAGE_PROGRESSION_SAVE_KEY]: JSON.stringify({
        version: 1,
        stageRecords: { '1-1': { cleared: true, bestTimeMs: 1, bestTime: '00:00.01', bestRank: 'S', maxCoins: 1 } },
      }),
    })

    expect(deleteStageProgressionSave(storage)).toEqual(createEmptySave())
    expect(storage.snapshot()).toEqual({})
  })
})
