export const HOMING_ATTACK_RANGE = 360
export const HOMING_TARGET_REVERSE_TOLERANCE_X = 48

export function canStartHomingAttack(input: {
  attackReady: boolean
  hurting: boolean
  homingAttacking: boolean
  dead: boolean
}): boolean {
  return input.attackReady && !input.hurting && !input.homingAttacking && !input.dead
}

export function isHomingTargetEligible(input: {
  playerX: number
  targetX: number
  facing: -1 | 1
  distance: number
  range?: number
  reverseToleranceX?: number
}): boolean {
  const range = input.range ?? HOMING_ATTACK_RANGE
  const reverseToleranceX = input.reverseToleranceX ?? HOMING_TARGET_REVERSE_TOLERANCE_X
  if (input.distance > range) return false
  const targetDirection = Math.sign(input.targetX - input.playerX) || input.facing
  return targetDirection === input.facing || Math.abs(input.targetX - input.playerX) <= reverseToleranceX
}
