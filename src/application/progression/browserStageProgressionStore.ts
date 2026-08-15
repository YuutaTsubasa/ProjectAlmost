import {
  createEmptyStageRecords,
  mergeStageClearRecord,
  parseStageTimeMs,
  type StageClearResult,
  type StageRecord,
} from '../../domain/progression/stageProgression'
import type { StageId } from '../../domain/data/worlds/worldTypes'
import { isStageId } from '../../domain/data/worlds/stageId'
import { isClearRank } from '../../domain/gameplay/stageResult'
import { storageKey } from '../../domain/app/projectIdentity'

export const STAGE_PROGRESSION_SAVE_KEY = storageKey('save')
export const STAGE_PROGRESSION_DEBUG_UNLOCK_KEY = storageKey('debugUnlockAllStages')

export type StageProgressionSave = {
  version: 1
  stageRecords: Partial<Record<StageId, StageRecord>>
}

export type DebugUnlockResolutionInput = {
  storage: ProgressionStorage
  search: string
  dev: boolean
  hostname?: string
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

  return candidate.cleared === true
    && typeof candidate.bestTimeMs === 'number'
      && Number.isInteger(candidate.bestTimeMs)
      && Number.isFinite(candidate.bestTimeMs)
      && candidate.bestTimeMs >= 0
      && isStageTimeLabel(candidate.bestTime)
      && parseStageTimeMs(candidate.bestTime) === candidate.bestTimeMs
      && isClearRank(candidate.bestRank)
      && typeof candidate.maxCoins === 'number'
      && Number.isInteger(candidate.maxCoins)
      && Number.isFinite(candidate.maxCoins)
      && candidate.maxCoins >= 0
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

function parseDebugUnlockQuery(search: string): boolean | null {
  const params = new URLSearchParams(search)
  const rawValue = params.get('debugUnlock') ?? params.get('debugUnlockStages')
  if (rawValue === '1' || rawValue === 'true') return true
  if (rawValue === '0' || rawValue === 'false') return false

  return null
}

export function getDebugUnlockAllStages(storage: ProgressionStorage, dev: boolean): boolean {
  return dev && storage.getItem(STAGE_PROGRESSION_DEBUG_UNLOCK_KEY) === 'true'
}

function canUseDebugUnlock(input: Pick<DebugUnlockResolutionInput, 'dev' | 'hostname'>): boolean {
  return input.dev || /^deploy-preview-\d+--projectalmost\.netlify\.app$/.test(input.hostname ?? '')
}

export function resolveDebugUnlockAllStages(input: DebugUnlockResolutionInput): boolean {
  if (!canUseDebugUnlock(input)) return false

  const queryValue = parseDebugUnlockQuery(input.search)
  if (queryValue === true) {
    input.storage.setItem(STAGE_PROGRESSION_DEBUG_UNLOCK_KEY, 'true')
    return true
  }
  if (queryValue === false) {
    input.storage.removeItem(STAGE_PROGRESSION_DEBUG_UNLOCK_KEY)
    return false
  }

  return getDebugUnlockAllStages(input.storage, true)
}
