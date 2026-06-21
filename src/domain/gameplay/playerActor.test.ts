import { describe, expect, it } from 'vitest'
import {
  getPlayerCenterY,
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
        },
      },
      origin: { x: 0.5, y: 0.5 },
      body: { width: 34, height: 72, offsetX: 47, offsetY: 42 },
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

describe('getPlayerCenterY', () => {
  it('places the player center above the platform surface', () => {
    expect(getPlayerCenterY({ surfaceY: 512 })).toBe(436)
  })
})

describe('getPlayerHorizontalMovementDecision', () => {
  it('accelerates left with idle drag', () => {
    expect(getPlayerHorizontalMovementDecision({ left: true, right: false })).toEqual({
      direction: 'left',
      accelerationX: -950,
      dragX: 1500,
    })
  })

  it('accelerates right with idle drag', () => {
    expect(getPlayerHorizontalMovementDecision({ left: false, right: true })).toEqual({
      direction: 'right',
      accelerationX: 950,
      dragX: 1500,
    })
  })

  it('idles with drag when no horizontal input is active', () => {
    expect(getPlayerHorizontalMovementDecision({ left: false, right: false })).toEqual({
      direction: 'none',
      accelerationX: 0,
      dragX: 1500,
    })
  })

  it('keeps prototype left priority when both directions are held', () => {
    expect(getPlayerHorizontalMovementDecision({ left: true, right: true })).toEqual({
      direction: 'left',
      accelerationX: -950,
      dragX: 1500,
    })
  })
})
