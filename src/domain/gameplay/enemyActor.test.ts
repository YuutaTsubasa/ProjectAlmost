import { describe, expect, it } from 'vitest'
import {
  enemyActorDefinitions,
  enemyDefeatPresentation,
  enemyCountsForScore,
  enemyRegenerationPresentation,
  getEnemyDefeatPresentation,
  getEnemyDefeatOutcome,
  getEnemyRegenerationDecision,
  getEnemyRegenerationPresentation,
  getEnemyRespawnDelayMs,
  getEnemySpriteAssetRefs,
  getEnemySpawnY,
  getNextEnemyPatrolDirection,
  getScoreEnemyTargetCount,
  isEnemyHomingTarget,
  shouldProcessEnemyDefeat,
  shouldUpdateEnemyPatrol,
} from './enemyActor'

describe('enemyActorDefinitions', () => {
  it('defines the Armor Guard from prototype values', () => {
    expect(enemyActorDefinitions['armor-guard']).toEqual({
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
        homing: false,
      },
      rules: { respawnPolicy: 'persistent', countsForScore: true },
      presentation: { defeat: 'armor-guard-death', regeneration: 'armor-guard-restore' },
    })
  })

  it('defines the Azure Core from prototype values', () => {
    expect(enemyActorDefinitions['azure-core']).toEqual({
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
    })
  })

  it('defines the World 02 Thorn Beetle as a grounded patrol enemy', () => {
    expect(enemyActorDefinitions['thorn-beetle']).toMatchObject({
      type: 'thorn-beetle',
      placement: 'grounded',
      behavior: 'patrol',
      gravity: true,
      body: {
        width: 46,
        height: 42,
        offsetX: 0,
        offsetY: 64,
      },
      sprites: {
        walk: {
          key: 'thorn-beetle-walk',
          assetRef: '/assets/sprites/thorn_beetle_walk/sheet-transparent.webp',
        },
        death: {
          key: 'thorn-beetle-death',
          assetRef: '/assets/sprites/thorn_beetle_death/sheet-transparent.webp',
        },
      },
      patrol: {
        initialDirection: -1,
        speed: 72,
      },
      targeting: {
        homing: true,
      },
      facing: {
        rightFlipX: false,
      },
    })
  })

  it('defines the World 02 Seed Lantern as an airborne Homing target', () => {
    expect(enemyActorDefinitions['seed-lantern']).toMatchObject({
      type: 'seed-lantern',
      placement: 'airborne',
      behavior: 'homing-target',
      gravity: false,
      sprites: {
        idle: {
          key: 'seed-lantern-idle',
          assetRef: '/assets/sprites/seed_lantern_idle/sheet-transparent.webp',
          frameStart: 0,
          frameEnd: 0,
          repeat: 0,
        },
      },
      depth: 13,
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
      presentation: {
        defeat: 'seed-lantern-burst',
        regeneration: 'seed-lantern-materialize',
      },
    })
  })
})

describe('getEnemySpawnY', () => {
  it('calculates spawn Y from enemy placement definitions', () => {
    expect(getEnemySpawnY({ type: 'thorn-beetle', surfaceY: 640 })).toBe(594)
    expect(getEnemySpawnY({ type: 'seed-lantern', y: 420 })).toBe(420)
  })

  it('lifts Armor Guards above the authored platform surface for rebuilt terrain art', () => {
    expect(
      getEnemySpawnY({
        type: 'armor-guard',
        surfaceY: 512,
      }),
    ).toBe(432)
  })

  it('uses the authored y position for Azure Cores', () => {
    expect(
      getEnemySpawnY({
        type: 'azure-core',
        y: 360,
      }),
    ).toBe(360)
  })
})

