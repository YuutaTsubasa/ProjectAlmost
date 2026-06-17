export const BOSS_PROJECTILE_LIFETIME_MS = 7200
export const BOSS_PROJECTILE_BOUNDS_MARGIN = 80

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
