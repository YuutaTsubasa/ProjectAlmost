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
  return candidate.version === 1
    && Boolean(candidate.stageRecords)
    && typeof candidate.stageRecords === 'object'
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
