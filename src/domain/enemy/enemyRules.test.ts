import { describe, expect, test } from 'vitest'
import {
  DEFAULT_ENEMY_REGENERATE_DELAY_MS,
  DEFAULT_ENEMY_REGENERATE_SAFE_DISTANCE,
  INITIAL_PATROL_DIRECTION,
  enemyCountsForScore,
  getEnemyDefeatOutcome,
  getEnemyRegenerationDecision,
  getNextPatrolDirection,
  getEnemyRespawnDelayMs,
  getEnemyRespawnPolicy,
  getScoreEnemyTargetCount,
  hasActiveEnemy,
  shouldUpdateEnemyFreezeState,
  shouldUpdateEnemyPatrol,
  shouldRestoreEnemyPatrolVelocity,
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

describe('getScoreEnemyTargetCount', () => {
  test('returns zero when a stage has no enemies', () => {
    expect(getScoreEnemyTargetCount({ enemies: [] })).toBe(0)
  })

  test('counts only enemies that count for score by definition or override', () => {
    expect(getScoreEnemyTargetCount({
      enemies: [
        { type: 'guard' },
        { type: 'azure-core' },
        { type: 'azure-core', countsForScore: true },
        { type: 'guard', countsForScore: false },
        {},
      ],
    })).toBe(3)
  })
})

describe('getEnemyDefeatOutcome', () => {
  test('returns score delta and persistent policy for default guards', () => {
    expect(getEnemyDefeatOutcome({ type: 'guard' })).toEqual({
      scoreDelta: 1,
      respawnPolicy: 'persistent',
      shouldRegenerate: false,
    })
    expect(getEnemyDefeatOutcome({})).toEqual({
      scoreDelta: 1,
      respawnPolicy: 'persistent',
      shouldRegenerate: false,
    })
  })

  test('returns no score delta and regeneration policy for default Azure Cores', () => {
    expect(getEnemyDefeatOutcome({ type: 'azure-core' })).toEqual({
      scoreDelta: 0,
      respawnPolicy: 'regenerate',
      shouldRegenerate: true,
    })
  })

  test('uses explicit score overrides', () => {
    expect(getEnemyDefeatOutcome({ type: 'guard', countsForScore: false }).scoreDelta).toBe(0)
    expect(getEnemyDefeatOutcome({ type: 'azure-core', countsForScore: true }).scoreDelta).toBe(1)
  })

  test('uses explicit respawn policy overrides', () => {
    expect(getEnemyDefeatOutcome({ type: 'azure-core', respawnPolicy: 'persistent' })).toEqual({
      scoreDelta: 0,
      respawnPolicy: 'persistent',
      shouldRegenerate: false,
    })
    expect(getEnemyDefeatOutcome({ type: 'guard', respawnPolicy: 'regenerate' })).toEqual({
      scoreDelta: 1,
      respawnPolicy: 'regenerate',
      shouldRegenerate: true,
    })
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

describe('enemy patrol direction', () => {
  test('starts patrol enemies moving left', () => {
    expect(INITIAL_PATROL_DIRECTION).toBe(-1)
  })

  test('turns right when enemy moves past the minimum patrol boundary', () => {
    expect(getNextPatrolDirection({
      x: 99,
      patrolMinX: 100,
      patrolMaxX: 200,
      currentDirection: -1,
    })).toBe(1)
  })

  test('turns left when enemy moves past the maximum patrol boundary', () => {
    expect(getNextPatrolDirection({
      x: 201,
      patrolMinX: 100,
      patrolMaxX: 200,
      currentDirection: 1,
    })).toBe(-1)
  })

  test('keeps the current direction inside the patrol range', () => {
    expect(getNextPatrolDirection({
      x: 150,
      patrolMinX: 100,
      patrolMaxX: 200,
      currentDirection: -1,
    })).toBe(-1)
    expect(getNextPatrolDirection({
      x: 150,
      patrolMinX: 100,
      patrolMaxX: 200,
      currentDirection: 1,
    })).toBe(1)
  })

  test('keeps the current direction on exact patrol boundaries', () => {
    expect(getNextPatrolDirection({
      x: 100,
      patrolMinX: 100,
      patrolMaxX: 200,
      currentDirection: -1,
    })).toBe(-1)
    expect(getNextPatrolDirection({
      x: 200,
      patrolMinX: 100,
      patrolMaxX: 200,
      currentDirection: 1,
    })).toBe(1)
  })
})

describe('shouldUpdateEnemyPatrol', () => {
  test('skips defeated enemies', () => {
    expect(shouldUpdateEnemyPatrol({ defeated: true, type: 'guard' })).toBe(false)
  })

  test('skips Azure Cores because they do not use patrol movement', () => {
    expect(shouldUpdateEnemyPatrol({ defeated: false, type: 'azure-core' })).toBe(false)
  })

  test('updates guard enemies', () => {
    expect(shouldUpdateEnemyPatrol({ defeated: false, type: 'guard' })).toBe(true)
  })

  test('updates enemies without an explicit type as default guards', () => {
    expect(shouldUpdateEnemyPatrol({ defeated: false })).toBe(true)
  })
})

describe('shouldUpdateEnemyFreezeState', () => {
  test('updates active enemies that are not defeated', () => {
    expect(shouldUpdateEnemyFreezeState({
      defeated: false,
      active: true,
    })).toBe(true)
  })

  test('skips defeated enemies', () => {
    expect(shouldUpdateEnemyFreezeState({
      defeated: true,
      active: true,
    })).toBe(false)
  })

  test('skips inactive enemies', () => {
    expect(shouldUpdateEnemyFreezeState({
      defeated: false,
      active: false,
    })).toBe(false)
  })
})

describe('shouldRestoreEnemyPatrolVelocity', () => {
  test('restores patrol velocity for unfrozen patrol enemies', () => {
    expect(shouldRestoreEnemyPatrolVelocity({
      frozen: false,
      behavior: 'patrol',
    })).toBe(true)
  })

  test('does not restore patrol velocity while enemies are frozen', () => {
    expect(shouldRestoreEnemyPatrolVelocity({
      frozen: true,
      behavior: 'patrol',
    })).toBe(false)
  })

  test('does not restore patrol velocity for non-patrol behavior', () => {
    expect(shouldRestoreEnemyPatrolVelocity({
      frozen: false,
      behavior: 'homing-target',
    })).toBe(false)
  })
})

describe('hasActiveEnemy', () => {
  test('returns false when no enemies exist', () => {
    expect(hasActiveEnemy({ enemies: [] })).toBe(false)
  })

  test('returns false when every enemy is defeated', () => {
    expect(hasActiveEnemy({
      enemies: [
        { defeated: true },
        { defeated: true },
      ],
    })).toBe(false)
  })

  test('returns true when any enemy is not defeated', () => {
    expect(hasActiveEnemy({
      enemies: [
        { defeated: true },
        { defeated: false },
      ],
    })).toBe(true)
  })
})
