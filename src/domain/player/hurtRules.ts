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
