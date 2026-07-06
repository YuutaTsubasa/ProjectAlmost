import { describe, expect, it } from 'vitest'
import {
  calculateStageRank,
  getResultActionStates,
  getStageResultRowStates,
  scoreStageResult,
  type RankTargets,
} from './stageResult'

const rankTargets: RankTargets = {
  sTime: 20,
  aTime: 30,
  bTime: 40,
  cTime: 50,
}

describe('stage result scoring', () => {
  it('awards S rank for a perfect target result', () => {
    expect(calculateStageRank({
      elapsedMs: 20_000,
      rankTargets,
      coins: 10,
      coinTarget: 10,
      enemiesDefeated: 4,
      enemyTarget: 4,
      checkpointsReached: 3,
      checkpointTarget: 3,
      damageTaken: 0,
      falls: 0,
    })).toBe('S')
  })

  it('uses exact score thresholds for A, B, and C ranks', () => {
    const base = {
      rankTargets,
      coins: 0,
      coinTarget: 10,
      enemiesDefeated: 0,
      enemyTarget: 4,
      checkpointsReached: 0,
      checkpointTarget: 3,
      damageTaken: 0,
      falls: 0,
    }

    expect(calculateStageRank({ ...base, elapsedMs: 20_000, coins: 8 })).toBe('A')
    expect(calculateStageRank({ ...base, elapsedMs: 20_000, coins: 4 })).toBe('B')
    expect(calculateStageRank({ ...base, elapsedMs: 50_000 })).toBe('C')
    expect(calculateStageRank({
      elapsedMs: 20_000,
      rankTargets,
      coins: 5,
      coinTarget: 10,
      enemiesDefeated: 0,
      enemyTarget: 4,
      checkpointsReached: 0,
      checkpointTarget: 3,
      damageTaken: 0,
      falls: 0,
    })).toBe('A')
  })

  it('returns D below the C threshold', () => {
    expect(calculateStageRank({
      elapsedMs: 90_000,
      rankTargets,
      coins: 0,
      coinTarget: 10,
      enemiesDefeated: 0,
      enemyTarget: 4,
      checkpointsReached: 0,
      checkpointTarget: 3,
      damageTaken: 1,
      falls: 1,
    })).toBe('D')
  })

  it('decays time score after the C target', () => {
    expect(scoreStageResult({
      elapsedMs: 51_000,
      rankTargets,
      coins: 0,
      coinTarget: 10,
      enemiesDefeated: 0,
      enemyTarget: 4,
      checkpointsReached: 0,
      checkpointTarget: 3,
      damageTaken: 0,
      falls: 0,
    }).timeScore).toBe(97)
  })

  it('caps optional category scores at their maximum values', () => {
    expect(scoreStageResult({
      elapsedMs: 20_000,
      rankTargets,
      coins: 12,
      coinTarget: 10,
      enemiesDefeated: 8,
      enemyTarget: 4,
      checkpointsReached: 5,
      checkpointTarget: 3,
      damageTaken: 0,
      falls: 0,
    })).toMatchObject({
      coinScore: 200,
      enemyScore: 150,
      checkpointScore: 50,
      totalScore: 1000,
    })
  })

  it('grants full optional score when optional targets are zero', () => {
    expect(scoreStageResult({
      elapsedMs: 20_000,
      rankTargets,
      coins: 0,
      coinTarget: 0,
      enemiesDefeated: 0,
      enemyTarget: 0,
      checkpointsReached: 0,
      checkpointTarget: 0,
      damageTaken: 0,
      falls: 0,
    }).totalScore).toBe(1000)
  })

  it('applies damage and fall penalties', () => {
    expect(scoreStageResult({
      elapsedMs: 20_000,
      rankTargets,
      coins: 10,
      coinTarget: 10,
      enemiesDefeated: 4,
      enemyTarget: 4,
      checkpointsReached: 3,
      checkpointTarget: 3,
      damageTaken: 1,
      falls: 1,
    }).totalScore).toBe(740)
  })
})

describe('stage result row states', () => {
  it('marks prototype perfect rows from result counts', () => {
    expect(getStageResultRowStates({
      coins: 5,
      coinTarget: 5,
      damageTaken: 0,
      falls: 0,
      enemiesDefeated: 2,
      enemyTarget: 2,
      checkpointsReached: 3,
      checkpointTarget: 3,
    })).toEqual({
      coinsPerfect: true,
      damagePerfect: true,
      fallsPerfect: true,
      enemiesPerfect: true,
      checkpointsPerfect: true,
    })
  })
})

describe('stage result action states', () => {
  it('keeps next stage locked when no next gameplay map is available', () => {
    expect(getResultActionStates({ nextStageAvailable: false })).toEqual([
      { type: 'retry', disabled: false },
      { type: 'stage-select', disabled: false },
      { type: 'next-stage', disabled: true },
    ])
  })
})
