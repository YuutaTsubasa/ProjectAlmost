export type EnemyActorType = 'armor-guard' | 'azure-core' | 'thorn-beetle' | 'seed-lantern'
export type EnemyPlacement = 'grounded' | 'airborne'
export type EnemyBehavior = 'patrol' | 'homing-target'
export type EnemyPatrolDirection = -1 | 1
export type EnemyDefeatPresentation =
  | 'armor-guard-death'
  | 'azure-core-burst'
  | 'thorn-beetle-death'
  | 'seed-lantern-burst'
export type EnemyRespawnPolicy = 'persistent' | 'regenerate'
export type EnemyRegenerationDecision = 'skip' | 'delay' | 'regenerate'
export type EnemyRegenerationPresentation =
  | 'armor-guard-restore'
  | 'azure-core-materialize'
  | 'thorn-beetle-restore'
  | 'seed-lantern-materialize'

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
    idle?: EnemySpriteDefinition
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
  facing: {
    rightFlipX: boolean
  }
  targeting: {
    homing: boolean
  }
  rules: {
    respawnPolicy: EnemyRespawnPolicy
    countsForScore: boolean
  }
  presentation: {
    defeat: EnemyDefeatPresentation
    regeneration: EnemyRegenerationPresentation
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

export type ThornBeetleSpawnInput = {
  type: 'thorn-beetle'
  surfaceY: number
}

export type SeedLanternSpawnInput = {
  type: 'seed-lantern'
  y: number
}

export type EnemySpawnYInput =
  | ArmorGuardSpawnInput
  | AzureCoreSpawnInput
  | ThornBeetleSpawnInput
  | SeedLanternSpawnInput

export type AirborneEnemySpawnYInput = AzureCoreSpawnInput | SeedLanternSpawnInput
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
    facing: {
      rightFlipX: true,
    },
    targeting: {
      homing: true,
    },
    rules: { respawnPolicy: 'persistent', countsForScore: true },
    presentation: { defeat: 'armor-guard-death', regeneration: 'armor-guard-restore' },
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
    facing: {
      rightFlipX: true,
    },
    targeting: {
      homing: true,
    },
    rules: { respawnPolicy: 'regenerate', countsForScore: false },
    presentation: { defeat: 'azure-core-burst', regeneration: 'azure-core-materialize' },
  },
  'thorn-beetle': {
    type: 'thorn-beetle',
    placement: 'grounded',
    behavior: 'patrol',
    origin: { x: 0.5, y: 0.5 },
    body: { width: 46, height: 42, offsetX: 0, offsetY: 64 },
    centerAboveSurface: 30,
    visualLiftY: 4,
    gravity: true,
    depth: 9,
    scale: 1,
    sprites: {
      walk: {
        key: 'thorn-beetle-walk',
        assetRef: '/assets/sprites/thorn_beetle_walk/sheet-transparent.webp',
        frameWidth: 128,
        frameHeight: 128,
        frameStart: 0,
        frameEnd: 3,
        frameRate: 7,
        repeat: -1,
      },
      death: {
        key: 'thorn-beetle-death',
        assetRef: '/assets/sprites/thorn_beetle_death/sheet-transparent.webp',
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
      speed: 72,
    },
    facing: {
      rightFlipX: false,
    },
    targeting: {
      homing: true,
    },
    rules: { respawnPolicy: 'persistent', countsForScore: true },
    presentation: { defeat: 'thorn-beetle-death', regeneration: 'thorn-beetle-restore' },
  },
  'seed-lantern': {
    type: 'seed-lantern',
    placement: 'airborne',
    behavior: 'homing-target',
    origin: { x: 0.5, y: 0.5 },
    body: { width: 58, height: 58, offsetX: 0, offsetY: 0 },
    gravity: false,
    depth: 13,
    scale: 1,
    sprites: {
      idle: {
        key: 'seed-lantern-idle',
        assetRef: '/assets/sprites/seed_lantern_idle/sheet-transparent.webp',
        frameWidth: 128,
        frameHeight: 128,
        frameStart: 2,
        frameEnd: 2,
        frameRate: 7,
        repeat: 0,
      },
    },
    floating: {
      yOffset: -16,
      angle: 8,
      durationMs: 1050,
      ease: 'Sine.easeInOut',
    },
    facing: {
      rightFlipX: true,
    },
    targeting: {
      homing: true,
    },
    rules: { respawnPolicy: 'regenerate', countsForScore: false },
    presentation: { defeat: 'seed-lantern-burst', regeneration: 'seed-lantern-materialize' },
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
  seedLantern: {
    startScale: 0.35,
    endScale: 1,
    startAlpha: 0,
    endAlpha: 1,
    durationMs: 320,
    ease: 'Back.easeOut',
  },
} as const

export function getEnemySpawnY(input: EnemySpawnYInput): number {
  const definition: EnemyActorDefinition = enemyActorDefinitions[input.type]
  if (isAirborneEnemySpawnYInput(input)) {
    return input.y
  }

  return input.surfaceY - (definition.centerAboveSurface ?? 0) - (definition.visualLiftY ?? 0)
}

export function getEnemyDefaultSpriteDefinition(type: EnemyActorType): EnemySpriteDefinition | undefined {
  const definition: EnemyActorDefinition = enemyActorDefinitions[type]
  const sprites = definition.sprites
  return sprites?.walk ?? sprites?.idle
}

export function getEnemySpriteAssetRefs(types: readonly EnemyActorType[]): string[] {
  return [...new Set(types.flatMap((type) => {
    const definition: EnemyActorDefinition = enemyActorDefinitions[type]
    const sprites = definition.sprites
    return sprites ? Object.values(sprites).map((sprite) => sprite.assetRef) : []
  }))].sort()
}

export function isAirborneEnemySpawnYInput(
  input: EnemySpawnYInput,
): input is AirborneEnemySpawnYInput {
  return enemyActorDefinitions[input.type].placement === 'airborne'
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
  return enemyActorDefinitions[type].presentation.defeat
}

export function enemyCountsForScore(input: Pick<EnemyRuleInput, 'type' | 'countsForScore'>): boolean {
  return input.countsForScore ?? enemyActorDefinitions[input.type].rules.countsForScore
}

export function getScoreEnemyTargetCount(input: {
  enemies: readonly Pick<EnemyRuleInput, 'type' | 'countsForScore'>[]
}): number {
  return input.enemies.filter((enemy) => enemyCountsForScore(enemy)).length
}

export function getEnemyDefeatOutcome(input: Pick<EnemyRuleInput, 'type' | 'respawnPolicy' | 'countsForScore'>): EnemyDefeatOutcome {
  const respawnPolicy = input.respawnPolicy ?? enemyActorDefinitions[input.type].rules.respawnPolicy

  return {
    scoreDelta: enemyCountsForScore(input) ? 1 : 0,
    shouldRegenerate: respawnPolicy === 'regenerate',
  }
}

const DEFAULT_ENEMY_RESPAWN_DELAY_MS = 1400

export function getEnemyRespawnDelayMs(input: Pick<EnemyRuleInput, 'respawnDelayMs'>): number {
  return input.respawnDelayMs ?? DEFAULT_ENEMY_RESPAWN_DELAY_MS
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
  return enemyActorDefinitions[type].presentation.regeneration
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
  return enemyActorDefinitions[input.type].behavior === 'patrol' && !input.defeated
}

export function isEnemyHomingTarget(type: EnemyActorType): boolean {
  return enemyActorDefinitions[type].targeting.homing
}