describe('getNextEnemyPatrolDirection', () => {
  it('turns right below the patrol minimum', () => {
    expect(
      getNextEnemyPatrolDirection({
        x: 199,
        patrolMinX: 200,
        patrolMaxX: 400,
        currentDirection: -1,
      }),
    ).toBe(1)
  })

  it('turns left above the patrol maximum', () => {
    expect(
      getNextEnemyPatrolDirection({
        x: 401,
        patrolMinX: 200,
        patrolMaxX: 400,
        currentDirection: 1,
      }),
    ).toBe(-1)
  })

  it('keeps the current direction inside patrol bounds', () => {
    expect(
      getNextEnemyPatrolDirection({
        x: 300,
        patrolMinX: 200,
        patrolMaxX: 400,
        currentDirection: -1,
      }),
    ).toBe(-1)
    expect(
      getNextEnemyPatrolDirection({
        x: 300,
        patrolMinX: 200,
        patrolMaxX: 400,
        currentDirection: 1,
      }),
    ).toBe(1)
  })
})

describe('shouldUpdateEnemyPatrol', () => {
  it('updates patrol only for active patrol-capable enemies', () => {
    expect(shouldUpdateEnemyPatrol({ type: 'thorn-beetle', defeated: false })).toBe(true)
    expect(shouldUpdateEnemyPatrol({ type: 'seed-lantern', defeated: false })).toBe(false)
    expect(shouldUpdateEnemyPatrol({ type: 'thorn-beetle', defeated: true })).toBe(false)
  })

  it('updates active Armor Guard patrol and skips defeated enemies or Azure Cores', () => {
    expect(shouldUpdateEnemyPatrol({ type: 'armor-guard', defeated: false })).toBe(true)
    expect(shouldUpdateEnemyPatrol({ type: 'armor-guard', defeated: true })).toBe(false)
    expect(shouldUpdateEnemyPatrol({ type: 'azure-core', defeated: false })).toBe(false)
  })
})

describe('isEnemyHomingTarget', () => {
  it('uses explicit Homing target capability independent of movement behavior', () => {
    expect(isEnemyHomingTarget('azure-core')).toBe(true)
    expect(isEnemyHomingTarget('seed-lantern')).toBe(true)
    expect(isEnemyHomingTarget('armor-guard')).toBe(false)
    expect(isEnemyHomingTarget('thorn-beetle')).toBe(true)
  })
})

describe('getEnemySpriteAssetRefs', () => {
  it('collects runtime sprite assets from enemy definitions', () => {
    expect(getEnemySpriteAssetRefs(['thorn-beetle', 'seed-lantern', 'thorn-beetle'])).toEqual([
      '/assets/sprites/seed_lantern_idle/sheet-transparent.webp',
      '/assets/sprites/thorn_beetle_death/sheet-transparent.webp',
      '/assets/sprites/thorn_beetle_walk/sheet-transparent.webp',
    ])
  })
})

describe('enemy defeat presentation', () => {
  it('defines prototype presentation timings for defeated enemies', () => {
    expect(enemyDefeatPresentation).toEqual({
      hideDelayMs: 520,
      azureCoreBurst: {
        scale: 1.8,
        alpha: 0,
        angleDelta: 90,
        durationMs: 260,
        ease: 'Quad.easeOut',
      },
    })
  })

  it('routes each enemy type to its defeat presentation', () => {
    expect(getEnemyDefeatPresentation('armor-guard')).toBe('armor-guard-death')
    expect(getEnemyDefeatPresentation('azure-core')).toBe('azure-core-burst')
  })
})

describe('shouldProcessEnemyDefeat', () => {
  it('processes only existing active enemies', () => {
    expect(shouldProcessEnemyDefeat({ enemyExists: true, defeated: false })).toBe(true)
    expect(shouldProcessEnemyDefeat({ enemyExists: true, defeated: true })).toBe(false)
    expect(shouldProcessEnemyDefeat({ enemyExists: false, defeated: false })).toBe(false)
  })
})

