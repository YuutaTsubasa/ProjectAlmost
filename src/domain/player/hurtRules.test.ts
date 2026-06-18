import { describe, expect, it } from 'vitest'
import {
  PLAYER_HIT_DAMAGE,
  PLAYER_MAX_HEALTH,
  canApplyPlayerDamage,
  canApplyPlayerEnemyHit,
  canApplyPlayerHazardHit,
  getPlayerDamageOutcome,
  getPlayerDefeatOutcome,
  getPlayerHurtEntryState,
  getPlayerHurtRecoveryState,
  getPlayerInvulnerabilityRecoveryState,
  getPlayerKnockbackDirection,
  getPlayerRespawnState,
} from './hurtRules'

describe('canApplyPlayerEnemyHit', () => {
  it('allows enemy contact damage when no blocking state is active', () => {
    expect(canApplyPlayerEnemyHit({
      invulnerable: false,
      hurting: false,
      enemyDefeated: false,
      homingAttacking: false,
      dead: false,
    })).toBe(true)
  })

  it('blocks enemy contact damage while invulnerable', () => {
    expect(canApplyPlayerEnemyHit({
      invulnerable: true,
      hurting: false,
      enemyDefeated: false,
      homingAttacking: false,
      dead: false,
    })).toBe(false)
  })

  it('blocks enemy contact damage while already hurting', () => {
    expect(canApplyPlayerEnemyHit({
      invulnerable: false,
      hurting: true,
      enemyDefeated: false,
      homingAttacking: false,
      dead: false,
    })).toBe(false)
  })

  it('blocks enemy contact damage from defeated enemies', () => {
    expect(canApplyPlayerEnemyHit({
      invulnerable: false,
      hurting: false,
      enemyDefeated: true,
      homingAttacking: false,
      dead: false,
    })).toBe(false)
  })

  it('blocks enemy contact damage during Homing Attack', () => {
    expect(canApplyPlayerEnemyHit({
      invulnerable: false,
      hurting: false,
      enemyDefeated: false,
      homingAttacking: true,
      dead: false,
    })).toBe(false)
  })

  it('blocks enemy contact damage after player death', () => {
    expect(canApplyPlayerEnemyHit({
      invulnerable: false,
      hurting: false,
      enemyDefeated: false,
      homingAttacking: false,
      dead: true,
    })).toBe(false)
  })
})

describe('canApplyPlayerHazardHit', () => {
  it('allows hazard contact damage when no blocking state is active', () => {
    expect(canApplyPlayerHazardHit({
      invulnerable: false,
      hurting: false,
      homingAttacking: false,
      dead: false,
      stageCleared: false,
    })).toBe(true)
  })

  it('blocks hazard contact damage while invulnerable', () => {
    expect(canApplyPlayerHazardHit({
      invulnerable: true,
      hurting: false,
      homingAttacking: false,
      dead: false,
      stageCleared: false,
    })).toBe(false)
  })

  it('blocks hazard contact damage while already hurting', () => {
    expect(canApplyPlayerHazardHit({
      invulnerable: false,
      hurting: true,
      homingAttacking: false,
      dead: false,
      stageCleared: false,
    })).toBe(false)
  })

  it('blocks hazard contact damage during Homing Attack', () => {
    expect(canApplyPlayerHazardHit({
      invulnerable: false,
      hurting: false,
      homingAttacking: true,
      dead: false,
      stageCleared: false,
    })).toBe(false)
  })

  it('blocks hazard contact damage after player death', () => {
    expect(canApplyPlayerHazardHit({
      invulnerable: false,
      hurting: false,
      homingAttacking: false,
      dead: true,
      stageCleared: false,
    })).toBe(false)
  })

  it('blocks hazard contact damage after stage clear', () => {
    expect(canApplyPlayerHazardHit({
      invulnerable: false,
      hurting: false,
      homingAttacking: false,
      dead: false,
      stageCleared: true,
    })).toBe(false)
  })
})

describe('canApplyPlayerDamage', () => {
  it('allows damage when no blocking state is active', () => {
    expect(canApplyPlayerDamage({
      invulnerable: false,
      hurting: false,
      homingAttacking: false,
      crouching: false,
      dead: false,
    })).toBe(true)
  })

  it('blocks damage while invulnerable', () => {
    expect(canApplyPlayerDamage({
      invulnerable: true,
      hurting: false,
      homingAttacking: false,
      crouching: false,
      dead: false,
    })).toBe(false)
  })

  it('blocks damage while already hurting', () => {
    expect(canApplyPlayerDamage({
      invulnerable: false,
      hurting: true,
      homingAttacking: false,
      crouching: false,
      dead: false,
    })).toBe(false)
  })

  it('blocks damage during Homing Attack', () => {
    expect(canApplyPlayerDamage({
      invulnerable: false,
      hurting: false,
      homingAttacking: true,
      crouching: false,
      dead: false,
    })).toBe(false)
  })

  it('blocks damage while crouching', () => {
    expect(canApplyPlayerDamage({
      invulnerable: false,
      hurting: false,
      homingAttacking: false,
      crouching: true,
      dead: false,
    })).toBe(false)
  })

  it('blocks damage after player death', () => {
    expect(canApplyPlayerDamage({
      invulnerable: false,
      hurting: false,
      homingAttacking: false,
      crouching: false,
      dead: true,
    })).toBe(false)
  })
})

