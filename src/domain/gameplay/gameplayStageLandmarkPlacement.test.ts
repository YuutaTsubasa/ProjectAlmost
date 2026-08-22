import { describe, expect, it } from 'vitest'
import { findStageLandmarkHazardConflicts } from './gameplayStageLandmarkPlacement'
import { gameplayStageSources } from './gameplayStageSources'

describe('gameplay stage landmark placement', () => {
  it('reports checkpoints, respawn positions, and goals overlapping floor spikes', () => {
    expect(findStageLandmarkHazardConflicts({
      checkpoints: [{
        id: 'unsafe-checkpoint',
        x: 100,
        surfaceY: 640,
        spawnX: 200,
        spawnSurfaceY: 640,
      }],
      goal: { x: 300, surfaceY: 640 },
      hazards: [{
        id: 'floor-thorns',
        type: 'spikes',
        x: 200,
        surfaceY: 640,
        width: 260,
        height: 60,
        orientation: 'floor',
      }],
    })).toEqual([
      { landmarkId: 'unsafe-checkpoint', landmarkType: 'checkpoint', hazardId: 'floor-thorns' },
      { landmarkId: 'unsafe-checkpoint', landmarkType: 'checkpoint-respawn', hazardId: 'floor-thorns' },
      { landmarkId: 'stage-goal', landmarkType: 'goal', hazardId: 'floor-thorns' },
    ])
  })

  it('keeps World 02 landmarks clear of spike hazards', () => {
    const conflicts = Object.fromEntries(
      (['2-1', '2-2', '2-3', '2-4', '2-5', '2-6'] as const).map((stageId) => {
      const stage = gameplayStageSources.items[stageId]

      return [stageId, findStageLandmarkHazardConflicts({
        checkpoints: stage.checkpoints,
        goal: stage.goal,
        hazards: stage.hazards ?? [],
      })]
      }),
    )

    expect(conflicts).toEqual({
      '2-1': [],
      '2-2': [],
      '2-3': [],
      '2-4': [],
      '2-5': [],
      '2-6': [],
    })
  })
})