describe('enemy scoring rules', () => {
  it('defaults persistent guards to scoring enemies and regenerating Azure Cores to support enemies', () => {
    expect(enemyCountsForScore({ type: 'armor-guard' })).toBe(true)
    expect(enemyCountsForScore({ type: 'azure-core' })).toBe(false)
  })

  it('uses enemy definitions for score and respawn defaults', () => {
    expect(enemyCountsForScore({ type: 'thorn-beetle' })).toBe(true)
    expect(enemyCountsForScore({ type: 'seed-lantern' })).toBe(false)
    expect(getEnemyDefeatOutcome({ type: 'thorn-beetle' })).toEqual({
      scoreDelta: 1,
      shouldRegenerate: false,
    })
    expect(getEnemyDefeatOutcome({ type: 'seed-lantern' })).toEqual({
      scoreDelta: 0,
      shouldRegenerate: true,
    })
  })

  it('allows stage metadata to override score counting', () => {
    expect(enemyCountsForScore({ type: 'armor-guard', countsForScore: false })).toBe(false)
    expect(enemyCountsForScore({ type: 'azure-core', countsForScore: true })).toBe(true)
  })

  it('counts only score-counting enemies for HUD targets and result scoring', () => {
    expect(getScoreEnemyTargetCount({
      enemies: [
        { type: 'armor-guard' },
        { type: 'azure-core' },
        { type: 'azure-core', countsForScore: true },
        { type: 'armor-guard', countsForScore: false },
      ],
    })).toBe(2)
  })

  it('returns defeat outcome score and regeneration routing from enemy metadata', () => {
    expect(getEnemyDefeatOutcome({ type: 'azure-core' })).toEqual({
      scoreDelta: 0,
      shouldRegenerate: true,
    })
    expect(getEnemyDefeatOutcome({ type: 'azure-core', respawnPolicy: 'persistent' })).toEqual({
      scoreDelta: 0,
      shouldRegenerate: false,
    })
    expect(getEnemyDefeatOutcome({ type: 'azure-core', respawnPolicy: 'regenerate' })).toEqual({
      scoreDelta: 0,
      shouldRegenerate: true,
    })
    expect(getEnemyDefeatOutcome({ type: 'armor-guard', countsForScore: false })).toEqual({
      scoreDelta: 0,
      shouldRegenerate: false,
    })
  })
})

describe('enemy regeneration rules', () => {
  it('uses stage respawn delay overrides and the prototype default delay', () => {
    expect(getEnemyRespawnDelayMs({ respawnDelayMs: 650 })).toBe(650)
    expect(getEnemyRespawnDelayMs({})).toBe(1400)
  })

  it('skips, delays, or regenerates based on stage and player state', () => {
    expect(getEnemyRegenerationDecision({
      stageCleared: true,
      enemyDefeated: true,
      playerDead: false,
      playerDistance: 500,
    })).toBe('skip')
    expect(getEnemyRegenerationDecision({
      stageCleared: false,
      enemyDefeated: false,
      playerDead: false,
      playerDistance: 500,
    })).toBe('skip')
    expect(getEnemyRegenerationDecision({
      stageCleared: false,
      enemyDefeated: true,
      playerDead: true,
      playerDistance: 500,
    })).toBe('delay')
    expect(getEnemyRegenerationDecision({
      stageCleared: false,
      enemyDefeated: true,
      playerDead: false,
      playerDistance: 80,
    })).toBe('delay')
    expect(getEnemyRegenerationDecision({
      stageCleared: false,
      enemyDefeated: true,
      playerDead: false,
      playerDistance: 500,
    })).toBe('regenerate')
  })

  it('defines prototype presentation values for regenerated enemies', () => {
    expect(enemyRegenerationPresentation).toEqual({
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
    })
  })

  it('routes each enemy type to its regeneration presentation', () => {
    expect(getEnemyRegenerationPresentation('armor-guard')).toBe('armor-guard-restore')
    expect(getEnemyRegenerationPresentation('azure-core')).toBe('azure-core-materialize')
    expect(getEnemyRegenerationPresentation('seed-lantern')).toBe('seed-lantern-materialize')
  })
})
