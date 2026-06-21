import { describe, expect, it } from 'vitest'
import {
  enemyActorDefinitions,
  enemyDefeatPresentation,
  getEnemyDefeatPresentation,
  getEnemySpawnY,
  getNextEnemyPatrolDirection,
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
    })
  })
})

describe('getEnemySpawnY', () => {
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
  it('updates active Armor Guard patrol and skips defeated enemies or Azure Cores', () => {
    expect(shouldUpdateEnemyPatrol({ type: 'armor-guard', defeated: false })).toBe(true)
    expect(shouldUpdateEnemyPatrol({ type: 'armor-guard', defeated: true })).toBe(false)
    expect(shouldUpdateEnemyPatrol({ type: 'azure-core', defeated: false })).toBe(false)
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
