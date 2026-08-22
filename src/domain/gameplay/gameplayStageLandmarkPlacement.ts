import type {
  GameplayStageSourceCheckpoint,
  GameplayStageSourceHazard,
} from './gameplayStageSource'
import { checkpointActorDefinition } from './checkpointActor'
import { goalActorDefinition } from './goalActor'
import { playerActorDefinition } from './playerActor'

export type StageLandmarkHazardConflict = {
  landmarkId: string
  landmarkType: 'checkpoint' | 'checkpoint-respawn' | 'goal'
  hazardId: string
}

export function findStageLandmarkHazardConflicts(input: {
  checkpoints: readonly GameplayStageSourceCheckpoint[]
  goal: { x: number; surfaceY: number }
  hazards: readonly GameplayStageSourceHazard[]
}): StageLandmarkHazardConflict[] {
  const landmarks = [
    ...input.checkpoints.flatMap((checkpoint) => [
      {
        id: checkpoint.id,
        type: 'checkpoint' as const,
        x: checkpoint.x,
        surfaceY: checkpoint.surfaceY,
        width: checkpointActorDefinition.displaySize.width,
      },
      {
        id: checkpoint.id,
        type: 'checkpoint-respawn' as const,
        x: checkpoint.spawnX,
        surfaceY: checkpoint.spawnSurfaceY,
        width: playerActorDefinition.body.width,
      },
    ]),
    {
      id: 'stage-goal',
      type: 'goal' as const,
      x: input.goal.x,
      surfaceY: input.goal.surfaceY,
      width: goalActorDefinition.body.width,
    },
  ]
  const floorSpikes = input.hazards.filter((hazard) =>
    hazard.type === 'spikes'
    && (hazard.orientation === undefined || hazard.orientation === 'floor'))

  return landmarks.flatMap<StageLandmarkHazardConflict>((landmark) =>
    floorSpikes
      .filter((hazard) =>
        landmark.surfaceY === hazard.surfaceY
        && landmark.x - landmark.width / 2 < hazard.x + hazard.width / 2
        && landmark.x + landmark.width / 2 > hazard.x - hazard.width / 2)
      .map((hazard) => ({
        landmarkId: landmark.id,
        landmarkType: landmark.type,
        hazardId: hazard.id,
      })),
  )
}
