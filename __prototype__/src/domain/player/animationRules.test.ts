import { describe, expect, it } from 'vitest'
import {
  getPlayerVisualStatePresentation,
  getPlayerAnimationDecision,
  shouldPlayPlayerAnimation,
} from './animationRules'

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

describe('shouldPlayPlayerAnimation', () => {
  it('blocks playback while attack locked and attacking', () => {
    expect(shouldPlayPlayerAnimation({
      key: 'player-run',
      currentAnimationKey: 'player-idle',
      currentTextureKey: 'player-idle',
      respectAttackLock: true,
      attacking: true,
      hurting: false,
    })).toBe(false)
  })

  it('blocks playback while attack locked and hurting', () => {
    expect(shouldPlayPlayerAnimation({
      key: 'player-run',
      currentAnimationKey: 'player-idle',
      currentTextureKey: 'player-idle',
      respectAttackLock: true,
      attacking: false,
      hurting: true,
    })).toBe(false)
  })

  it('allows playback while attacking when attack lock is not respected', () => {
    expect(shouldPlayPlayerAnimation({
      key: 'player-run',
      currentAnimationKey: 'player-idle',
      currentTextureKey: 'player-idle',
      respectAttackLock: false,
      attacking: true,
      hurting: false,
    })).toBe(true)
  })

  it('allows playback when animation key differs', () => {
    expect(shouldPlayPlayerAnimation({
      key: 'player-run',
      currentAnimationKey: 'player-idle',
      currentTextureKey: 'player-run',
      respectAttackLock: true,
      attacking: false,
      hurting: false,
    })).toBe(true)
  })

  it('allows playback when texture key differs', () => {
    expect(shouldPlayPlayerAnimation({
      key: 'player-run',
      currentAnimationKey: 'player-run',
      currentTextureKey: 'player-idle',
      respectAttackLock: true,
      attacking: false,
      hurting: false,
    })).toBe(true)
  })

  it('allows playback when current animation key is missing', () => {
    expect(shouldPlayPlayerAnimation({
      key: 'player-run',
      currentAnimationKey: undefined,
      currentTextureKey: 'player-run',
      respectAttackLock: true,
      attacking: false,
      hurting: false,
    })).toBe(true)
  })

  it('skips playback when animation and texture already match', () => {
    expect(shouldPlayPlayerAnimation({
      key: 'player-run',
      currentAnimationKey: 'player-run',
      currentTextureKey: 'player-run',
      respectAttackLock: true,
      attacking: false,
      hurting: false,
    })).toBe(false)
  })
})

describe('getPlayerVisualStatePresentation', () => {
  it('uses normal scale and zero visual offset for normal state', () => {
    expect(getPlayerVisualStatePresentation({
      state: 'normal',
      normalScale: 0.78,
      attackScale: 0.98,
      attackVisualOffsetY: -10,
    })).toEqual({
      scale: 0.78,
      visualOffsetY: 0,
    })
  })

  it('uses attack scale and attack visual offset for attack state', () => {
    expect(getPlayerVisualStatePresentation({
      state: 'attack',
      normalScale: 0.78,
      attackScale: 0.98,
      attackVisualOffsetY: -10,
    })).toEqual({
      scale: 0.98,
      visualOffsetY: -10,
    })
  })
})
