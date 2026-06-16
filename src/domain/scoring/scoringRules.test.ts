import { describe, expect, test } from 'vitest'
import { calculateStageRank, scoreStageResult } from './scoringRules'

const rankTargets = {
  sTime: 20,
  aTime: 30,
  bTime: 40,
  cTime: 50,
}

const perfectResult = {
  elapsedMs: 20_000,
  rankTargets,
  coins: 10,
  coinTarget: 10,
  enemiesDefeated: 4,
  enemyTarget: 4,
  checkpointsReached: 2,
  checkpointTarget: 2,
  damageTaken: 0,
  falls: 0,
}

describe('calculateStageRank', () => {
  test('returns S for a perfect result at the S time target', () => {
    expect(calculateStageRank(perfectResult)).toBe('S')
  })

  test('uses the A threshold when score is exactly 700', () => {
    expect(calculateStageRank({
      ...perfectResult,
      coins: 1,
      coinTarget: 4,
      enemiesDefeated: 0,
      enemyTarget: 1,
    })).toBe('A')
  })

  test('uses the B threshold when score is exactly 550', () => {
    expect(calculateStageRank({
      ...perfectResult,
      elapsedMs: 40_000,
      coins: 0,
      enemiesDefeated: 1,
      enemyTarget: 5,
      checkpointsReached: 2,
    })).toBe('B')
  })

  test('uses the C threshold when score is exactly 400', () => {
    expect(calculateStageRank({
      ...perfectResult,
      elapsedMs: 50_000,
      coins: 0,
      enemiesDefeated: 0,
      checkpointsReached: 0,
    })).toBe('C')
  })

  test('falls to D below the C threshold', () => {
    expect(calculateStageRank({
      ...perfectResult,
      elapsedMs: 90_000,
      coins: 0,
      enemiesDefeated: 0,
      checkpointsReached: 0,
      damageTaken: 2,
      falls: 1,
    })).toBe('D')
  })
})

describe('scoreStageResult', () => {
  test('decays time score after the C time target', () => {
    expect(scoreStageResult({ ...perfectResult, elapsedMs: 51_000 }).timeScore).toBe(97)
  })

  test('gives full collection scores when a stage has no optional targets', () => {
    expect(scoreStageResult({
      ...perfectResult,
      coins: 0,
      coinTarget: 0,
      enemiesDefeated: 0,
      enemyTarget: 0,
      checkpointsReached: 0,
      checkpointTarget: 0,
    })).toEqual({
      baseScore: 300,
      timeScore: 300,
      coinScore: 200,
      enemyScore: 150,
      checkpointScore: 50,
      damagePenalty: 0,
      fallPenalty: 0,
      totalScore: 1_000,
    })
  })

  test('applies damage and fall penalties', () => {
    expect(scoreStageResult({ ...perfectResult, damageTaken: 1, falls: 1 }).totalScore).toBe(740)
  })
})
