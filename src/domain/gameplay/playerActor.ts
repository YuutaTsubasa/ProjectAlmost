export type PlayerActorId = 'player'
export type PlayerAnimationKey = 'idle' | 'run'
export type PlayerMovementDirection = 'left' | 'right' | 'none'

export type PlayerAnimationDefinition = {
  key: string
  assetRef: string
  frameWidth: number
  frameHeight: number
  frameStart: number
  frameEnd: number
  frameRate: number
  repeat: number
}

export type PlayerActorDefinition = {
  id: PlayerActorId
  sprites: Record<PlayerAnimationKey, PlayerAnimationDefinition>
  origin: { x: number; y: number }
  body: { width: number; height: number; offsetX: number; offsetY: number }
  centerAboveSurface: number
  scale: number
  maxVelocity: { x: number; y: number }
  gravityY: number
  movement: {
    groundAcceleration: number
    idleDragX: number
  }
}

export type PlayerMovementInput = {
  left: boolean
  right: boolean
}

export type PlayerHorizontalMovementDecision = {
  direction: PlayerMovementDirection
  accelerationX: number
  dragX: number
}

export const playerActorDefinition: PlayerActorDefinition = {
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
  },
  origin: { x: 0.5, y: 0.5 },
  body: { width: 34, height: 72, offsetX: 47, offsetY: 42 },
  centerAboveSurface: 76,
  scale: 0.78,
  maxVelocity: { x: 500, y: 900 },
  gravityY: 1500,
  movement: {
    groundAcceleration: 950,
    idleDragX: 1500,
  },
}

export function getPlayerCenterY(input: { surfaceY: number }): number {
  return input.surfaceY - playerActorDefinition.centerAboveSurface
}

export function getPlayerHorizontalMovementDecision(
  input: PlayerMovementInput,
): PlayerHorizontalMovementDecision {
  if (input.left) {
    return {
      direction: 'left',
      accelerationX: -playerActorDefinition.movement.groundAcceleration,
      dragX: playerActorDefinition.movement.idleDragX,
    }
  }

  if (input.right) {
    return {
      direction: 'right',
      accelerationX: playerActorDefinition.movement.groundAcceleration,
      dragX: playerActorDefinition.movement.idleDragX,
    }
  }

  return {
    direction: 'none',
    accelerationX: 0,
    dragX: playerActorDefinition.movement.idleDragX,
  }
}
