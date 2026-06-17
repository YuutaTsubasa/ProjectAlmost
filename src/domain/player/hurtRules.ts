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
