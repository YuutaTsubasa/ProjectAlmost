export const HOMING_ATTACK_RANGE = 360
export const HOMING_TARGET_REVERSE_TOLERANCE_X = 48
export const HOMING_ATTACK_CONTACT_DISTANCE = 34

export type HomingTargetCandidate<T> = {
  target: T
  targetX: number
  distance: number
}

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

export function selectNearestHomingTarget<T>(input: {
  playerX: number
  facing: -1 | 1
  candidates: HomingTargetCandidate<T>[]
}): T | undefined {
  let selected: HomingTargetCandidate<T> | undefined
  for (const candidate of input.candidates) {
    if (!isHomingTargetEligible({
      playerX: input.playerX,
      targetX: candidate.targetX,
      facing: input.facing,
      distance: candidate.distance,
    })) {
      continue
    }
    if (!selected || candidate.distance < selected.distance) selected = candidate
  }
  return selected?.target
}

export function getHomingContactPoint(input: {
  startX: number
  startY: number
  targetX: number
  targetY: number
  contactDistance?: number
}): { x: number; y: number } {
  const contactDistance = input.contactDistance ?? HOMING_ATTACK_CONTACT_DISTANCE
  const angle = Math.atan2(input.targetY - input.startY, input.targetX - input.startX)
  return {
    x: input.targetX - Math.cos(angle) * contactDistance,
    y: input.targetY - Math.sin(angle) * contactDistance,
  }
}
