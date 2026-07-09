import {
  createEmptyStageRecords,
  mergeStageClearRecord,
  type StageClearResult,
  type StageRecord,
} from '../../domain/progression/stageProgression'
import type { StageId } from '../../domain/data/worlds/worldTypes'

export const STAGE_PROGRESSION_SAVE_KEY = 'project-almost:save'

export type StageProgressionSave = {
  version: 1
  stageRecords: Partial<Record<StageId, StageRecord>>
}

export type ProgressionStorage = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

export function createEmptySave(): StageProgressionSave {
  return {
    version: 1,
    stageRecords: createEmptyStageRecords<StageId>(),
  }
}

function isStageProgressionSave(value: unknown): value is StageProgressionSave {
  if (!value || typeof value !== 'object') return false

  const candidate = value as { version?: unknown; stageRecords?: unknown }
  if (candidate.version !== 1 || !candidate.stageRecords || typeof candidate.stageRecords !== 'object') return false
  if (Array.isArray(candidate.stageRecords)) return false

  return Object.entries(candidate.stageRecords).every(([stageId, record]) =>
    isStageId(stageId) && isStageRecord(record),
  )
}

function isStageId(value: string): value is StageId {
  return /^[1-6]-[1-6]$/.test(value)
}

function isStageTimeLabel(value: unknown): value is string {
  return typeof value === 'string' && /^\d{2}:\d{2}\.\d{2}$/.test(value)
}

function isStageRecord(value: unknown): value is StageRecord {
  if (!value || typeof value !== 'object') return false

  const candidate = value as {
    cleared?: unknown
    bestTimeMs?: unknown
    bestTime?: unknown
    bestRank?: unknown
    maxCoins?: unknown
  }

  return candidate.cleared === true || candidate.cleared === false
    ? typeof candidate.bestTimeMs === 'number'
      && Number.isInteger(candidate.bestTimeMs)
      && Number.isFinite(candidate.bestTimeMs)
      && candidate.bestTimeMs >= 0
      && isStageTimeLabel(candidate.bestTime)
      && typeof candidate.bestRank === 'string'
      && (candidate.bestRank === 'S'
        || candidate.bestRank === 'A'
        || candidate.bestRank === 'B'
        || candidate.bestRank === 'C'
        || candidate.bestRank === 'D')
      && typeof candidate.maxCoins === 'number'
      && Number.isInteger(candidate.maxCoins)
      && Number.isFinite(candidate.maxCoins)
      && candidate.maxCoins >= 0
    : false
}

export function loadStageProgressionSave(storage: ProgressionStorage): StageProgressionSave {
  try {
    const stored = storage.getItem(STAGE_PROGRESSION_SAVE_KEY)
    if (!stored) return createEmptySave()

    const parsed = JSON.parse(stored) as unknown
    return isStageProgressionSave(parsed) ? parsed : createEmptySave()
  } catch {
    return createEmptySave()
  }
}

export function writeStageProgressionSave(
  storage: ProgressionStorage,
  save: StageProgressionSave,
): StageProgressionSave {
  storage.setItem(STAGE_PROGRESSION_SAVE_KEY, JSON.stringify(save))
  return save
}

export function recordStageClear(
  storage: ProgressionStorage,
  save: StageProgressionSave,
  stageId: StageId,
  result: StageClearResult,
): StageProgressionSave {
  return writeStageProgressionSave(storage, {
    ...save,
    stageRecords: mergeStageClearRecord(save.stageRecords, stageId, result),
  })
}

export function deleteStageProgressionSave(storage: ProgressionStorage): StageProgressionSave {
  storage.removeItem(STAGE_PROGRESSION_SAVE_KEY)
  return createEmptySave()
}
