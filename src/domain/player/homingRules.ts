export const HOMING_ATTACK_RANGE = 360
export const HOMING_TARGET_REVERSE_TOLERANCE_X = 48
export const HOMING_ATTACK_CONTACT_DISTANCE = 34
export const HOMING_ATTACK_BOUNCE_Y = -420
export const HOMING_LINE_COIN_COLLECTION_RADIUS = 52
export const HOMING_TRAIL_SPACING = 28

export type HomingTargetCandidate<T> = {
  target: T
  targetX: number
  distance: number
}

export type HomingTrailSample = {
  x: number
  y: number
  progress: number
  alpha: number
}

export type HomingRecoveryState = {
  attacking: boolean
  attackReady?: boolean
}

export type HomingLineCoinCollectionDecision = 'skip' | 'collect'

export type HomingAttackEntryState = {
  attackReady: boolean
  attacking: boolean
  homingAttacking: boolean
}

export function canStartHomingAttack(input: {
  attackReady: boolean
  hurting: boolean
  homingAttacking: boolean
  dead: boolean
}): boolean {
  return input.attackReady && !input.hurting && !input.homingAttacking && !input.dead
}

export function getHomingAttackEntryState(): HomingAttackEntryState {
  return {
    attackReady: false,
    attacking: true,
    homingAttacking: true,
  }
}

export function canShowHomingReticle(input: {
  grounded: boolean
  stageCleared: boolean
  dead: boolean
  attacking: boolean
  hurting: boolean
  homingAttacking: boolean
}): boolean {
  return !input.grounded
    && !input.stageCleared
    && !input.dead
    && !input.attacking
    && !input.hurting
    && !input.homingAttacking
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

export type HomingFinishStatusKey = 'status.homingHit' | 'status.homingMiss'

export function getHomingFinishOutcome(input: {
  hit: boolean
  gravitySign: number
}): {
  remainingAirJumps?: number
  velocityY: number
  statusKey: HomingFinishStatusKey
} {
  if (input.hit) {
    return {
      remainingAirJumps: 1,
      velocityY: HOMING_ATTACK_BOUNCE_Y * input.gravitySign,
      statusKey: 'status.homingHit',
    }
  }

  return {
    velocityY: 0,
    statusKey: 'status.homingMiss',
  }
}

export function getHomingRecoveryState(input: {
  hurting: boolean
}): HomingRecoveryState {
  if (input.hurting) {
    return {
      attacking: false,
    }
  }

  return {
    attacking: false,
    attackReady: true,
  }
}

export function isHomingTargetLost(input: {
  defeated: boolean
  active: boolean
  visible: boolean
}): boolean {
  return input.defeated || !input.active || !input.visible
}

export function isPointCollectableByHomingLine(input: {
  startX: number
  startY: number
  endX: number
  endY: number
  pointX: number
  pointY: number
  radius?: number
}): boolean {
  const radius = input.radius ?? HOMING_LINE_COIN_COLLECTION_RADIUS
  const dx = input.endX - input.startX
  const dy = input.endY - input.startY
  const lengthSquared = dx * dx + dy * dy
  const projection = lengthSquared === 0
    ? 0
    : Math.max(0, Math.min(
      1,
      ((input.pointX - input.startX) * dx + (input.pointY - input.startY) * dy) / lengthSquared,
    ))
  const closestX = input.startX + dx * projection
  const closestY = input.startY + dy * projection
  const distance = Math.hypot(closestX - input.pointX, closestY - input.pointY)
  return distance <= radius
}

export function getHomingLineCoinCollectionDecision(input: {
  collected: boolean
  startX: number
  startY: number
  endX: number
  endY: number
  pointX: number
  pointY: number
  radius?: number
}): HomingLineCoinCollectionDecision {
  if (input.collected) return 'skip'
  return isPointCollectableByHomingLine(input) ? 'collect' : 'skip'
}

export function getHomingTrailSamples(input: {
  startX: number
  startY: number
  endX: number
  endY: number
  spacing?: number
}): HomingTrailSample[] {
  const spacing = input.spacing ?? HOMING_TRAIL_SPACING
  const distance = Math.hypot(input.endX - input.startX, input.endY - input.startY)
  const trailCount = Math.max(2, Math.ceil(distance / spacing))
  return Array.from({ length: trailCount }, (_, index) => {
    const progress = index / trailCount
    return {
      x: input.startX + (input.endX - input.startX) * progress,
      y: input.startY + (input.endY - input.startY) * progress,
      progress,
      alpha: 0.42 * (1 - progress * 0.35),
    }
  })
}
