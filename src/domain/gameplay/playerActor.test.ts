import { describe, expect, it } from 'vitest'
import {
  canPlayerCrouch,
  getPlayerBodyDefinition,
  getPlayerCenterY,
  getPlayerCrouchState,
  getPlayerHorizontalMovementDecision,
  playerActorDefinition,
} from './playerActor'

describe('playerActorDefinition', () => {
  it('preserves prototype rendering and physics values', () => {
    expect(playerActorDefinition).toMatchObject({
      id: 'player',
      sprites: {
        idle: {
          key: 'player-idle',
          assetRef: '/assets/sprites/player_idle/sheet-transparent.webp',
          frameWidth: 128,
          frameHeight: 128,
          frameStart: 0,
          frameEnd: 3,
          frameRate: 5,
          repeat: -1,
          scale: 0.78,
        },
        run: {
          key: 'player-run',
          assetRef: '/assets/sprites/player_run/sheet-transparent.webp',
          frameWidth: 128,
          frameHeight: 128,
          frameStart: 0,
          frameEnd: 3,
          frameRate: 9,
          repeat: -1,
          scale: 0.78,
        },
        jump: {
          key: 'player-jump',
          assetRef: '/assets/sprites/player_jump/sheet-transparent.webp',
          frameWidth: 128,
          frameHeight: 128,
          frameStart: 1,
          frameEnd: 1,
          frameRate: 1,
          repeat: 0,
          scale: 0.78,
        },
        attack: {
          key: 'player-attack',
          assetRef: '/assets/sprites/player_attack/sheet-transparent.webp',
          frameWidth: 128,
          frameHeight: 128,
          frameStart: 0,
          frameEnd: 3,
          frameRate: 12,
          repeat: 0,
          scale: 0.88,
        },
        hurt: {
          key: 'player-hurt',
          assetRef: '/assets/sprites/player_hurt/sheet-transparent.webp',
          frameWidth: 128,
          frameHeight: 128,
          frameStart: 0,
          frameEnd: 3,
          frameRate: 10,
          repeat: 0,
          scale: 0.78,
        },
        death: {
          key: 'player-death',
          assetRef: '/assets/sprites/player_death/sheet-transparent.webp',
          frameWidth: 128,
          frameHeight: 128,
          frameStart: 0,
          frameEnd: 3,
          frameRate: 7,
          repeat: 0,
          scale: 0.78,
        },
        crouch: {
          key: 'player-crouch',
          assetRef: '/assets/sprites/player_crouch/sheet-transparent.webp',
          frameWidth: 128,
          frameHeight: 128,
          frameStart: 0,
          frameEnd: 3,
          frameRate: 5,
          repeat: -1,
          scale: 0.78,
        },
      },
      origin: { x: 0.5, y: 0.5 },
      body: { width: 34, height: 72, offsetX: 47, offsetY: 42 },
      crouch: {
        body: { width: 34, height: 44, offsetX: 47, offsetY: 70 },
      },
      centerAboveSurface: 76,
      scale: 0.78,
      depth: 10,
      maxVelocity: { x: 500, y: 900 },
      gravityY: 1500,
      movement: {
        groundAcceleration: 950,
        idleDragX: 1500,
      },
      jump: {
        coyoteTimeMs: 120,
        jumpBufferMs: 140,
        maxAirJumps: 1,
        velocityY: -640,
      },
    })
  })
})

describe('player crouch body', () => {
  it('keeps crouch body feet aligned with standing body', () => {
    const standing = playerActorDefinition.body
    const crouching = playerActorDefinition.crouch.body

    expect(crouching.height).toBeLessThan(standing.height)
    expect(crouching.offsetY + crouching.height).toBe(standing.offsetY + standing.height)
  })

  it('selects standing or crouching body definitions by pose', () => {
    expect(getPlayerBodyDefinition({ pose: 'standing' })).toEqual(playerActorDefinition.body)
    expect(getPlayerBodyDefinition({ pose: 'crouching' })).toEqual(playerActorDefinition.crouch.body)
  })
})

describe('getPlayerCenterY', () => {
  it('places the player center above the platform surface', () => {
    expect(getPlayerCenterY({ surfaceY: 512 })).toBe(436)
  })
})

describe('canPlayerCrouch', () => {
  it('allows crouch only while held, grounded, and not blocked by higher-priority states', () => {
    const base = {
      crouchHeld: true,
      grounded: true,
      attacking: false,
      hurting: false,
      dead: false,
      stageCleared: false,
    }

    expect(canPlayerCrouch(base)).toBe(true)
    expect(canPlayerCrouch({ ...base, crouchHeld: false })).toBe(false)
    expect(canPlayerCrouch({ ...base, grounded: false })).toBe(false)
    expect(canPlayerCrouch({ ...base, attacking: true })).toBe(false)
    expect(canPlayerCrouch({ ...base, hurting: true })).toBe(false)
    expect(canPlayerCrouch({ ...base, dead: true })).toBe(false)
    expect(canPlayerCrouch({ ...base, stageCleared: true })).toBe(false)
  })
})

describe('getPlayerCrouchState', () => {
  it('returns true only while crouch is currently allowed', () => {
    expect(
      getPlayerCrouchState({
        crouchHeld: true,
        grounded: true,
        attacking: false,
        hurting: false,
        dead: false,
        stageCleared: false,
      }),
    ).toEqual({ crouching: true, pose: 'crouching' })

    expect(
      getPlayerCrouchState({
        crouchHeld: true,
        grounded: false,
        attacking: false,
        hurting: false,
        dead: false,
        stageCleared: false,
      }),
    ).toEqual({ crouching: false, pose: 'standing' })
  })
})

describe('getPlayerHorizontalMovementDecision', () => {
  it('accelerates left with idle drag', () => {
    expect(getPlayerHorizontalMovementDecision({ left: true, right: false, crouching: false })).toEqual({
      direction: 'left',
      accelerationX: -950,
      dragX: 1500,
      stopVelocityX: false,
    })
  })

  it('accelerates right with idle drag', () => {
    expect(getPlayerHorizontalMovementDecision({ left: false, right: true, crouching: false })).toEqual({
      direction: 'right',
      accelerationX: 950,
      dragX: 1500,
      stopVelocityX: false,
    })
  })

  it('idles with drag when no horizontal input is active', () => {
    expect(getPlayerHorizontalMovementDecision({ left: false, right: false, crouching: false })).toEqual({
      direction: 'none',
      accelerationX: 0,
      dragX: 1500,
      stopVelocityX: false,
    })
  })

  it('keeps prototype left priority when both directions are held', () => {
    expect(getPlayerHorizontalMovementDecision({ left: true, right: true, crouching: false })).toEqual({
      direction: 'left',
      accelerationX: -950,
      dragX: 1500,
      stopVelocityX: false,
    })
  })

  it('stops horizontal movement while crouching', () => {
    expect(getPlayerHorizontalMovementDecision({
      left: true,
      right: false,
      crouching: true,
    })).toEqual({
      direction: 'none',
      accelerationX: 0,
      dragX: 1500,
      stopVelocityX: true,
    })
  })
})
