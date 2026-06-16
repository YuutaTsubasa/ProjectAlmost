import {
  createEmptyStageRecords,
  isStageUnlockedByRecords,
  mergeStageClearRecord,
  type StageClearResult,
  type StageRecord,
} from '../../domain/progression/progressionRules'
import { stages, type StageId } from '../stages/stageRegistry'

export type { StageClearResult, StageRecord }

export type SaveData = {
  version: 1
  stageRecords: Partial<Record<StageId, StageRecord>>
}

const SAVE_KEY = 'project-almost:save'
const DEBUG_UNLOCK_KEY = 'project-almost:debugUnlockAllStages'

export function createEmptySave(): SaveData {
  return { version: 1, stageRecords: createEmptyStageRecords<StageId>() }
}

export function loadSave(): SaveData {
  try {
    const stored = localStorage.getItem(SAVE_KEY)
    if (!stored) return createEmptySave()
    const parsed = JSON.parse(stored) as SaveData
    return parsed.version === 1 ? parsed : createEmptySave()
  } catch {
    return createEmptySave()
  }
}

export function recordStageClear(save: SaveData, stageId: StageId, result: StageClearResult): SaveData {
  const next = { ...save, stageRecords: mergeStageClearRecord(save.stageRecords, stageId, result) }
  localStorage.setItem(SAVE_KEY, JSON.stringify(next))
  return next
}

export function deleteSave(): SaveData {
  localStorage.removeItem(SAVE_KEY)
  return createEmptySave()
}

export function isStageUnlocked(save: SaveData, stageId: StageId): boolean {
  if (isDebugUnlockAllStagesEnabled()) return true

  const ids = Object.keys(stages) as StageId[]
  return isStageUnlockedByRecords(save.stageRecords, ids, stageId)
}

export function isDebugUnlockAllStagesEnabled(): boolean {
  if (!import.meta.env.DEV || typeof window === 'undefined') return false

  try {
    const params = new URLSearchParams(window.location.search)
    const debugParam = params.get('debugUnlock') ?? params.get('debugUnlockStages')

    if (debugParam === '1' || debugParam === 'true') {
      localStorage.setItem(DEBUG_UNLOCK_KEY, '1')
    } else if (debugParam === '0' || debugParam === 'false') {
      localStorage.removeItem(DEBUG_UNLOCK_KEY)
    }

    return localStorage.getItem(DEBUG_UNLOCK_KEY) === '1'
  } catch {
    return false
  }
}
