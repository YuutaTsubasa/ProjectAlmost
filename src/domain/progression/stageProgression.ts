import { type ClearRank } from '../gameplay/stageResult'

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

const rankValues: Record<ClearRank, number> = {
  S: 5,
  A: 4,
  B: 3,
  C: 2,
  D: 1,
}

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
  const bestTimeIsPrevious = previous ? previous.bestTimeMs <= timeMs : false
  const bestRankIsPrevious = previous
    ? rankValues[previous.bestRank] >= rankValues[result.rank]
    : false

  return {
    ...records,
    [stageId]: {
      cleared: true,
      bestTimeMs: bestTimeIsPrevious ? previous.bestTimeMs : timeMs,
      bestTime: bestTimeIsPrevious ? previous.bestTime : result.time,
      bestRank: bestRankIsPrevious ? previous.bestRank : result.rank,
      maxCoins: Math.max(previous?.maxCoins ?? 0, result.coins),
    },
  }
}
