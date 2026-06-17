export function canStartMeleeAttack(input: {
  attackReady: boolean
  hurting: boolean
  homingAttacking: boolean
}): boolean {
  return input.attackReady && !input.hurting && !input.homingAttacking
}
