import { rankValue, type Rank } from '../scoring/rank'

export type StageRecord = {
  cleared: boolean
  bestTimeMs: number
  bestTime: string
  bestRank: Rank
  maxCoins: number
}

export type StageClearResult = {
  time: string
  rank: Rank
  coins: number
}

export type StageRecordMap<TStageId extends string> = Partial<Record<TStageId, StageRecord>>

export function createEmptyStageRecords<TStageId extends string>(): StageRecordMap<TStageId> {
  return {}
}

export function parseStageTimeMs(time: string): number {
  const [minutes, rest] = time.split(':')
  const [seconds, hundredths] = rest.split('.')
  return Number(minutes) * 60_000 + Number(seconds) * 1_000 + Number(hundredths) * 10
}

export { rankValue }

export function mergeStageClearRecord<TStageId extends string>(
  records: StageRecordMap<TStageId>,
  stageId: TStageId,
  result: StageClearResult,
): StageRecordMap<TStageId> {
  const previous = records[stageId]
  const timeMs = parseStageTimeMs(result.time)
  const nextRecord: StageRecord = {
    cleared: true,
    bestTimeMs: previous ? Math.min(previous.bestTimeMs, timeMs) : timeMs,
    bestTime: previous && previous.bestTimeMs <= timeMs ? previous.bestTime : result.time,
    bestRank: previous && rankValue(previous.bestRank) >= rankValue(result.rank) ? previous.bestRank : result.rank,
    maxCoins: Math.max(previous?.maxCoins ?? 0, result.coins),
  }
  return { ...records, [stageId]: nextRecord }
}

export function isStageUnlockedByRecords<TStageId extends string>(
  records: StageRecordMap<TStageId>,
  stageOrder: readonly TStageId[],
  stageId: TStageId,
): boolean {
  const index = stageOrder.indexOf(stageId)
  return index === 0 || Boolean(records[stageOrder[index - 1]]?.cleared)
}
