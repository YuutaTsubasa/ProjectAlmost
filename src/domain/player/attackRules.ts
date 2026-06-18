export const MELEE_HITBOX_FORWARD_OFFSET_X = 48
export const MELEE_HITBOX_OFFSET_Y = -4

export type MeleeHitboxGeometry = {
  x: number
  y: number
  direction: -1 | 1
  flipX: boolean
}

export type AttackInputDecision = 'none' | 'melee' | 'homing-then-melee'

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

export function canStartMeleeAttack(input: {
  attackReady: boolean
  hurting: boolean
  homingAttacking: boolean
}): boolean {
  return input.attackReady && !input.hurting && !input.homingAttacking
}

export function getAttackInputDecision(input: {
  attackPressed: boolean
  crouching: boolean
  grounded: boolean
}): AttackInputDecision {
  if (!input.attackPressed || input.crouching) return 'none'
  return input.grounded ? 'melee' : 'homing-then-melee'
}

export function getMeleeAttackEntryState(): MeleeAttackEntryState {
  return {
    attackReady: false,
    attacking: true,
  }
}

export function getMeleeAttackEndState(): MeleeAttackEndState {
  return {
    attacking: false,
  }
}

export function getMeleeAttackReadyState(): MeleeAttackReadyState {
  return {
    attackReady: true,
  }
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
    direction,
    flipX: direction < 0,
  }
}
