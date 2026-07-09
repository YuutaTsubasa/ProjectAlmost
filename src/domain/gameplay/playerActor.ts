export type PlayerActorId = 'player'
export type PlayerAnimationKey = 'idle' | 'run' | 'jump' | 'attack' | 'hurt' | 'death' | 'crouch'
export type PlayerBodyPose = 'standing' | 'crouching'
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
  scale: number
}

export type PlayerActorDefinition = {
  id: PlayerActorId
  sprites: Record<PlayerAnimationKey, PlayerAnimationDefinition>
  origin: { x: number; y: number }
  body: PlayerBodyDefinition
  crouch: {
    body: PlayerBodyDefinition
  }
  centerAboveSurface: number
  scale: number
  depth: number
  maxVelocity: { x: number; y: number }
  gravityY: number
  movement: {
    groundAcceleration: number
    idleDragX: number
  }
  jump: {
    coyoteTimeMs: number
    jumpBufferMs: number
    maxAirJumps: number
    velocityY: number
  }
}

export type PlayerBodyDefinition = {
  width: number
  height: number
  offsetX: number
  offsetY: number
}

export type PlayerMovementInput = {
  left: boolean
  right: boolean
  crouching?: boolean
}

export type PlayerHorizontalMovementDecision = {
  direction: PlayerMovementDirection
  accelerationX: number
  dragX: number
  stopVelocityX: boolean
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
}

export function canPlayerCrouch(input: {
  crouchHeld: boolean
  grounded: boolean
  attacking: boolean
  hurting: boolean
  dead: boolean
  stageCleared: boolean
}): boolean {
  return input.crouchHeld
    && input.grounded
    && !input.attacking
    && !input.hurting
    && !input.dead
    && !input.stageCleared
}

export function getPlayerCrouchState(input: {
  crouchHeld: boolean
  grounded: boolean
  attacking: boolean
  hurting: boolean
  dead: boolean
  stageCleared: boolean
}): { crouching: boolean; pose: PlayerBodyPose } {
  const crouching = canPlayerCrouch(input)

  return {
    crouching,
    pose: crouching ? 'crouching' : 'standing',
  }
}

export function getPlayerBodyDefinition(input: {
  pose: PlayerBodyPose
}): PlayerBodyDefinition {
  return input.pose === 'crouching'
    ? playerActorDefinition.crouch.body
    : playerActorDefinition.body
}

export function getPlayerCenterY(input: { surfaceY: number }): number {
  return input.surfaceY - playerActorDefinition.centerAboveSurface
}

export function getPlayerHorizontalMovementDecision(
  input: PlayerMovementInput,
): PlayerHorizontalMovementDecision {
  if (input.crouching ?? false) {
    return {
      direction: 'none',
      accelerationX: 0,
      dragX: playerActorDefinition.movement.idleDragX,
      stopVelocityX: true,
    }
  }

  if (input.left) {
    return {
      direction: 'left',
      accelerationX: -playerActorDefinition.movement.groundAcceleration,
      dragX: playerActorDefinition.movement.idleDragX,
      stopVelocityX: false,
    }
  }

  if (input.right) {
    return {
      direction: 'right',
      accelerationX: playerActorDefinition.movement.groundAcceleration,
      dragX: playerActorDefinition.movement.idleDragX,
      stopVelocityX: false,
    }
  }

  return {
    direction: 'none',
    accelerationX: 0,
    dragX: playerActorDefinition.movement.idleDragX,
    stopVelocityX: false,
  }
}
