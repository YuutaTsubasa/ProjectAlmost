import { describe, expect, it } from 'vitest'
import {
  createEmptySave,
  deleteStageProgressionSave,
  loadStageProgressionSave,
  recordStageClear,
  getDebugUnlockAllStages,
  resolveDebugUnlockAllStages,
  STAGE_PROGRESSION_DEBUG_UNLOCK_KEY,
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

  it('loads an empty save when stage records is not an object', () => {
    const storage = createMemoryStorage({
      [STAGE_PROGRESSION_SAVE_KEY]: JSON.stringify({ version: 1, stageRecords: [] }),
    })

    expect(loadStageProgressionSave(storage)).toEqual(createEmptySave())
  })

  it('loads an empty save when stage records contain malformed payloads', () => {
    const storage = createMemoryStorage({
      [STAGE_PROGRESSION_SAVE_KEY]: JSON.stringify({
        version: 1,
        stageRecords: {
          '1-1': { cleared: true, bestTimeMs: 1000, bestTime: '00:01.00', bestRank: 'S', maxCoins: 1 },
          '1-2': { cleared: true, bestTimeMs: 'bad', bestTime: '00:01.00', bestRank: 'S', maxCoins: 1 },
        },
      }),
    })

    expect(loadStageProgressionSave(storage)).toEqual(createEmptySave())
  })

  it('loads an empty save when stage records mark cleared as false', () => {
    const storage = createMemoryStorage({
      [STAGE_PROGRESSION_SAVE_KEY]: JSON.stringify({
        version: 1,
        stageRecords: {
          '1-1': { cleared: false, bestTimeMs: 1000, bestTime: '00:01.00', bestRank: 'S', maxCoins: 1 },
        },
      }),
    })

    expect(loadStageProgressionSave(storage)).toEqual(createEmptySave())
  })

  it('loads an empty save when stage records contain contradictory best time values', () => {
    const storage = createMemoryStorage({
      [STAGE_PROGRESSION_SAVE_KEY]: JSON.stringify({
        version: 1,
        stageRecords: {
          '1-1': { cleared: true, bestTimeMs: 2_000, bestTime: '00:01.00', bestRank: 'S', maxCoins: 1 },
        },
      }),
    })

    expect(loadStageProgressionSave(storage)).toEqual(createEmptySave())
  })

  it('loads an empty save when stage keys are outside stage id format', () => {
    const storage = createMemoryStorage({
      [STAGE_PROGRESSION_SAVE_KEY]: JSON.stringify({
        version: 1,
        stageRecords: {
          '9-9': { cleared: true, bestTimeMs: 1000, bestTime: '00:01.00', bestRank: 'S', maxCoins: 1 },
        },
      }),
    })

    expect(loadStageProgressionSave(storage)).toEqual(createEmptySave())
  })

  it('loads an empty save when stage records contain invalid numeric values', () => {
    const storage = createMemoryStorage({
      [STAGE_PROGRESSION_SAVE_KEY]: JSON.stringify({
        version: 1,
        stageRecords: {
          '1-1': { cleared: true, bestTimeMs: -1000, bestTime: '00:01.00', bestRank: 'S', maxCoins: 1 },
          '1-2': { cleared: true, bestTimeMs: 1000, bestTime: '00:01.00', bestRank: 'S', maxCoins: 1.5 },
        },
      }),
    })

    expect(loadStageProgressionSave(storage)).toEqual(createEmptySave())
  })

  it('loads an empty save when stage records contain invalid time labels', () => {
    const storage = createMemoryStorage({
      [STAGE_PROGRESSION_SAVE_KEY]: JSON.stringify({
        version: 1,
        stageRecords: {
          '1-1': { cleared: true, bestTimeMs: 1000, bestTime: 'oops', bestRank: 'S', maxCoins: 1 },
        },
      }),
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

describe('browser stage progression debug unlock', () => {
  it('enables debug unlock from development query params and persists the flag', () => {
    const storage = createMemoryStorage()

    expect(resolveDebugUnlockAllStages({
      storage,
      search: '?debugUnlock=1',
      dev: true,
    })).toBe(true)
    expect(storage.snapshot()[STAGE_PROGRESSION_DEBUG_UNLOCK_KEY]).toBe('true')
  })

  it('also supports the debugUnlockStages query param', () => {
    const storage = createMemoryStorage()

    expect(resolveDebugUnlockAllStages({
      storage,
      search: '?debugUnlockStages=true',
      dev: true,
    })).toBe(true)
    expect(storage.snapshot()[STAGE_PROGRESSION_DEBUG_UNLOCK_KEY]).toBe('true')
  })

  it('clears debug unlock from development falsey query params', () => {
    const storage = createMemoryStorage({ [STAGE_PROGRESSION_DEBUG_UNLOCK_KEY]: 'true' })

    expect(resolveDebugUnlockAllStages({
      storage,
      search: '?debugUnlock=false',
      dev: true,
    })).toBe(false)
    expect(storage.snapshot()[STAGE_PROGRESSION_DEBUG_UNLOCK_KEY]).toBeUndefined()
  })

  it('loads the persisted debug unlock flag when no query override is present', () => {
    const storage = createMemoryStorage({ [STAGE_PROGRESSION_DEBUG_UNLOCK_KEY]: 'true' })

    expect(getDebugUnlockAllStages(storage, true)).toBe(true)
    expect(resolveDebugUnlockAllStages({ storage, search: '', dev: true })).toBe(true)
  })

  it('ignores debug unlock outside development mode', () => {
    const storage = createMemoryStorage({ [STAGE_PROGRESSION_DEBUG_UNLOCK_KEY]: 'true' })

    expect(getDebugUnlockAllStages(storage, false)).toBe(false)
    expect(resolveDebugUnlockAllStages({
      storage,
      search: '?debugUnlock=1',
      dev: false,
    })).toBe(false)
    expect(storage.snapshot()[STAGE_PROGRESSION_DEBUG_UNLOCK_KEY]).toBe('true')
  })

  it('enables debug unlock from Netlify deploy preview query params', () => {
    const storage = createMemoryStorage()

    expect(resolveDebugUnlockAllStages({
      storage,
      search: '?debugUnlock=1',
      dev: false,
      hostname: 'deploy-preview-8--projectalmost.netlify.app',
    })).toBe(true)
    expect(storage.snapshot()[STAGE_PROGRESSION_DEBUG_UNLOCK_KEY]).toBe('true')
  })

  it('keeps debug unlock disabled on production deploy hostnames', () => {
    const storage = createMemoryStorage({ [STAGE_PROGRESSION_DEBUG_UNLOCK_KEY]: 'true' })

    expect(resolveDebugUnlockAllStages({
      storage,
      search: '?debugUnlock=1',
      dev: false,
      hostname: 'projectalmost.netlify.app',
    })).toBe(false)
    expect(storage.snapshot()[STAGE_PROGRESSION_DEBUG_UNLOCK_KEY]).toBe('true')
  })

  it('delete save preserves the debug unlock flag', () => {
    const storage = createMemoryStorage({
      [STAGE_PROGRESSION_SAVE_KEY]: JSON.stringify(createEmptySave()),
      [STAGE_PROGRESSION_DEBUG_UNLOCK_KEY]: 'true',
    })

    deleteStageProgressionSave(storage)

    expect(storage.snapshot()).toEqual({ [STAGE_PROGRESSION_DEBUG_UNLOCK_KEY]: 'true' })
  })
})
