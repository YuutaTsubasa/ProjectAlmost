export const PLAYER_HIT_DAMAGE = 1
export const PLAYER_MAX_HEALTH = 3
export const PLAYER_OUT_OF_BOUNDS_MARGIN = 128

export const playerLifeTiming = {
  hurtRecoveryDelayMs: 420,
  invulnerabilityRecoveryDelayMs: 900,
  deathRespawnDelayMs: 700,
} as const

export const playerHurtPresentation = {
  blinkAlpha: 0.35,
  blinkDurationMs: 80,
  blinkYoyo: true,
  blinkRepeat: 4,
} as const

export const playerDeathTransitionPresentation = {
  fadeOutDurationMs: 350,
  fadeInDurationMs: 450,
  color: { red: 245, green: 250, blue: 255 },
} as const

export const playerKnockback = {
  hurtVelocityX: 360,
  hurtVelocityY: 360,
  defeatVelocityY: 160,
} as const

export type PlayerDefeatReason = 'damage' | 'fall'
export type PlayerDamageOutcome =
  | { type: 'survived'; nextHealth: number }
  | { type: 'defeated'; nextHealth: number }
export type PlayerKnockbackDirection = -1 | 1

export function canApplyPlayerEnemyHit(input: {
  invulnerable: boolean
  hurting: boolean
  enemyDefeated: boolean
  homingAttacking: boolean
  crouching: boolean
  dead: boolean
}): boolean {
  return !input.enemyDefeated
    && canApplyPlayerDamage({
      invulnerable: input.invulnerable,
      hurting: input.hurting,
      homingAttacking: input.homingAttacking,
      crouching: input.crouching,
      dead: input.dead,
    })
}

export function canApplyPlayerHazardHit(input: {
  invulnerable: boolean
  hurting: boolean
  homingAttacking: boolean
  crouching: boolean
  dead: boolean
}): boolean {
  return canApplyPlayerDamage({
    invulnerable: input.invulnerable,
    hurting: input.hurting,
    homingAttacking: input.homingAttacking,
    crouching: input.crouching,
    dead: input.dead,
  })
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

export function canEnterPlayerDefeat(input: { dead: boolean }): boolean {
  return !input.dead
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

export function getPlayerHurtEntryState(): {
  hurting: boolean
  invulnerable: boolean
  attacking: boolean
  attackReady: boolean
} {
  return {
    hurting: true,
    invulnerable: true,
    attacking: false,
    attackReady: false,
  }
}

export function getPlayerHurtRecoveryState(): {
  hurting: boolean
  attackReady: boolean
} {
  return {
    hurting: false,
    attackReady: true,
  }
}

export function getPlayerInvulnerabilityRecoveryState(): {
  invulnerable: boolean
} {
  return {
    invulnerable: false,
  }
}

export function getPlayerDefeatEntryState(): {
  dead: boolean
  hurting: boolean
  invulnerable: boolean
  attacking: boolean
  attackReady: boolean
} {
  return {
    dead: true,
    hurting: false,
    invulnerable: true,
    attacking: false,
    attackReady: false,
  }
}

export function getPlayerRespawnState(input: {
  maxHealth?: number
} = {}): {
  health: number
  hurting: boolean
  invulnerable: boolean
  dead: boolean
  attacking: boolean
  attackReady: boolean
} {
  return {
    health: input.maxHealth ?? PLAYER_MAX_HEALTH,
    hurting: false,
    invulnerable: false,
    dead: false,
    attacking: false,
    attackReady: true,
  }
}

export function getPlayerKnockbackDirection(input: {
  playerX: number
  sourceX: number
}): PlayerKnockbackDirection {
  return input.playerX < input.sourceX ? -1 : 1
}

export function getPlayerHurtVelocity(input: {
  direction: PlayerKnockbackDirection
  gravitySign: number
}): { x: number; y: number } {
  return {
    x: input.direction * playerKnockback.hurtVelocityX,
    y: -playerKnockback.hurtVelocityY * input.gravitySign,
  }
}

export function getPlayerDefeatOutcome(input: {
  reason: PlayerDefeatReason
  gravitySign: number
}): { velocityY: number } {
  if (input.reason === 'fall') {
    return { velocityY: 0 }
  }

  return { velocityY: -playerKnockback.defeatVelocityY * input.gravitySign }
}

export function isPlayerOutsideWorldBounds(input: {
  x: number
  y: number
  worldWidth: number
  worldHeight: number
  margin: number
}): boolean {
  return input.x < -input.margin
    || input.x > input.worldWidth + input.margin
    || input.y < -input.margin
    || input.y > input.worldHeight + input.margin
}
