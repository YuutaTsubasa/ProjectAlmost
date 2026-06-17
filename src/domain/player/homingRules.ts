export function canStartHomingAttack(input: {
  attackReady: boolean
  hurting: boolean
  homingAttacking: boolean
  dead: boolean
}): boolean {
  return input.attackReady && !input.hurting && !input.homingAttacking && !input.dead
}
