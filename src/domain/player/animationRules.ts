export type PlayerAnimationDecision =
  | { type: 'preserve' }
  | {
    type: 'play'
    animation: 'player-idle' | 'player-run' | 'player-jump' | 'player-crouch'
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
