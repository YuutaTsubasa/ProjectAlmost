import type { ClearRank } from './rank'

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

const BASE_SCORE = 300
const PERFECT_TIME_SCORE = 300
const A_TIME_SCORE = 240
const B_TIME_SCORE = 170
const C_TIME_SCORE = 100
const LATE_TIME_DECAY_PER_SECOND = 3
const MAX_COIN_SCORE = 200
const MAX_ENEMY_SCORE = 150
const MAX_CHECKPOINT_SCORE = 50
const DAMAGE_PENALTY = 80
const FALL_PENALTY = 180
const S_SCORE_THRESHOLD = 850
const A_SCORE_THRESHOLD = 700
const B_SCORE_THRESHOLD = 550
const C_SCORE_THRESHOLD = 400

export function scoreStageResult(input: StageScoreInput): StageScoreBreakdown {
  const elapsedSeconds = input.elapsedMs / 1000
  const { sTime, aTime, bTime, cTime } = input.rankTargets

  let timeScore = PERFECT_TIME_SCORE
  if (elapsedSeconds > sTime && elapsedSeconds <= aTime) timeScore = A_TIME_SCORE
  else if (elapsedSeconds > aTime && elapsedSeconds <= bTime) timeScore = B_TIME_SCORE
  else if (elapsedSeconds > bTime && elapsedSeconds <= cTime) timeScore = C_TIME_SCORE
  else if (elapsedSeconds > cTime) timeScore = Math.max(0, C_TIME_SCORE - (elapsedSeconds - cTime) * LATE_TIME_DECAY_PER_SECOND)

  const coinScore = input.coinTarget > 0 ? (input.coins / input.coinTarget) * MAX_COIN_SCORE : MAX_COIN_SCORE
  const enemyScore = input.enemyTarget > 0 ? (input.enemiesDefeated / input.enemyTarget) * MAX_ENEMY_SCORE : MAX_ENEMY_SCORE
  const checkpointScore = input.checkpointTarget > 0
    ? (input.checkpointsReached / input.checkpointTarget) * MAX_CHECKPOINT_SCORE
    : MAX_CHECKPOINT_SCORE
  const damagePenalty = input.damageTaken * DAMAGE_PENALTY
  const fallPenalty = input.falls * FALL_PENALTY

  return {
    baseScore: BASE_SCORE,
    timeScore,
    coinScore,
    enemyScore,
    checkpointScore,
    damagePenalty,
    fallPenalty,
    totalScore: BASE_SCORE + timeScore + coinScore + enemyScore + checkpointScore - damagePenalty - fallPenalty,
  }
}

export function calculateStageRank(input: StageScoreInput): ClearRank {
  const score = scoreStageResult(input).totalScore

  if (score >= S_SCORE_THRESHOLD) return 'S'
  if (score >= A_SCORE_THRESHOLD) return 'A'
  if (score >= B_SCORE_THRESHOLD) return 'B'
  if (score >= C_SCORE_THRESHOLD) return 'C'
  return 'D'
}
