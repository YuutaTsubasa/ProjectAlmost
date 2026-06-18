export type EnemyType = 'guard' | 'azure-core'
export type EnemyRespawnPolicy = 'persistent' | 'regenerate'
export type EnemyRegenerationDecision = 'skip' | 'delay' | 'regenerate'
export type PatrolDirection = -1 | 1
export type EnemyDefeatOutcome = {
  scoreDelta: number
  respawnPolicy: EnemyRespawnPolicy
  shouldRegenerate: boolean
}

export type EnemyRuleInput = {
  type?: EnemyType
  respawnPolicy?: EnemyRespawnPolicy
  countsForScore?: boolean
  respawnDelayMs?: number
}

export type EnemyRegenerationInput = {
  stageCleared: boolean
  enemyDefeated: boolean
  playerDead: boolean
  playerDistance: number
  safeDistance?: number
}

export const DEFAULT_ENEMY_REGENERATE_DELAY_MS = 1400
export const DEFAULT_ENEMY_REGENERATE_SAFE_DISTANCE = 140
export const INITIAL_PATROL_DIRECTION: PatrolDirection = -1

export const enemyDefinitions = {
  guard: {
    respawnPolicy: 'persistent',
    countsForScore: true,
  },
  'azure-core': {
    respawnPolicy: 'regenerate',
    countsForScore: false,
  },
} as const satisfies Record<EnemyType, {
  respawnPolicy: EnemyRespawnPolicy
  countsForScore: boolean
}>

function getEnemyType(type?: EnemyType): EnemyType {
  return type ?? 'guard'
}

export function getEnemyRespawnPolicy(input: EnemyRuleInput): EnemyRespawnPolicy {
  return input.respawnPolicy ?? enemyDefinitions[getEnemyType(input.type)].respawnPolicy
}

export function enemyCountsForScore(input: EnemyRuleInput): boolean {
  return input.countsForScore ?? enemyDefinitions[getEnemyType(input.type)].countsForScore
}

export function getScoreEnemyTargetCount(input: {
  enemies: readonly EnemyRuleInput[]
}): number {
  return input.enemies.filter((enemy) => enemyCountsForScore(enemy)).length
}

export function getEnemyDefeatOutcome(input: EnemyRuleInput): EnemyDefeatOutcome {
  const respawnPolicy = getEnemyRespawnPolicy(input)
  return {
    scoreDelta: enemyCountsForScore(input) ? 1 : 0,
    respawnPolicy,
    shouldRegenerate: respawnPolicy === 'regenerate',
  }
}

export function getEnemyRespawnDelayMs(input: Pick<EnemyRuleInput, 'respawnDelayMs'>): number {
  return input.respawnDelayMs ?? DEFAULT_ENEMY_REGENERATE_DELAY_MS
}

export function getEnemyRegenerationDecision(input: EnemyRegenerationInput): EnemyRegenerationDecision {
  if (input.stageCleared || !input.enemyDefeated) return 'skip'
  if (input.playerDead) return 'delay'
  if (input.playerDistance < (input.safeDistance ?? DEFAULT_ENEMY_REGENERATE_SAFE_DISTANCE)) return 'delay'
  return 'regenerate'
}

export function getNextPatrolDirection(input: {
  x: number
  patrolMinX: number
  patrolMaxX: number
  currentDirection: PatrolDirection
}): PatrolDirection {
  if (input.x < input.patrolMinX) return 1
  if (input.x > input.patrolMaxX) return -1
  return input.currentDirection
}

export function hasActiveEnemy(input: {
  enemies: readonly { defeated: boolean }[]
}): boolean {
  return input.enemies.some((enemy) => !enemy.defeated)
}
