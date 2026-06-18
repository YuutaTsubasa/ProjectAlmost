import { describe, expect, test } from 'vitest'
import {
  BOSS_PATTERN_BASE_DELAY_MS,
  BOSS_PATTERN_MIN_DELAY_MS,
  BOSS_PATTERN_PHASE_DELAY_STEP_MS,
  BOSS_PHASE_COUNT,
  canStartBossPattern,
  getBossHudPhaseDisplay,
  getBossPatternDelayMs,
  getBossHitOutcome,
  isBossStageDefinition,
  shouldRestartBossPatternAfterRespawn,
  shouldResetBossRunAfterHomingHit,
} from './bossRules'

describe('getBossHitOutcome', () => {
  test('uses four boss phases by default', () => {
    expect(BOSS_PHASE_COUNT).toBe(4)
  })

  test('advances when the next phase is below the phase count', () => {
    expect(getBossHitOutcome({ currentPhase: 0 })).toEqual({ type: 'advance-phase', nextPhase: 1 })
    expect(getBossHitOutcome({ currentPhase: 1 })).toEqual({ type: 'advance-phase', nextPhase: 2 })
    expect(getBossHitOutcome({ currentPhase: 2 })).toEqual({ type: 'advance-phase', nextPhase: 3 })
  })

  test('defeats the boss when the next phase reaches the phase count', () => {
    expect(getBossHitOutcome({ currentPhase: 3 })).toEqual({ type: 'defeated', nextPhase: 4 })
  })

  test('supports an explicit phase count for boundary checks', () => {
    expect(getBossHitOutcome({ currentPhase: 1, phaseCount: 3 })).toEqual({ type: 'advance-phase', nextPhase: 2 })
    expect(getBossHitOutcome({ currentPhase: 2, phaseCount: 3 })).toEqual({ type: 'defeated', nextPhase: 3 })
  })
})

describe('getBossPatternDelayMs', () => {
  test('keeps boss cadence constants explicit', () => {
    expect(BOSS_PATTERN_BASE_DELAY_MS).toBe(980)
    expect(BOSS_PATTERN_PHASE_DELAY_STEP_MS).toBe(90)
    expect(BOSS_PATTERN_MIN_DELAY_MS).toBe(540)
  })

  test('reduces delay by phase without clamping during playable boss phases', () => {
    expect(getBossPatternDelayMs({ phase: 0 })).toBe(980)
    expect(getBossPatternDelayMs({ phase: 1 })).toBe(890)
    expect(getBossPatternDelayMs({ phase: 2 })).toBe(800)
    expect(getBossPatternDelayMs({ phase: 3 })).toBe(710)
  })

  test('does not clamp phase 4 but clamps phase 5 and above', () => {
    expect(getBossPatternDelayMs({ phase: 4 })).toBe(620)
    expect(getBossPatternDelayMs({ phase: 5 })).toBe(540)
    expect(getBossPatternDelayMs({ phase: 100 })).toBe(540)
  })
})

describe('getBossHudPhaseDisplay', () => {
  test('hides phase values for non-boss stages', () => {
    expect(getBossHudPhaseDisplay({
      isBossStage: false,
      bossPhase: 0,
    })).toEqual({ phase: 0, max: 0 })
  })

  test('displays one-based boss phase values', () => {
    expect(getBossHudPhaseDisplay({
      isBossStage: true,
      bossPhase: 0,
    })).toEqual({ phase: 1, max: 4 })
    expect(getBossHudPhaseDisplay({
      isBossStage: true,
      bossPhase: 3,
    })).toEqual({ phase: 4, max: 4 })
  })

  test('caps displayed boss phase at the phase count', () => {
    expect(getBossHudPhaseDisplay({
      isBossStage: true,
      bossPhase: 4,
    })).toEqual({ phase: 4, max: 4 })
  })

  test('supports an explicit phase count', () => {
    expect(getBossHudPhaseDisplay({
      isBossStage: true,
      bossPhase: 2,
      phaseCount: 3,
    })).toEqual({ phase: 3, max: 3 })
  })
})

describe('isBossStageDefinition', () => {
  test('requires both a sixth stage id and a boss prototype enemy', () => {
    expect(isBossStageDefinition({
      stageId: '1-6',
      enemies: [{ id: 'boss-prototype' }],
    })).toBe(true)
  })

  test('rejects non-sixth stages even when a boss prototype enemy exists', () => {
    expect(isBossStageDefinition({
      stageId: '1-5',
      enemies: [{ id: 'boss-prototype' }],
    })).toBe(false)
  })

  test('rejects sixth stages without a boss prototype enemy', () => {
    expect(isBossStageDefinition({
      stageId: '1-6',
      enemies: [{ id: 'guard-1' }, {}],
    })).toBe(false)
  })
})

