import { CLEAR_RANKS, type ClearRank } from '../gameplay/stageResult'

export type StageRecord = {
  cleared: boolean
  bestTimeMs: number
  bestTime: string
  bestRank: ClearRank
  maxCoins: number
}

export type StageClearResult = {
  time: string
  rank: ClearRank
  coins: number
}

export type StageRecordMap<TStageId extends string> = Partial<Record<TStageId, StageRecord>>

const rankValues: Record<ClearRank, number> = Object.fromEntries(
  CLEAR_RANKS.map((rank, index) => [rank, CLEAR_RANKS.length - index]),
) as Record<ClearRank, number>

export function createEmptyStageRecords<TStageId extends string>(): StageRecordMap<TStageId> {
  return {}
}

export function parseStageTimeMs(time: string): number {
  const [minutes = '0', rest = '0.0'] = time.split(':')
  const [seconds = '0', hundredths = '0'] = rest.split('.')

  return Number(minutes) * 60_000
    + Number(seconds) * 1_000
    + Number(hundredths.padEnd(2, '0').slice(0, 2)) * 10
}

export function mergeStageClearRecord<TStageId extends string>(
  records: StageRecordMap<TStageId>,
  stageId: TStageId,
  result: StageClearResult,
): StageRecordMap<TStageId> {
  const previous = records[stageId]
  const timeMs = parseStageTimeMs(result.time)
  const nextRecord: StageRecord = previous
    ? {
        cleared: true,
        bestTimeMs: Math.min(previous.bestTimeMs, timeMs),
        bestTime: previous.bestTimeMs <= timeMs ? previous.bestTime : result.time,
        bestRank: rankValues[previous.bestRank] >= rankValues[result.rank]
          ? previous.bestRank
          : result.rank,
        maxCoins: Math.max(previous.maxCoins, result.coins),
      }
    : {
        cleared: true,
        bestTimeMs: timeMs,
        bestTime: result.time,
        bestRank: result.rank,
        maxCoins: result.coins,
      }

  return {
    ...records,
    [stageId]: nextRecord,
  }
}

export type StageProgressionOptionState<TStageId extends string> = {
  stageId: TStageId
  unlocked: boolean
  cleared: boolean
  record: StageRecord | undefined
}

function hasClearedRecord(record: StageRecord | undefined): boolean {
  return record?.cleared === true
}

export function getNextStageId<TStageId extends string>(
  stageOrder: readonly TStageId[],
  stageId: string,
): TStageId | null {
  const stageIndex = findStageIndex(stageOrder, stageId)
  if (stageIndex < 0) return null

  return stageOrder[stageIndex + 1] ?? null
}

export function isStageUnlocked<TStageId extends string>(
  stageOrder: readonly TStageId[],
  records: StageRecordMap<TStageId>,
  stageId: string,
  debugUnlockAllStages: boolean,
): boolean {
  if (debugUnlockAllStages) return true

  const stageIndex = findStageIndex(stageOrder, stageId)
  if (stageIndex < 0) return false
  if (stageIndex === 0) return true

  return hasClearedRecord(records[stageOrder[stageIndex - 1]])
}

function findStageIndex<TStageId extends string>(
  stageOrder: readonly TStageId[],
  stageId: string,
): number {
  return stageOrder.findIndex((value) => value === stageId)
}

export function projectStageProgressionOptions<TStageId extends string>(
  stageOrder: readonly TStageId[],
  records: StageRecordMap<TStageId>,
  debugUnlockAllStages: boolean,
): StageProgressionOptionState<TStageId>[] {
  return stageOrder.map((stageId) => {
    const record = records[stageId]

    return {
      stageId,
      unlocked: isStageUnlocked(stageOrder, records, stageId, debugUnlockAllStages),
      cleared: hasClearedRecord(record),
      record,
    }
  })
}
