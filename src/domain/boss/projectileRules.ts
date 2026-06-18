export const BOSS_PROJECTILE_LIFETIME_MS = 7200
export const BOSS_PROJECTILE_BOUNDS_MARGIN = 80
export const BOSS_PROJECTILE_HIT_DISTANCE = 42

export type BossProjectileHitDecision = 'ignore' | 'blocked-by-crouch' | 'hit'

export type BossProjectileVelocity = {
  x: number
  y: number
}

export function isBossProjectileExpired(input: {
  now: number
  spawnedAt: number
  lifetimeMs?: number
}): boolean {
  return input.now - input.spawnedAt > (input.lifetimeMs ?? BOSS_PROJECTILE_LIFETIME_MS)
}

export function isBossProjectileOutOfBounds(input: {
  x: number
  y: number
  worldWidth: number
  worldHeight: number
  margin?: number
}): boolean {
  const margin = input.margin ?? BOSS_PROJECTILE_BOUNDS_MARGIN
  return input.x < -margin
    || input.x > input.worldWidth + margin
    || input.y < -margin
    || input.y > input.worldHeight + margin
}

export function getBossProjectileHitDecision(input: {
  playerDead: boolean
  playerCrouching: boolean
  distanceToPlayer: number
  hitDistance?: number
}): BossProjectileHitDecision {
  if (input.playerDead) return 'ignore'
  if (input.distanceToPlayer >= (input.hitDistance ?? BOSS_PROJECTILE_HIT_DISTANCE)) return 'ignore'
  if (input.playerCrouching) return 'blocked-by-crouch'
  return 'hit'
}

export function getBossProjectileVelocity(input: {
  angle: number
  speed: number
}): BossProjectileVelocity {
  return {
    x: Math.cos(input.angle) * input.speed,
    y: Math.sin(input.angle) * input.speed,
  }
}
