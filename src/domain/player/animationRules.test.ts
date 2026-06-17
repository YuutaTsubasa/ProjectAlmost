import { describe, expect, it } from 'vitest'
import { getPlayerAnimationDecision } from './animationRules'

describe('getPlayerAnimationDecision', () => {
  it('preserves animation while attacking', () => {
    expect(getPlayerAnimationDecision({
      moving: true,
      grounded: true,
      crouching: false,
      attacking: true,
      hurting: false,
      homingAttacking: false,
      dead: false,
    })).toEqual({ type: 'preserve' })
  })

  it('preserves animation while hurting', () => {
    expect(getPlayerAnimationDecision({
      moving: true,
      grounded: true,
      crouching: false,
      attacking: false,
      hurting: true,
      homingAttacking: false,
      dead: false,
    })).toEqual({ type: 'preserve' })
  })

  it('preserves animation during Homing Attack', () => {
    expect(getPlayerAnimationDecision({
      moving: true,
      grounded: true,
      crouching: false,
      attacking: false,
      hurting: false,
      homingAttacking: true,
      dead: false,
    })).toEqual({ type: 'preserve' })
  })

  it('preserves animation after death', () => {
    expect(getPlayerAnimationDecision({
      moving: true,
      grounded: true,
      crouching: false,
      attacking: false,
      hurting: false,
      homingAttacking: false,
      dead: true,
    })).toEqual({ type: 'preserve' })
  })

  it('chooses jump animation while airborne', () => {
    expect(getPlayerAnimationDecision({
      moving: false,
      grounded: false,
      crouching: false,
      attacking: false,
      hurting: false,
      homingAttacking: false,
      dead: false,
    })).toEqual({
      type: 'play',
      animation: 'player-jump',
      visualState: 'normal',
    })
  })

  it('prioritizes airborne jump over crouching', () => {
    expect(getPlayerAnimationDecision({
      moving: false,
      grounded: false,
      crouching: true,
      attacking: false,
      hurting: false,
      homingAttacking: false,
      dead: false,
    })).toEqual({
      type: 'play',
      animation: 'player-jump',
      visualState: 'normal',
    })
  })

  it('chooses crouch animation while grounded and crouching', () => {
    expect(getPlayerAnimationDecision({
      moving: true,
      grounded: true,
      crouching: true,
      attacking: false,
      hurting: false,
      homingAttacking: false,
      dead: false,
    })).toEqual({
      type: 'play',
      animation: 'player-crouch',
    })
  })

  it('chooses run animation while grounded and moving', () => {
    expect(getPlayerAnimationDecision({
      moving: true,
      grounded: true,
      crouching: false,
      attacking: false,
      hurting: false,
      homingAttacking: false,
      dead: false,
    })).toEqual({
      type: 'play',
      animation: 'player-run',
      visualState: 'normal',
    })
  })

  it('chooses idle animation while grounded and not moving', () => {
    expect(getPlayerAnimationDecision({
      moving: false,
      grounded: true,
      crouching: false,
      attacking: false,
      hurting: false,
      homingAttacking: false,
      dead: false,
    })).toEqual({
      type: 'play',
      animation: 'player-idle',
      visualState: 'normal',
    })
  })
})
