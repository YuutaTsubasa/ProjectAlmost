export type EnemyActorType = 'armor-guard' | 'azure-core'
export type EnemyPlacement = 'grounded' | 'airborne'
export type EnemyBehavior = 'patrol' | 'homing-target'
export type EnemyPatrolDirection = -1 | 1
export type EnemyDefeatPresentation = 'armor-guard-death' | 'azure-core-burst'
export type EnemyRespawnPolicy = 'persistent' | 'regenerate'
export type EnemyRegenerationDecision = 'skip' | 'delay' | 'regenerate'
export type EnemyRegenerationPresentation = 'armor-guard-restore' | 'azure-core-materialize'

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
export type EnemyRuleInput = {
  type: EnemyActorType
  respawnPolicy?: EnemyRespawnPolicy
  respawnDelayMs?: number
  countsForScore?: boolean
}

export type EnemyDefeatOutcome = {
  scoreDelta: number
  shouldRegenerate: boolean
}

export const enemyActorDefinitions = {
  'armor-guard': {
    type: 'armor-guard',
    placement: 'grounded',
    behavior: 'patrol',
    origin: { x: 0.5, y: 0.5 },
    body: { width: 46, height: 54, offsetX: 41, offsetY: 54 },
    centerAboveSurface: 70,
    visualLiftY: 10,
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

export const enemyDefeatPresentation = {
  hideDelayMs: 520,
  azureCoreBurst: {
    scale: 1.8,
    alpha: 0,
    angleDelta: 90,
    durationMs: 260,
    ease: 'Quad.easeOut',
  },
} as const

export const enemyRegenerationPresentation = {
  retryDelayMs: 300,
  safeDistance: 140,
  azureCore: {
    startScale: 0.35,
    endScale: 1,
    startAlpha: 0,
    endAlpha: 1,
    durationMs: 320,
    ease: 'Back.easeOut',
  },
} as const

const defaultEnemyRules = {
  'armor-guard': {
    respawnPolicy: 'persistent',
    countsForScore: true,
  },
  'azure-core': {
    respawnPolicy: 'regenerate',
    countsForScore: false,
  },
} as const satisfies Record<EnemyActorType, {
  respawnPolicy: EnemyRespawnPolicy
  countsForScore: boolean
}>

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

export function getEnemyDefeatPresentation(type: EnemyActorType): EnemyDefeatPresentation {
  if (type === 'armor-guard') {
    return 'armor-guard-death'
  }

  return 'azure-core-burst'
}

export function enemyCountsForScore(input: Pick<EnemyRuleInput, 'type' | 'countsForScore'>): boolean {
  return input.countsForScore ?? defaultEnemyRules[input.type].countsForScore
}

export function getScoreEnemyTargetCount(input: {
  enemies: readonly Pick<EnemyRuleInput, 'type' | 'countsForScore'>[]
}): number {
  return input.enemies.filter((enemy) => enemyCountsForScore(enemy)).length
}

export function getEnemyDefeatOutcome(input: Pick<EnemyRuleInput, 'type' | 'respawnPolicy' | 'countsForScore'>): EnemyDefeatOutcome {
  const respawnPolicy = input.respawnPolicy ?? defaultEnemyRules[input.type].respawnPolicy

  return {
    scoreDelta: enemyCountsForScore(input) ? 1 : 0,
    shouldRegenerate: respawnPolicy === 'regenerate',
  }
}

export function getEnemyRespawnDelayMs(input: Pick<EnemyRuleInput, 'respawnDelayMs'>): number {
  return input.respawnDelayMs ?? 1400
}

export function getEnemyRegenerationDecision(input: {
  stageCleared: boolean
  enemyDefeated: boolean
  playerDead: boolean
  playerDistance: number
  safeDistance?: number
}): EnemyRegenerationDecision {
  if (input.stageCleared || !input.enemyDefeated) return 'skip'
  if (input.playerDead) return 'delay'
  if (input.playerDistance < (input.safeDistance ?? enemyRegenerationPresentation.safeDistance)) return 'delay'
  return 'regenerate'
}

export function getEnemyRegenerationPresentation(type: EnemyActorType): EnemyRegenerationPresentation {
  return type === 'azure-core' ? 'azure-core-materialize' : 'armor-guard-restore'
}

export function shouldProcessEnemyDefeat(input: {
  enemyExists: boolean
  defeated: boolean
}): boolean {
  return input.enemyExists && !input.defeated
}

export function shouldUpdateEnemyPatrol(input: {
  type: EnemyActorType
  defeated: boolean
}): boolean {
  return input.type === 'armor-guard' && !input.defeated
}
