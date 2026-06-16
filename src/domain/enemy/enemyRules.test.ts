import { describe, expect, test } from 'vitest'
import {
  DEFAULT_ENEMY_REGENERATE_DELAY_MS,
  DEFAULT_ENEMY_REGENERATE_SAFE_DISTANCE,
  enemyCountsForScore,
  getEnemyRegenerationDecision,
  getEnemyRespawnDelayMs,
  getEnemyRespawnPolicy,
} from './enemyRules'

describe('getEnemyRespawnPolicy', () => {
  test('uses explicit stage override first', () => {
    expect(getEnemyRespawnPolicy({ type: 'azure-core', respawnPolicy: 'persistent' })).toBe('persistent')
    expect(getEnemyRespawnPolicy({ type: 'guard', respawnPolicy: 'regenerate' })).toBe('regenerate')
  })

  test('defaults azure cores to regenerate and guards to persistent', () => {
    expect(getEnemyRespawnPolicy({ type: 'azure-core' })).toBe('regenerate')
    expect(getEnemyRespawnPolicy({ type: 'guard' })).toBe('persistent')
    expect(getEnemyRespawnPolicy({})).toBe('persistent')
  })
})

describe('enemyCountsForScore', () => {
  test('uses explicit stage override first', () => {
    expect(enemyCountsForScore({ type: 'azure-core', countsForScore: true })).toBe(true)
    expect(enemyCountsForScore({ type: 'guard', countsForScore: false })).toBe(false)
  })

  test('defaults azure cores to not score and guards to score', () => {
    expect(enemyCountsForScore({ type: 'azure-core' })).toBe(false)
    expect(enemyCountsForScore({ type: 'guard' })).toBe(true)
    expect(enemyCountsForScore({})).toBe(true)
  })
})

describe('getEnemyRespawnDelayMs', () => {
  test('uses explicit stage respawn delay before default delay', () => {
    expect(getEnemyRespawnDelayMs({ respawnDelayMs: 320 })).toBe(320)
    expect(getEnemyRespawnDelayMs({})).toBe(DEFAULT_ENEMY_REGENERATE_DELAY_MS)
  })
})

describe('getEnemyRegenerationDecision', () => {
  test('skips regeneration when the stage is cleared or the enemy is not defeated', () => {
    expect(getEnemyRegenerationDecision({
      stageCleared: true,
      enemyDefeated: true,
      playerDead: false,
      playerDistance: DEFAULT_ENEMY_REGENERATE_SAFE_DISTANCE,
    })).toBe('skip')
    expect(getEnemyRegenerationDecision({
      stageCleared: false,
      enemyDefeated: false,
      playerDead: false,
      playerDistance: DEFAULT_ENEMY_REGENERATE_SAFE_DISTANCE,
    })).toBe('skip')
  })

  test('delays regeneration while player is dead or inside the safe distance', () => {
    expect(getEnemyRegenerationDecision({
      stageCleared: false,
      enemyDefeated: true,
      playerDead: true,
      playerDistance: DEFAULT_ENEMY_REGENERATE_SAFE_DISTANCE,
    })).toBe('delay')
    expect(getEnemyRegenerationDecision({
      stageCleared: false,
      enemyDefeated: true,
      playerDead: false,
      playerDistance: DEFAULT_ENEMY_REGENERATE_SAFE_DISTANCE - 1,
    })).toBe('delay')
  })

  test('regenerates when the enemy is defeated and the player is far enough away', () => {
    expect(getEnemyRegenerationDecision({
      stageCleared: false,
      enemyDefeated: true,
      playerDead: false,
      playerDistance: DEFAULT_ENEMY_REGENERATE_SAFE_DISTANCE,
    })).toBe('regenerate')
  })
})
