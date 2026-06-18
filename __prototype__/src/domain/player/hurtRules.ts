export function canApplyPlayerEnemyHit(input: {
  invulnerable: boolean
  hurting: boolean
  enemyDefeated: boolean
  homingAttacking: boolean
  dead: boolean
}): boolean {
  return !input.invulnerable
    && !input.hurting
    && !input.enemyDefeated
    && !input.homingAttacking
    && !input.dead
}

export function canApplyPlayerHazardHit(input: {
  invulnerable: boolean
  hurting: boolean
  homingAttacking: boolean
  dead: boolean
  stageCleared: boolean
}): boolean {
  return !input.invulnerable
    && !input.hurting
    && !input.homingAttacking
    && !input.dead
    && !input.stageCleared
}

export function canApplyPlayerDamage(input: {
  invulnerable: boolean
  hurting: boolean
  homingAttacking: boolean
  crouching: boolean
  dead: boolean
}): boolean {
  return !input.invulnerable
    && !input.hurting
    && !input.homingAttacking
    && !input.crouching
    && !input.dead
}

export function canEnterPlayerDefeat(input: {
  dead: boolean
  stageCleared: boolean
}): boolean {
  return !input.dead && !input.stageCleared
}

export const PLAYER_HIT_DAMAGE = 1
export const PLAYER_MAX_HEALTH = 3

export type PlayerDamageOutcome =
  | { type: 'survived'; nextHealth: number }
  | { type: 'defeated'; nextHealth: number }

export type PlayerRespawnState = {
  hurting: boolean
  invulnerable: boolean
  attacking: boolean
  homingAttacking: boolean
  crouching: boolean
  dead: boolean
  attackReady: boolean
  health: number
  jumpBufferedUntil: number
  remainingAirJumps: number
}

export type PlayerHurtRecoveryState = {
  hurting: boolean
  attackReady: boolean
}

export type PlayerHurtEntryState = {
  hurting: boolean
  invulnerable: boolean
  attacking: boolean
  homingAttacking: boolean
  crouching: boolean
  attackReady: boolean
}

export type PlayerInvulnerabilityRecoveryState = {
  invulnerable: boolean
}

export type PlayerDefeatEntryState = {
  dead: boolean
  hurting: boolean
  invulnerable: boolean
  attacking: boolean
  homingAttacking: boolean
  crouching: boolean
  attackReady: boolean
}

export function getPlayerDamageOutcome(input: {
  currentHealth: number
  damage?: number
}): PlayerDamageOutcome {
  const nextHealth = input.currentHealth - (input.damage ?? PLAYER_HIT_DAMAGE)
  return nextHealth <= 0
    ? { type: 'defeated', nextHealth }
    : { type: 'survived', nextHealth }
}

export function getPlayerRespawnState(input: {
  maxHealth?: number
} = {}): PlayerRespawnState {
  return {
    hurting: false,
    invulnerable: false,
    attacking: false,
    homingAttacking: false,
    crouching: false,
    dead: false,
    attackReady: true,
    health: input.maxHealth ?? PLAYER_MAX_HEALTH,
    jumpBufferedUntil: 0,
    remainingAirJumps: 1,
  }
}

export function getPlayerHurtEntryState(): PlayerHurtEntryState {
  return {
    hurting: true,
    invulnerable: true,
    attacking: false,
    homingAttacking: false,
    crouching: false,
    attackReady: false,
  }
}

export function getPlayerDefeatEntryState(): PlayerDefeatEntryState {
  return {
    dead: true,
    hurting: false,
    invulnerable: true,
    attacking: false,
    homingAttacking: false,
    crouching: false,
    attackReady: false,
  }
}

export function getPlayerHurtRecoveryState(): PlayerHurtRecoveryState {
  return {
    hurting: false,
    attackReady: true,
  }
}

export function getPlayerInvulnerabilityRecoveryState(): PlayerInvulnerabilityRecoveryState {
  return {
    invulnerable: false,
  }
}

export type PlayerKnockbackDirection = -1 | 1

export function getPlayerKnockbackDirection(input: {
  playerX: number
  sourceX: number
}): PlayerKnockbackDirection {
  return input.playerX < input.sourceX ? -1 : 1
}

export type PlayerDefeatReason = 'damage' | 'fall'
export type PlayerDefeatStatusKey = 'status.critical' | 'status.fall'

export function getPlayerDefeatOutcome(input: {
  reason: PlayerDefeatReason
  gravitySign: number
}): {
  fallCountDelta: number
  velocityY: number
  statusKey: PlayerDefeatStatusKey
} {
  if (input.reason === 'fall') {
    return {
      fallCountDelta: 1,
      velocityY: 0,
      statusKey: 'status.fall',
    }
  }

  return {
    fallCountDelta: 0,
    velocityY: -160 * input.gravitySign,
    statusKey: 'status.critical',
  }
}
