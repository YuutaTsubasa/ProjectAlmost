export type EnemyActorType = 'armor-guard' | 'azure-core'
export type EnemyPlacement = 'grounded' | 'airborne'
export type EnemyBehavior = 'patrol' | 'homing-target'
export type EnemyPatrolDirection = -1 | 1

export type EnemySpriteDefinition = {
  key: string
  assetRef: string
  frameWidth: number
  frameHeight: number
  frameStart: number
  frameEnd: number
  frameRate: number
  repeat: number
}

export type EnemyActorDefinition = {
  type: EnemyActorType
  placement: EnemyPlacement
  behavior: EnemyBehavior
  origin: { x: number; y: number }
  body: { width: number; height: number; offsetX: number; offsetY: number }
  gravity: boolean
  depth: number
  scale: number
  centerAboveSurface?: number
  visualLiftY?: number
  sprites?: {
    walk?: EnemySpriteDefinition
    death?: EnemySpriteDefinition
  }
  generatedTexture?: {
    key: string
    width: number
    height: number
  }
  patrol?: {
    initialDirection: EnemyPatrolDirection
    speed: number
  }
  floating?: {
    yOffset: number
    angle: number
    durationMs: number
    ease: string
  }
}

export type ArmorGuardSpawnInput = {
  type: 'armor-guard'
  surfaceY: number
}

export type AzureCoreSpawnInput = {
  type: 'azure-core'
  y: number
}

export type EnemySpawnYInput = ArmorGuardSpawnInput | AzureCoreSpawnInput

export const enemyActorDefinitions = {
  'armor-guard': {
    type: 'armor-guard',
    placement: 'grounded',
    behavior: 'patrol',
    origin: { x: 0.5, y: 0.5 },
    body: { width: 46, height: 54, offsetX: 41, offsetY: 54 },
    centerAboveSurface: 70,
    visualLiftY: 8,
    gravity: true,
    depth: 9,
    scale: 0.82,
    sprites: {
      walk: {
        key: 'enemy-guard-walk',
        assetRef: '/assets/sprites/enemy_guard_walk/sheet-transparent.webp',
        frameWidth: 128,
        frameHeight: 128,
        frameStart: 0,
        frameEnd: 3,
        frameRate: 7,
        repeat: -1,
      },
      death: {
        key: 'enemy-guard-death',
        assetRef: '/assets/sprites/enemy_guard_death/sheet-transparent.webp',
        frameWidth: 128,
        frameHeight: 128,
        frameStart: 0,
        frameEnd: 3,
        frameRate: 8,
        repeat: 0,
      },
    },
    patrol: {
      initialDirection: -1,
      speed: 80,
    },
  },
  'azure-core': {
    type: 'azure-core',
    placement: 'airborne',
    behavior: 'homing-target',
    origin: { x: 0.5, y: 0.5 },
    body: { width: 58, height: 58, offsetX: 9, offsetY: 9 },
    gravity: false,
    depth: 9,
    scale: 1,
    generatedTexture: {
      key: 'azure-core',
      width: 76,
      height: 76,
    },
    floating: {
      yOffset: -14,
      angle: 10,
      durationMs: 950,
      ease: 'Sine.easeInOut',
    },
  },
} as const satisfies Record<EnemyActorType, EnemyActorDefinition>

export function getEnemySpawnY(input: EnemySpawnYInput): number {
  if (input.type === 'azure-core') {
    return input.y
  }

  const definition = enemyActorDefinitions['armor-guard']

  return input.surfaceY - definition.centerAboveSurface - definition.visualLiftY
}

export function getNextEnemyPatrolDirection(input: {
  x: number
  patrolMinX: number
  patrolMaxX: number
  currentDirection: EnemyPatrolDirection
}): EnemyPatrolDirection {
  if (input.x < input.patrolMinX) return 1
  if (input.x > input.patrolMaxX) return -1
  return input.currentDirection
}

export function shouldUpdateEnemyPatrol(type: EnemyActorType): boolean {
  return type === 'armor-guard'
}
