export type AttackInputDecision = 'none' | 'melee'

export type AttackInput = {
  attackPressed: boolean
  crouching: boolean
  grounded: boolean
}

export type MeleeAttackEntryState = {
  attackReady: boolean
  attacking: boolean
}

export type MeleeAttackEndState = {
  attacking: boolean
}

export type MeleeAttackReadyState = {
  attackReady: boolean
}

export type MeleeHitboxGeometry = {
  x: number
  y: number
  width: number
  height: number
  flipX: boolean
}

export const meleeAttackTiming = {
  hitboxLifetimeMs: 120,
  attackEndDelayMs: 340,
  readyDelayMs: 360,
} as const

export const meleeHitboxSize = {
  width: 56,
  height: 36,
} as const

const MELEE_HITBOX_FORWARD_OFFSET_X = 48
const MELEE_HITBOX_OFFSET_Y = -4

export function getAttackInputDecision(input: AttackInput): AttackInputDecision {
  if (!input.attackPressed || input.crouching) return 'none'

  return 'melee'
}

export function canStartMeleeAttack(input: {
  attackReady: boolean
  hurting: boolean
  homingAttacking: boolean
}): boolean {
  return input.attackReady && !input.hurting && !input.homingAttacking
}

export function getMeleeAttackEntryState(): MeleeAttackEntryState {
  return { attackReady: false, attacking: true }
}

export function getMeleeAttackEndState(): MeleeAttackEndState {
  return { attacking: false }
}

export function getMeleeAttackReadyState(): MeleeAttackReadyState {
  return { attackReady: true }
}

export function getMeleeHitboxGeometry(input: {
  playerX: number
  playerY: number
  playerFlipX: boolean
}): MeleeHitboxGeometry {
  const direction = input.playerFlipX ? -1 : 1

  return {
    x: input.playerX + direction * MELEE_HITBOX_FORWARD_OFFSET_X,
    y: input.playerY + MELEE_HITBOX_OFFSET_Y,
    width: meleeHitboxSize.width,
    height: meleeHitboxSize.height,
    flipX: input.playerFlipX,
  }
}

export function isMeleeHitCandidate(input: {
  defeated: boolean
  intersectsHitbox: boolean
}): boolean {
  return !input.defeated && input.intersectsHitbox
}
