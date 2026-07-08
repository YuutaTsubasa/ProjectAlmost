import { describe, expect, it } from 'vitest'
import type { GameplayStageMap } from './gameplayMapTypes'
import { PLAYER_MAX_HEALTH } from './playerLife'
import { getGameplayStageMap } from './gameplayStageMaps'
import {
  applyGameplayHudPatch,
  clampHudProgress,
  createInitialGameplayHudState,
  formatGameplayHudCoinLabel,
  formatGameplayHudHealthLabel,
  formatGameplayHudTime,
  getHudCheckpointMarkers,
  getHudEnemyMarkers,
  getHudGoalProgress,
  getHudPlatformMarkers,
  getHudPositionProgress,
} from './gameplayHud'

function createHudEnemyFixture(): GameplayStageMap {
  return {
    id: '1-1',
    theme: 'white-palace',
    world: {
      width: 2_400,
      height: 720,
      tileSize: 64,
    },
    rankTargets: {
      sTime: 20,
      aTime: 35,
      bTime: 50,
      cTime: 70,
    },
    backgroundLayers: [],
    player: {
      actorId: 'player',
      spawn: {
        x: 128,
        surfaceY: 576,
      },
    },
    enemies: [
      {
        id: 'test-guard',
        type: 'armor-guard',
        x: 720,
        surfaceY: 432,
        patrolMinX: 607,
        patrolMaxX: 833,
      },
      {
        id: 'test-core',
        type: 'azure-core',
        x: 1_760,
        y: 320,
        patrolMinX: 1_760,
        patrolMaxX: 1_760,
      },
    ],
    coins: [],
    hazards: [],
    checkpoints: [],
    goal: {
      x: 2_200,
      surfaceY: 576,
    },
    terrain: {
      tilesetAssetRef: 'test://tileset',
      solidTileIndexes: [],
      platforms: [],
    },
  }
}

describe('gameplay HUD labels', () => {
  it('formats prototype-style health and coin labels', () => {
    expect(formatGameplayHudHealthLabel({ current: 3, max: 3 })).toBe('HP 3/3')
    expect(formatGameplayHudCoinLabel({ collected: 7, target: 17 })).toBe('COIN 007 / 17')
  })

  it('formats elapsed time as minutes, seconds, and centiseconds', () => {
    expect(formatGameplayHudTime(0)).toBe('00:00.00')
    expect(formatGameplayHudTime(65_432)).toBe('01:05.43')
  })
})

describe('gameplay HUD progress projection', () => {
  it('clamps normalized progress to the HUD range', () => {
    expect(clampHudProgress(-0.25)).toBe(0)
    expect(clampHudProgress(0.5)).toBe(0.5)
    expect(clampHudProgress(1.25)).toBe(1)
  })

  it('projects world positions into clamped normalized mini-map space', () => {
    expect(getHudPositionProgress({ position: 50, worldSize: 200 })).toBe(0.25)
    expect(getHudPositionProgress({ position: 250, worldSize: 200 })).toBe(1)
    expect(getHudPositionProgress({ position: 10, worldSize: 0 })).toBe(0)
  })

  it('projects platforms, checkpoints, enemies, and goal into HUD markers', () => {
    const stage = getGameplayStageMap('1-1')
    expect(stage).toBeDefined()
    if (!stage) return

    expect(getHudPlatformMarkers({
      platforms: [{ col: 2, row: 4, width: 6 }],
      tileColumns: 100,
      tileSize: 64,
      worldHeight: 640,
    })).toEqual([{ x: 0.02, y: 0.4, width: 0.06 }])

    expect(getHudCheckpointMarkers({
      checkpoints: [{ x: 320, surfaceY: 512 }],
      worldWidth: 640,
      worldHeight: 1024,
    })).toEqual([{ x: 0.5, y: 0.5 }])

    expect(getHudEnemyMarkers({
      enemies: [
        { x: 320, y: 256, defeated: false },
        { x: 480, y: 256, defeated: true },
      ],
      worldWidth: 640,
      worldHeight: 512,
    })).toEqual([{ x: 0.5, y: 0.5 }])

    expect(getHudGoalProgress({ goalX: stage.goal.x, worldWidth: stage.world.width })).toBeGreaterThan(0)
  })
})

