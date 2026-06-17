export const HOMING_ATTACK_RANGE = 360
export const HOMING_TARGET_REVERSE_TOLERANCE_X = 48

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
