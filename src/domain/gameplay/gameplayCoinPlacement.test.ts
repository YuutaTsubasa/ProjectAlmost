import { describe, expect, it } from 'vitest'
import {
  findCoinGoalConflicts,
  findCoinLandingConflicts,
  findCoinPlacementConflicts,
} from './gameplayCoinPlacement'
import { gameplayStageSources } from './gameplayStageSources'

describe('gameplay coin placement', () => {
  it('detects static platform, moving-platform sweep, and spike intersections', () => {
    expect(findCoinPlacementConflicts({
      tileSize: 64,
      coins: [
        { x: 100, y: 100 },
        { x: 300, y: 100 },
        { x: 500, y: 100 },
      ],
      platforms: [{ col: 1, row: 1, width: 2, height: 1 }],
      movingPlatforms: [{
        id: 'ferry',
        col: 3,
        row: 1,
        width: 1,
        height: 1,
        axis: 'x',
        distance: 100,
        durationMs: 1000,
      }],
      hazards: [{
        id: 'thorns',
        type: 'spikes',
        x: 500,
        surfaceY: 128,
        width: 100,
        height: 64,
      }],
    })).toEqual([
      { coinIndex: 0, obstacleId: 'platform-1', obstacleType: 'static-platform' },
      { coinIndex: 1, obstacleId: 'ferry', obstacleType: 'moving-platform' },
      { coinIndex: 2, obstacleId: 'thorns', obstacleType: 'spikes' },
    ])
  })

  it('keeps World 02 coins clear of platforms and spikes', () => {
    for (const stageId of ['2-1', '2-2', '2-3', '2-4', '2-5'] as const) {
      const stage = gameplayStageSources.items[stageId]

      expect(findCoinPlacementConflicts({
        tileSize: stage.world.tileSize,
        coins: stage.coins,
        platforms: stage.platforms,
        movingPlatforms: stage.movingPlatforms ?? [],
        hazards: stage.hazards ?? [],
      }), stageId).toEqual([])
    }
  })

  it('reports gap and spike-covered landing paths', () => {
    expect(findCoinLandingConflicts({
      tileSize: 64,
      coins: [
        { x: 100, y: 100 },
        { x: 280, y: 100 },
        { x: 360, y: 100 },
      ],
      platforms: [
        { col: 1, row: 3, width: 2, height: 1 },
        { col: 5, row: 3, width: 2, height: 1 },
      ],
      hazards: [{
        id: 'landing-thorns',
        type: 'spikes',
        x: 360,
        surfaceY: 192,
        width: 60,
        height: 64,
      }],
    })).toEqual([
      { coinIndex: 1, obstacleId: 'world-fall', obstacleType: 'missing-static-landing' },
      { coinIndex: 2, obstacleId: 'landing-thorns', obstacleType: 'spike-covered-landing' },
    ])
  })

  it('gives every World 02 coin a safe static landing', () => {
    for (const stageId of ['2-1', '2-2', '2-3', '2-4', '2-5'] as const) {
      const stage = gameplayStageSources.items[stageId]

      expect(findCoinLandingConflicts({
        tileSize: stage.world.tileSize,
        coins: stage.coins,
        platforms: stage.platforms,
        hazards: stage.hazards ?? [],
      }), stageId).toEqual([])
    }
  })

  it('keeps the World 02 boss stage coin-free', () => {
    expect(gameplayStageSources.items['2-6'].coins).toEqual([])
  })

  it('reports coins overlapping the rendered goal', () => {
    expect(findCoinGoalConflicts({
      coins: [{ x: 100, y: 584 }, { x: 300, y: 584 }],
      goal: { x: 120, surfaceY: 640 },
    })).toEqual([{ coinIndex: 0, obstacleId: 'stage-goal' }])
  })

  it('keeps World 02 coins clear of goal visuals', () => {
    for (const stageId of ['2-1', '2-2', '2-3', '2-4', '2-5', '2-6'] as const) {
      const stage = gameplayStageSources.items[stageId]

      expect(findCoinGoalConflicts({
        coins: stage.coins,
        goal: stage.goal,
      }), stageId).toEqual([])
    }
  })
})
