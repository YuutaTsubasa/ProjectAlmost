import { stages, type StageId } from '../stages/stageRegistry'

export type StageRecord = {
  cleared: boolean
  bestTimeMs: number
  bestTime: string
  bestRank: string
  maxCoins: number
}

export type SaveData = {
  version: 1
  stageRecords: Partial<Record<StageId, StageRecord>>
}

export type StageClearResult = {
  time: string
  rank: string
  coins: number
}

const SAVE_KEY = 'project-almost:save'
const RANK_ORDER = ['--', 'D', 'C', 'B', 'A', 'S']

export function createEmptySave(): SaveData {
  return { version: 1, stageRecords: {} }
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
  const previous = save.stageRecords[stageId]
  const timeMs = parseTime(result.time)
  const nextRecord: StageRecord = {
    cleared: true,
    bestTimeMs: previous ? Math.min(previous.bestTimeMs, timeMs) : timeMs,
    bestTime: previous && previous.bestTimeMs <= timeMs ? previous.bestTime : result.time,
    bestRank: previous && rankValue(previous.bestRank) >= rankValue(result.rank) ? previous.bestRank : result.rank,
    maxCoins: Math.max(previous?.maxCoins ?? 0, result.coins),
  }
  const next = { ...save, stageRecords: { ...save.stageRecords, [stageId]: nextRecord } }
  localStorage.setItem(SAVE_KEY, JSON.stringify(next))
  return next
}

export function deleteSave(): SaveData {
  localStorage.removeItem(SAVE_KEY)
  return createEmptySave()
}

export function isStageUnlocked(save: SaveData, stageId: StageId): boolean {
  const ids = Object.keys(stages) as StageId[]
  const index = ids.indexOf(stageId)
  return index === 0 || Boolean(save.stageRecords[ids[index - 1]]?.cleared)
}

function parseTime(time: string): number {
  const [minutes, rest] = time.split(':')
  const [seconds, hundredths] = rest.split('.')
  return Number(minutes) * 60_000 + Number(seconds) * 1_000 + Number(hundredths) * 10
}

function rankValue(rank: string): number {
  return RANK_ORDER.indexOf(rank)
}
