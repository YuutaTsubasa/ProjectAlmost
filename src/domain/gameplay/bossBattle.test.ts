import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  BOSS_PATTERN_BASE_DELAY_MS,
  BOSS_PATTERN_MIN_DELAY_MS,
  BOSS_PATTERN_PHASE_DELAY_STEP_MS,
  BOSS_PHASE_COUNT,
  bossPriestessSpriteAssets,
  canFireBossVolley,
  canHitBossPrototype,
  canRunBossPatternTick,
  canStartBossPattern,
  getBossHitOutcome,
  getBossHudPhaseDisplay,
  getBossPatternDelayMs,
  getBossPhasePlayerResetState,
  getBossVolleyShots,
  isBossStageDefinition,
  shouldRestartBossPatternAfterRespawn,
  shouldResetBossRunAfterHomingHit,
  shouldResetBossSupportCore,
} from './bossBattle'

describe('boss battle rules', () => {
  it('declares imported White Palace boss Priestess sprite assets under rebuild public paths', () => {
    expect(bossPriestessSpriteAssets).toEqual({
      cast: {
        key: 'boss-priestess-cast',
        assetRef: '/assets/sprites/boss_priestess_cast/sheet-transparent.webp',
        frameWidth: 128,
        frameHeight: 128,
        frameStart: 0,
        frameEnd: 3,
        frameRate: 7,
        repeat: -1,
      },
      hurt: {
        key: 'boss-priestess-hurt',
        assetRef: '/assets/sprites/boss_priestess_hurt/sheet-transparent.webp',
        frameWidth: 128,
        frameHeight: 128,
        frameStart: 0,
        frameEnd: 3,
        frameRate: 10,
        repeat: 0,
      },
      death: {
        key: 'boss-priestess-death',
        assetRef: '/assets/sprites/boss_priestess_death/sheet-transparent.webp',
        frameWidth: 128,
        frameHeight: 128,
        frameStart: 0,
        frameEnd: 3,
        frameRate: 8,
        repeat: 0,
      },
    })
    expect(Object.values(bossPriestessSpriteAssets).every((sprite) =>
      sprite.assetRef.startsWith('/assets/') && !sprite.assetRef.includes('__prototype__'),
    )).toBe(true)
  })

  it('has imported White Palace boss Priestess spritesheets into rebuilt public assets', () => {
    for (const sprite of Object.values(bossPriestessSpriteAssets)) {
      expect(readFileSync(`public${sprite.assetRef}`, 'utf8').length).toBeGreaterThan(0)
    }
  })

  it('uses Prototype boss phase and cadence constants', () => {
    expect(BOSS_PHASE_COUNT).toBe(4)
    expect(BOSS_PATTERN_BASE_DELAY_MS).toBe(980)
    expect(BOSS_PATTERN_PHASE_DELAY_STEP_MS).toBe(90)
    expect(BOSS_PATTERN_MIN_DELAY_MS).toBe(540)
  })

  it('detects boss stages from the stage id and boss prototype enemy', () => {
    expect(isBossStageDefinition({
      stageId: '1-6',
      enemies: [{ id: 'boss-prototype' }],
    })).toBe(true)
    expect(isBossStageDefinition({
      stageId: '1-5',
      enemies: [{ id: 'boss-prototype' }],
    })).toBe(false)
    expect(isBossStageDefinition({
      stageId: '1-6',
      enemies: [{ id: 'approach-core-1' }],
    })).toBe(false)
  })

  it('advances through three phases and defeats on the fourth hit', () => {
    expect(getBossHitOutcome({ currentPhase: 0 })).toEqual({ type: 'advance-phase', nextPhase: 1 })
    expect(getBossHitOutcome({ currentPhase: 1 })).toEqual({ type: 'advance-phase', nextPhase: 2 })
    expect(getBossHitOutcome({ currentPhase: 2 })).toEqual({ type: 'advance-phase', nextPhase: 3 })
    expect(getBossHitOutcome({ currentPhase: 3 })).toEqual({ type: 'defeated', nextPhase: 4 })
  })

  it('calculates Prototype boss pattern delay', () => {
    expect(getBossPatternDelayMs({ phase: 0 })).toBe(980)
    expect(getBossPatternDelayMs({ phase: 1 })).toBe(890)
    expect(getBossPatternDelayMs({ phase: 2 })).toBe(800)
    expect(getBossPatternDelayMs({ phase: 3 })).toBe(710)
    expect(getBossPatternDelayMs({ phase: 5 })).toBe(540)
  })

  it('returns one aimed shot for phase zero', () => {
    expect(getBossVolleyShots({ phase: 0, shotIndex: 7, aimedAngle: 1.25 })).toEqual([
      { angle: 1.25, speed: 330 },
    ])
  })

  it('returns three sweeping leftward shots for phase one', () => {
    const shotIndex = 3
    const sweep = Math.sin(shotIndex * 0.72) * 0.36
    const shots = getBossVolleyShots({ phase: 1, shotIndex, aimedAngle: 0.5 })

    expect(shots).toHaveLength(3)
    expect(shots.map((shot) => shot.speed)).toEqual([350, 350, 350])
    expect(shots[0]?.angle).toBeCloseTo(Math.PI + sweep - 0.2)
    expect(shots[1]?.angle).toBeCloseTo(Math.PI + sweep)
    expect(shots[2]?.angle).toBeCloseTo(Math.PI + sweep + 0.2)
  })

  it('returns alternating biased phase two shots with aimed shots on even indexes', () => {
    expect(getBossVolleyShots({ phase: 2, shotIndex: 4, aimedAngle: 0.75 })).toEqual([
      { angle: Math.PI - 0.5 - 0.16, speed: 390 },
      { angle: Math.PI - 0.5 + 0.16, speed: 390 },
      { angle: 0.75, speed: 360 },
    ])
    expect(getBossVolleyShots({ phase: 2, shotIndex: 5, aimedAngle: 0.75 })).toEqual([
      { angle: Math.PI + 0.5 - 0.16, speed: 390 },
      { angle: Math.PI + 0.5 + 0.16, speed: 390 },
    ])
  })

  it('returns five radial shots for phase three', () => {
    const shotIndex = 6
    const shots = getBossVolleyShots({ phase: 3, shotIndex, aimedAngle: 0.75 })

    expect(shots).toHaveLength(5)
    for (let index = 0; index < 5; index += 1) {
      expect(shots[index]).toMatchObject({ speed: 390 })
      expect(shots[index]?.angle).toBeCloseTo(Math.PI / 2 + (Math.PI * index) / 4 + shotIndex * 0.1)
    }
  })

  it('returns no shots for unknown phases', () => {
    expect(getBossVolleyShots({ phase: 99, shotIndex: 0, aimedAngle: 0.75 })).toEqual([])
  })

  it('formats boss HUD phase display', () => {
    expect(getBossHudPhaseDisplay({ isBossStage: false, bossPhase: 0 })).toEqual({ phase: 0, max: 0 })
    expect(getBossHudPhaseDisplay({ isBossStage: true, bossPhase: 0 })).toEqual({ phase: 1, max: 4 })
    expect(getBossHudPhaseDisplay({ isBossStage: true, bossPhase: 3 })).toEqual({ phase: 4, max: 4 })
    expect(getBossHudPhaseDisplay({ isBossStage: true, bossPhase: 4 })).toEqual({ phase: 4, max: 4 })
  })

  it('returns phase player reset state', () => {
    expect(getBossPhasePlayerResetState({ maxHealth: 3 })).toEqual({
      health: 3,
      attacking: false,
      homingAttacking: false,
      attackReady: true,
    })
  })

  it('gates boss hit, volley, pattern, support reset, homing reset, and respawn restart decisions', () => {
    expect(canHitBossPrototype({ bossExists: true, bossDefeated: false })).toBe(true)
    expect(canHitBossPrototype({ bossExists: false, bossDefeated: false })).toBe(false)
    expect(canFireBossVolley({ bossExists: true, bossVisible: true })).toBe(true)
    expect(canFireBossVolley({ bossExists: true, bossVisible: false })).toBe(false)
    expect(canStartBossPattern({
      bossExists: true,
      bossType: 'azure-core',
      bossPhase: 3,
      stageCleared: false,
    })).toBe(true)
    expect(canStartBossPattern({
      bossExists: true,
      bossType: 'azure-core',
      bossPhase: 4,
      stageCleared: false,
    })).toBe(false)
    expect(canRunBossPatternTick({
      generation: 2,
      currentGeneration: 2,
      stageCleared: false,
      playerDead: false,
    })).toBe(true)
    expect(canRunBossPatternTick({
      generation: 1,
      currentGeneration: 2,
      stageCleared: false,
      playerDead: false,
    })).toBe(false)
    expect(shouldResetBossSupportCore({ sameAsBoss: false, enemyType: 'azure-core' })).toBe(true)
    expect(shouldResetBossSupportCore({ sameAsBoss: true, enemyType: 'azure-core' })).toBe(false)
    expect(shouldResetBossRunAfterHomingHit({ targetIsBoss: true, bossPhase: 2 })).toBe(true)
    expect(shouldResetBossRunAfterHomingHit({ targetIsBoss: true, bossPhase: 3 })).toBe(false)
    expect(shouldRestartBossPatternAfterRespawn({ isBossStage: true, bossPhase: 3 })).toBe(true)
    expect(shouldRestartBossPatternAfterRespawn({ isBossStage: true, bossPhase: 4 })).toBe(false)
  })
})
