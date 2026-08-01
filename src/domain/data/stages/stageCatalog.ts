import { worlds } from '../worlds/worldCatalog'
import { STAGES_PER_WORLD, parseStageId } from '../worlds/stageId'
import type { StageId, WorldData, WorldId } from '../worlds/worldTypes'
import type { StageCatalog, StageData, StageNodePosition } from './stageTypes'

type StageSeed = {
  positions: readonly StageNodePosition[]
  coins: readonly [number, number, number, number, number, number]
}

const seeds: Record<WorldId, StageSeed> = {
  world01: {
    positions: [
      { x: 34, y: 82 },
      { x: 81, y: 86 },
      { x: 74, y: 50 },
      { x: 53, y: 51 },
      { x: 37, y: 41 },
      { x: 71, y: 26 },
    ],
    coins: [24, 28, 30, 32, 34, 12],
  },
  world02: {
    positions: [
      { x: 31, y: 67 },
      { x: 45, y: 58 },
      { x: 58, y: 42 },
      { x: 70, y: 50 },
      { x: 82, y: 32 },
      { x: 91, y: 18 },
    ],
    coins: [26, 30, 32, 34, 36, 14],
  },
  world03: {
    positions: [
      { x: 30, y: 72 },
      { x: 44, y: 56 },
      { x: 58, y: 66 },
      { x: 70, y: 42 },
      { x: 82, y: 28 },
      { x: 91, y: 16 },
    ],
    coins: [26, 28, 34, 36, 38, 14],
  },
  world04: {
    positions: [
      { x: 29, y: 70 },
      { x: 42, y: 58 },
      { x: 56, y: 44 },
      { x: 70, y: 55 },
      { x: 83, y: 34 },
      { x: 91, y: 18 },
    ],
    coins: [28, 30, 34, 36, 40, 16],
  },
  world05: {
    positions: [
      { x: 28, y: 72 },
      { x: 43, y: 57 },
      { x: 58, y: 67 },
      { x: 71, y: 45 },
      { x: 82, y: 30 },
      { x: 91, y: 16 },
    ],
    coins: [30, 32, 36, 38, 42, 16],
  },
  world06: {
    positions: [
      { x: 30, y: 74 },
      { x: 45, y: 60 },
      { x: 58, y: 43 },
      { x: 72, y: 56 },
      { x: 83, y: 32 },
      { x: 91, y: 15 },
    ],
    coins: [32, 34, 38, 40, 44, 18],
  },
}

const previewAssetRefs: Partial<Record<WorldId, string>> = {
  world01: '/assets/maps/white_palace_mid_bg_loop.webp',
}

const previewBackgroundAssetRefs: Partial<Record<WorldId, string>> = {
  world01: '/assets/maps/white_palace_sky.webp',
}

function getStageNumber(stageId: StageId): StageData['number'] {
  return parseStageId(stageId).stageNumber as StageData['number']
}

function createStage(world: WorldData, stageId: StageId): StageData {
  const seed = seeds[world.id]
  const stageNumber = getStageNumber(stageId)
  const isBoss = stageNumber === STAGES_PER_WORLD

  return {
    id: stageId,
    worldId: world.id,
    number: stageNumber,
    titleRef: `stages.${stageId}.title`,
    subtitleRef: `stages.${stageId}.subtitle`,
    objectiveRef: isBoss ? 'stageObjectives.defeatBoss' : 'stageObjectives.reachGoal',
    collectibleCount: seed.coins[stageNumber - 1],
    nodePosition: seed.positions[stageNumber - 1],
    previewAssetRef: previewAssetRefs[world.id] ?? world.assetRefs.stageSelectBackground,
    previewBackgroundAssetRef: previewBackgroundAssetRefs[world.id],
    isBoss,
  }
}

const orderedStages = worlds.order.flatMap((worldId) =>
  worlds.items[worldId].stageIds.map((stageId) => createStage(worlds.items[worldId], stageId)),
)

export const stages: StageCatalog = {
  order: orderedStages.map((stage) => stage.id),
  items: Object.fromEntries(orderedStages.map((stage) => [stage.id, stage])) as Record<
    StageId,
    StageData
  >,
}
