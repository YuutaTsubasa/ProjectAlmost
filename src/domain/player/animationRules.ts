export type PlayerAnimationKey = 'player-idle' | 'player-run' | 'player-jump' | 'player-crouch'

export type PlayerAnimationDecision =
  | { type: 'preserve' }
  | {
    type: 'play'
    animation: PlayerAnimationKey
    visualState?: 'normal'
  }

export function getPlayerAnimationDecision(input: {
  moving: boolean
  grounded: boolean
  crouching: boolean
  attacking: boolean
  hurting: boolean
  homingAttacking: boolean
  dead: boolean
}): PlayerAnimationDecision {
  if (input.attacking || input.hurting || input.homingAttacking || input.dead) {
    return { type: 'preserve' }
  }

  if (!input.grounded) {
    return {
      type: 'play',
      animation: 'player-jump',
      visualState: 'normal',
    }
  }

  if (input.crouching) {
    return {
      type: 'play',
      animation: 'player-crouch',
    }
  }

  return {
    type: 'play',
    animation: input.moving ? 'player-run' : 'player-idle',
    visualState: 'normal',
  }
}

export function shouldPlayPlayerAnimation(input: {
  key: PlayerAnimationKey | string
  currentAnimationKey?: string
  currentTextureKey: string
  respectAttackLock: boolean
  attacking: boolean
  hurting: boolean
}): boolean {
  if (input.respectAttackLock && (input.attacking || input.hurting)) {
    return false
  }

  return input.currentAnimationKey !== input.key || input.currentTextureKey !== input.key
}