describe('getPlayerKnockbackDirection', () => {
  it('knocks left when player is left of the damage source', () => {
    expect(getPlayerKnockbackDirection({
      playerX: 120,
      sourceX: 160,
    })).toBe(-1)
  })

  it('knocks right when player is aligned with the damage source', () => {
    expect(getPlayerKnockbackDirection({
      playerX: 160,
      sourceX: 160,
    })).toBe(1)
  })

  it('knocks right when player is right of the damage source', () => {
    expect(getPlayerKnockbackDirection({
      playerX: 200,
      sourceX: 160,
    })).toBe(1)
  })
})

describe('getPlayerDamageOutcome', () => {
  it('keeps player hit damage explicit', () => {
    expect(PLAYER_HIT_DAMAGE).toBe(1)
  })

  it('survives when health remains above zero after damage', () => {
    expect(getPlayerDamageOutcome({
      currentHealth: 3,
    })).toEqual({
      type: 'survived',
      nextHealth: 2,
    })
  })

  it('defeats when health reaches zero after damage', () => {
    expect(getPlayerDamageOutcome({
      currentHealth: 1,
    })).toEqual({
      type: 'defeated',
      nextHealth: 0,
    })
  })

  it('does not clamp health before checking defeat', () => {
    expect(getPlayerDamageOutcome({
      currentHealth: 0,
    })).toEqual({
      type: 'defeated',
      nextHealth: -1,
    })
  })

  it('supports explicit damage for boundary checks', () => {
    expect(getPlayerDamageOutcome({
      currentHealth: 3,
      damage: 3,
    })).toEqual({
      type: 'defeated',
      nextHealth: 0,
    })
  })
})

describe('getPlayerDefeatOutcome', () => {
  it('returns fall defeat outcome', () => {
    expect(getPlayerDefeatOutcome({
      reason: 'fall',
      gravitySign: 1,
    })).toEqual({
      fallCountDelta: 1,
      velocityY: 0,
      statusKey: 'status.fall',
    })
  })

  it('returns damage defeat outcome for normal gravity', () => {
    expect(getPlayerDefeatOutcome({
      reason: 'damage',
      gravitySign: 1,
    })).toEqual({
      fallCountDelta: 0,
      velocityY: -160,
      statusKey: 'status.critical',
    })
  })

  it('uses gravity sign for damage defeat velocity', () => {
    expect(getPlayerDefeatOutcome({
      reason: 'damage',
      gravitySign: -1,
    })).toEqual({
      fallCountDelta: 0,
      velocityY: 160,
      statusKey: 'status.critical',
    })
  })
})

describe('getPlayerRespawnState', () => {
  it('keeps max health explicit', () => {
    expect(PLAYER_MAX_HEALTH).toBe(3)
  })

  it('returns the default respawn state', () => {
    expect(getPlayerRespawnState()).toEqual({
      hurting: false,
      invulnerable: false,
      attacking: false,
      homingAttacking: false,
      crouching: false,
      dead: false,
      attackReady: true,
      health: 3,
      jumpBufferedUntil: 0,
      remainingAirJumps: 1,
    })
  })

  it('supports explicit max health for boundary checks', () => {
    expect(getPlayerRespawnState({ maxHealth: 5 }).health).toBe(5)
  })
})

describe('getPlayerHurtEntryState', () => {
  it('returns the survived hit entry state', () => {
    expect(getPlayerHurtEntryState()).toEqual({
      hurting: true,
      invulnerable: true,
      attacking: false,
      homingAttacking: false,
      crouching: false,
      attackReady: false,
    })
  })

  it('returns a fresh state object', () => {
    const first = getPlayerHurtEntryState()
    const second = getPlayerHurtEntryState()

    expect(first).toEqual(second)
    expect(first).not.toBe(second)
  })
})

describe('getPlayerHurtRecoveryState', () => {
  it('returns the short hurt recovery state', () => {
    expect(getPlayerHurtRecoveryState()).toEqual({
      hurting: false,
      attackReady: true,
    })
  })

  it('returns a fresh state object', () => {
    const first = getPlayerHurtRecoveryState()
    const second = getPlayerHurtRecoveryState()

    expect(first).toEqual(second)
    expect(first).not.toBe(second)
  })
})

describe('getPlayerInvulnerabilityRecoveryState', () => {
  it('returns the invulnerability recovery state', () => {
    expect(getPlayerInvulnerabilityRecoveryState()).toEqual({
      invulnerable: false,
    })
  })

  it('returns a fresh state object', () => {
    const first = getPlayerInvulnerabilityRecoveryState()
    const second = getPlayerInvulnerabilityRecoveryState()

    expect(first).toEqual(second)
    expect(first).not.toBe(second)
  })
})
