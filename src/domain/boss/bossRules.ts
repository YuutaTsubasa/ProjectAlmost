export const BOSS_PHASE_COUNT = 4
export const BOSS_PATTERN_BASE_DELAY_MS = 980
export const BOSS_PATTERN_PHASE_DELAY_STEP_MS = 90
export const BOSS_PATTERN_MIN_DELAY_MS = 540
export const BOSS_STAGE_ID_SUFFIX = '-6'
export const BOSS_PROTOTYPE_ENEMY_ID = 'boss-prototype'
export const BOSS_PATTERN_ENEMY_TYPE = 'azure-core'

export type BossHitOutcome =
  | { type: 'advance-phase'; nextPhase: number }
  | { type: 'defeated'; nextPhase: number }

export type BossPhasePlayerResetState = {
  health: number
  attacking: boolean
  homingAttacking: boolean
  attackReady: boolean
}

export type BossVolleyShot = {
  angle: number
  speed: number
}

export function isBossStageDefinition(input: {
  stageId: string
  enemies: readonly { id?: string }[]
}): boolean {
  return input.stageId.endsWith(BOSS_STAGE_ID_SUFFIX)
    && input.enemies.some((enemy) => enemy.id === BOSS_PROTOTYPE_ENEMY_ID)
}

export function getBossHitOutcome(input: {
  currentPhase: number
  phaseCount?: number
}): BossHitOutcome {
  const phaseCount = input.phaseCount ?? BOSS_PHASE_COUNT
  const nextPhase = input.currentPhase + 1
  return nextPhase >= phaseCount
    ? { type: 'defeated', nextPhase }
    : { type: 'advance-phase', nextPhase }
}

export function getBossPatternDelayMs(input: { phase: number }): number {
  return Math.max(
    BOSS_PATTERN_MIN_DELAY_MS,
    BOSS_PATTERN_BASE_DELAY_MS - input.phase * BOSS_PATTERN_PHASE_DELAY_STEP_MS,
  )
}

export function getBossPhasePlayerResetState(input: {
  maxHealth: number
}): BossPhasePlayerResetState {
  return {
    health: input.maxHealth,
    attacking: false,
    homingAttacking: false,
    attackReady: true,
  }
}

export function getBossVolleyShots(input: {
  phase: number
  shotIndex: number
  aimedAngle: number
}): BossVolleyShot[] {
  if (input.phase === 0) {
    return [{ angle: input.aimedAngle, speed: 330 }]
  }

  if (input.phase === 1) {
    const sweep = Math.sin(input.shotIndex * 0.72) * 0.36
    return [-0.2, 0, 0.2].map((offset) => ({
      angle: Math.PI + sweep + offset,
      speed: 350,
    }))
  }

  if (input.phase === 2) {
    const verticalBias = input.shotIndex % 2 === 0 ? -0.5 : 0.5
    const shots: BossVolleyShot[] = [-0.16, 0.16].map((offset) => ({
      angle: Math.PI + verticalBias + offset,
      speed: 390,
    }))
    if (input.shotIndex % 2 === 0) {
      shots.push({ angle: input.aimedAngle, speed: 360 })
    }
    return shots
  }

  if (input.phase === 3) {
    return Array.from({ length: 5 }, (_, index) => ({
      angle: Math.PI / 2 + (Math.PI * index) / 4 + input.shotIndex * 0.1,
      speed: 390,
    }))
  }

  return []
}

export function getBossHudPhaseDisplay(input: {
  isBossStage: boolean
  bossPhase: number
  phaseCount?: number
}): {
  phase: number
  max: number
} {
  if (!input.isBossStage) {
    return { phase: 0, max: 0 }
  }

  const phaseCount = input.phaseCount ?? BOSS_PHASE_COUNT
  return {
    phase: Math.min(input.bossPhase + 1, phaseCount),
    max: phaseCount,
  }
}

export function shouldResetBossRunAfterHomingHit(input: {
  targetIsBoss: boolean
  bossPhase: number
  phaseCount?: number
}): boolean {
  if (!input.targetIsBoss) return false

  const phaseCount = input.phaseCount ?? BOSS_PHASE_COUNT
  return input.bossPhase < phaseCount - 1
}

export function shouldRestartBossPatternAfterRespawn(input: {
  isBossStage: boolean
  bossPhase: number
  phaseCount?: number
}): boolean {
  if (!input.isBossStage) return false

  const phaseCount = input.phaseCount ?? BOSS_PHASE_COUNT
  return input.bossPhase < phaseCount
}

export function canStartBossPattern(input: {
  bossExists: boolean
  bossType?: string
  bossPhase: number
  stageCleared: boolean
  phaseCount?: number
}): boolean {
  if (!input.bossExists) return false
  if (input.bossType !== BOSS_PATTERN_ENEMY_TYPE) return false
  if (input.stageCleared) return false

  const phaseCount = input.phaseCount ?? BOSS_PHASE_COUNT
  return input.bossPhase < phaseCount
}