describe('shouldResetBossRunAfterHomingHit', () => {
  test('does not reset the boss run for non-boss targets', () => {
    expect(shouldResetBossRunAfterHomingHit({
      targetIsBoss: false,
      bossPhase: 0,
    })).toBe(false)
  })

  test('resets the boss run for boss targets before the final playable phase', () => {
    expect(shouldResetBossRunAfterHomingHit({
      targetIsBoss: true,
      bossPhase: 0,
    })).toBe(true)
    expect(shouldResetBossRunAfterHomingHit({
      targetIsBoss: true,
      bossPhase: 2,
    })).toBe(true)
  })

  test('does not reset the boss run on the final playable phase', () => {
    expect(shouldResetBossRunAfterHomingHit({
      targetIsBoss: true,
      bossPhase: 3,
    })).toBe(false)
  })

  test('supports an explicit phase count for boundary checks', () => {
    expect(shouldResetBossRunAfterHomingHit({
      targetIsBoss: true,
      bossPhase: 1,
      phaseCount: 3,
    })).toBe(true)
    expect(shouldResetBossRunAfterHomingHit({
      targetIsBoss: true,
      bossPhase: 2,
      phaseCount: 3,
    })).toBe(false)
  })
})

describe('shouldRestartBossPatternAfterRespawn', () => {
  test('does not restart the boss pattern on non-boss stages', () => {
    expect(shouldRestartBossPatternAfterRespawn({
      isBossStage: false,
      bossPhase: 0,
    })).toBe(false)
  })

  test('restarts the boss pattern on boss stages before the phase count', () => {
    expect(shouldRestartBossPatternAfterRespawn({
      isBossStage: true,
      bossPhase: 0,
    })).toBe(true)
    expect(shouldRestartBossPatternAfterRespawn({
      isBossStage: true,
      bossPhase: 3,
    })).toBe(true)
  })

  test('does not restart the boss pattern when boss phase reaches the phase count', () => {
    expect(shouldRestartBossPatternAfterRespawn({
      isBossStage: true,
      bossPhase: 4,
    })).toBe(false)
  })

  test('supports an explicit phase count for boundary checks', () => {
    expect(shouldRestartBossPatternAfterRespawn({
      isBossStage: true,
      bossPhase: 2,
      phaseCount: 3,
    })).toBe(true)
    expect(shouldRestartBossPatternAfterRespawn({
      isBossStage: true,
      bossPhase: 3,
      phaseCount: 3,
    })).toBe(false)
  })
})

describe('canStartBossPattern', () => {
  test('rejects when the boss prototype is missing', () => {
    expect(canStartBossPattern({
      bossExists: false,
      bossType: 'azure-core',
      bossPhase: 0,
      stageCleared: false,
    })).toBe(false)
  })

  test('rejects when the boss prototype is not an Azure Core', () => {
    expect(canStartBossPattern({
      bossExists: true,
      bossType: 'guard',
      bossPhase: 0,
      stageCleared: false,
    })).toBe(false)
  })

  test('rejects after the stage is cleared', () => {
    expect(canStartBossPattern({
      bossExists: true,
      bossType: 'azure-core',
      bossPhase: 0,
      stageCleared: true,
    })).toBe(false)
  })

  test('allows start while the boss phase is below the phase count', () => {
    expect(canStartBossPattern({
      bossExists: true,
      bossType: 'azure-core',
      bossPhase: 0,
      stageCleared: false,
    })).toBe(true)
    expect(canStartBossPattern({
      bossExists: true,
      bossType: 'azure-core',
      bossPhase: 3,
      stageCleared: false,
    })).toBe(true)
  })

  test('rejects when the boss phase reaches the phase count', () => {
    expect(canStartBossPattern({
      bossExists: true,
      bossType: 'azure-core',
      bossPhase: 4,
      stageCleared: false,
    })).toBe(false)
  })

  test('supports an explicit phase count for boundary checks', () => {
    expect(canStartBossPattern({
      bossExists: true,
      bossType: 'azure-core',
      bossPhase: 2,
      stageCleared: false,
      phaseCount: 3,
    })).toBe(true)
    expect(canStartBossPattern({
      bossExists: true,
      bossType: 'azure-core',
      bossPhase: 3,
      stageCleared: false,
      phaseCount: 3,
    })).toBe(false)
  })
})
