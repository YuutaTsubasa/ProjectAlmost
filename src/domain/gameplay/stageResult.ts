export type ClearRank = 'S' | 'A' | 'B' | 'C' | 'D'

export type RankTargets = {
  sTime: number
  aTime: number
  bTime: number
  cTime: number
}

export type StageScoreInput = {
  elapsedMs: number
  rankTargets: RankTargets
  coins: number
  coinTarget: number
  enemiesDefeated: number
  enemyTarget: number
  checkpointsReached: number
  checkpointTarget: number
  damageTaken: number
  falls: number
}

export type StageScoreBreakdown = {
  baseScore: number
  timeScore: number
  coinScore: number
  enemyScore: number
  checkpointScore: number
  damagePenalty: number
  fallPenalty: number
  totalScore: number
}

export type StageResultRowsInput = Pick<
  StageScoreInput,
  'coins' | 'coinTarget' | 'damageTaken' | 'falls' | 'enemiesDefeated' | 'enemyTarget' | 'checkpointsReached' | 'checkpointTarget'
>

export type StageResultRowStates = {
  coinsPerfect: boolean
  damagePerfect: boolean
  fallsPerfect: boolean
  enemiesPerfect: boolean
  checkpointsPerfect: boolean
}

export type StageResultActionType = 'retry' | 'stage-select' | 'next-stage'

export type StageResultActionState = {
  type: StageResultActionType
  disabled: boolean
}

const baseScore = 300
const perfectTimeScore = 300
const aTimeScore = 240
const bTimeScore = 170
const cTimeScore = 100
const timeDecayPerSecond = 3
const maxCoinScore = 200
const maxEnemyScore = 150
const maxCheckpointScore = 50
const damagePenaltyValue = 80
const fallPenaltyValue = 180

function scoreRatioScore(value: number, target: number, maxScore: number): number {
  if (target <= 0) return maxScore
  return Math.floor((Math.max(0, value) / target) * maxScore)
}

function getTimeScore(input: Pick<StageScoreInput, 'elapsedMs' | 'rankTargets'>): number {
  const elapsedSeconds = input.elapsedMs / 1000
  if (elapsedSeconds <= input.rankTargets.sTime) return perfectTimeScore
  if (elapsedSeconds <= input.rankTargets.aTime) return aTimeScore
  if (elapsedSeconds <= input.rankTargets.bTime) return bTimeScore
  if (elapsedSeconds <= input.rankTargets.cTime) return cTimeScore

  return Math.max(0, cTimeScore - Math.floor(elapsedSeconds - input.rankTargets.cTime) * timeDecayPerSecond)
}

export function scoreStageResult(input: StageScoreInput): StageScoreBreakdown {
  const timeScore = getTimeScore(input)
  const coinScore = scoreRatioScore(input.coins, input.coinTarget, maxCoinScore)
  const enemyScore = scoreRatioScore(input.enemiesDefeated, input.enemyTarget, maxEnemyScore)
  const checkpointScore = scoreRatioScore(input.checkpointsReached, input.checkpointTarget, maxCheckpointScore)
  const damagePenalty = Math.max(0, input.damageTaken) * damagePenaltyValue
  const fallPenalty = Math.max(0, input.falls) * fallPenaltyValue
  const totalScore = baseScore + timeScore + coinScore + enemyScore + checkpointScore - damagePenalty - fallPenalty

  return {
    baseScore,
    timeScore,
    coinScore,
    enemyScore,
    checkpointScore,
    damagePenalty,
    fallPenalty,
    totalScore,
  }
}

export function calculateStageRank(input: StageScoreInput): ClearRank {
  const total = scoreStageResult(input).totalScore
  if (total >= 850) return 'S'
  if (total >= 700) return 'A'
  if (total >= 550) return 'B'
  if (total >= 400) return 'C'
  return 'D'
}

export function getStageResultRowStates(input: StageResultRowsInput): StageResultRowStates {
  return {
    coinsPerfect: input.coins === input.coinTarget,
    damagePerfect: input.damageTaken === 0,
    fallsPerfect: input.falls === 0,
    enemiesPerfect: input.enemiesDefeated === input.enemyTarget,
    checkpointsPerfect: input.checkpointsReached === input.checkpointTarget,
  }
}

export function getResultActionStates(input: {
  nextStageAvailable: boolean
}): StageResultActionState[] {
  return [
    { type: 'retry', disabled: false },
    { type: 'stage-select', disabled: false },
    { type: 'next-stage', disabled: !input.nextStageAvailable },
  ]
}
