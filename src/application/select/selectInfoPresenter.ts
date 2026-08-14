import type { StageCatalog, StageData } from '../../domain/data/stages/stageTypes'
import type { StageId, WorldCatalog, WorldData, WorldId } from '../../domain/data/worlds/worldTypes'
import type { GameplayStageMapCatalog } from '../../domain/gameplay/gameplayStageMaps'
import type { StageProgressionOptionState, StageRecord } from '../../domain/progression/stageProgression'

export type WorldSelectInfo = {
  readonly world: WorldData
  readonly clearedStageCount: number
  readonly stageCount: number
  readonly progressPercent: number
}

export type WorldSelectInfoViewModel = {
  readonly worlds: readonly WorldSelectInfo[]
}

export type StageSelectStageInfo = {
  readonly stage: StageData
  readonly collectibleTargetCount: number
  readonly unlocked: boolean
  readonly cleared: boolean
  readonly record: Readonly<StageRecord> | undefined
}

export type StageSelectInfoViewModel = {
  readonly world: WorldData
  readonly stages: readonly StageSelectStageInfo[]
}

function createProgressionLookup(
  progressionOptions: readonly StageProgressionOptionState<StageId>[],
): ReadonlyMap<StageId, StageProgressionOptionState<StageId>> {
  return new Map(progressionOptions.map((option) => [option.stageId, option]))
}

function getStageInfo(
  stage: StageData,
  gameplayMaps: GameplayStageMapCatalog,
  progressionByStageId: ReadonlyMap<StageId, StageProgressionOptionState<StageId>>,
): StageSelectStageInfo {
  const progression = progressionByStageId.get(stage.id)

  return {
    stage,
    collectibleTargetCount: gameplayMaps.items[stage.id]?.coins.length ?? stage.collectibleCount,
    unlocked: progression?.unlocked === true,
    cleared: progression?.cleared === true,
    record: progression?.record,
  }
}

export function projectWorldSelectInfo(
  worlds: WorldCatalog,
  progressionOptions: readonly StageProgressionOptionState<StageId>[],
): WorldSelectInfoViewModel {
  const progressionByStageId = createProgressionLookup(progressionOptions)

  return {
    worlds: worlds.order.map((worldId) => {
      const world = worlds.items[worldId]
      const stageCount = world.stageIds.length
      const clearedStageCount = world.stageIds.filter(
        (stageId) => progressionByStageId.get(stageId)?.cleared === true,
      ).length

      return {
        world,
        clearedStageCount,
        stageCount,
        progressPercent: stageCount > 0 ? (clearedStageCount / stageCount) * 100 : 0,
      }
    }),
  }
}

export function projectStageSelectInfo(
  worlds: WorldCatalog,
  stages: StageCatalog,
  gameplayMaps: GameplayStageMapCatalog,
  worldId: WorldId,
  progressionOptions: readonly StageProgressionOptionState<StageId>[],
): StageSelectInfoViewModel {
  const world = worlds.items[worldId] ?? worlds.items[worlds.order[0]]
  const progressionByStageId = createProgressionLookup(progressionOptions)

  return {
    world,
    stages: world.stageIds.map((stageId) =>
      getStageInfo(stages.items[stageId], gameplayMaps, progressionByStageId),
    ),
  }
}