describe('gameplay HUD state', () => {
  it('creates the initial rebuilt stage HUD state', () => {
    const stage = getGameplayStageMap('1-1')
    expect(stage).toBeDefined()
    if (!stage) return

    const state = createInitialGameplayHudState(stage)

    expect(state).toMatchObject({
      hp: PLAYER_MAX_HEALTH,
      hpMax: PLAYER_MAX_HEALTH,
      coins: 0,
      coinTarget: stage.coins.length,
      damageTaken: 0,
      falls: 0,
      enemiesDefeated: 0,
      enemyTarget: stage.enemies.length,
      checkpointsReached: 0,
      checkpointTarget: stage.checkpoints.length,
      activeCheckpointIndex: -1,
      rank: '--',
      statusMessageKey: 'status.initial',
      cleared: false,
      result: null,
      time: '00:00.00',
    })
    expect(state.mapPlatforms.length).toBe(stage.terrain.platforms.length)
    expect(state.checkpointMarkers.length).toBe(stage.checkpoints.length)
    expect(state.enemyMarkers.length).toBe(stage.enemies.length)
  })

  it('projects enemy markers from each enemy spawn field', () => {
    const stage = createHudEnemyFixture()
    const state = createInitialGameplayHudState(stage)
    const [armorGuard, azureCore] = stage.enemies

    expect(state.enemyMarkers).toHaveLength(2)
    expect(armorGuard.type).toBe('armor-guard')
    expect(azureCore.type).toBe('azure-core')
    if (armorGuard.type === 'armor-guard') {
      expect(state.enemyMarkers[0].y).toBeCloseTo(armorGuard.surfaceY / stage.world.height)
    }
    if (azureCore.type === 'azure-core') {
      expect(state.enemyMarkers[1].y).toBeCloseTo(azureCore.y / stage.world.height)
    }
  })

  it('applies HUD patches immutably', () => {
    const stage = getGameplayStageMap('1-1')
    expect(stage).toBeDefined()
    if (!stage) return

    const first = createInitialGameplayHudState(stage)
    const second = applyGameplayHudPatch(first, {
      hp: 2,
      coins: 1,
      damageTaken: 1,
      activeCheckpointIndex: 0,
      checkpointsReached: 1,
      rank: 'A',
      statusMessageKey: 'status.checkpoint',
    })

    expect(second).toMatchObject({
      hp: 2,
      coins: 1,
      damageTaken: 1,
      activeCheckpointIndex: 0,
      checkpointsReached: 1,
      rank: 'A',
      statusMessageKey: 'status.checkpoint',
    })
    expect(first.hp).toBe(PLAYER_MAX_HEALTH)
    expect(first.rank).toBe('--')
    expect(first.statusMessageKey).toBe('status.initial')
    expect(second).not.toBe(first)
  })

  it('applies a clear result snapshot immutably', () => {
    const stage = getGameplayStageMap('1-1')
    expect(stage).toBeDefined()
    if (!stage) return

    const first = createInitialGameplayHudState(stage)
    const second = applyGameplayHudPatch(first, {
      cleared: true,
      rank: 'S',
      result: {
        elapsedMs: 12_340,
        time: '00:12.34',
        coins: 5,
        coinTarget: 5,
        damageTaken: 0,
        falls: 0,
        enemiesDefeated: 2,
        enemyTarget: 2,
        checkpointsReached: 3,
        checkpointTarget: 3,
        rank: 'S',
      },
    })

    expect(second.result).toEqual({
      elapsedMs: 12_340,
      time: '00:12.34',
      coins: 5,
      coinTarget: 5,
      damageTaken: 0,
      falls: 0,
      enemiesDefeated: 2,
      enemyTarget: 2,
      checkpointsReached: 3,
      checkpointTarget: 3,
      rank: 'S',
    })
    expect(first.result).toBeNull()
    expect(second).not.toBe(first)
  })
})
