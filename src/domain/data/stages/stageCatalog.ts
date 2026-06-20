import type { StageId, WorldId } from '../worlds/worldTypes'
import type { StageCatalog, StageData, StageNodePosition } from './stageTypes'

type StageSeed = {
  worldId: WorldId
  background: string
  positions: readonly StageNodePosition[]
  coins: readonly [number, number, number, number, number, number]
}

const seeds: Record<WorldId, StageSeed> = {
  world01: {
    worldId: 'world01',
    background: '/assets/maps/white_palace_stage_select.webp',
    positions: [
      { x: 34, y: 82 },
      { x: 81, y: 86 },
      { x: 74, y: 50 },
      { x: 55, y: 39 },
      { x: 70, y: 27 },
      { x: 73, y: 6 },
    ],
    coins: [24, 28, 30, 32, 34, 12],
  },
  world02: {
    worldId: 'world02',
    background: '/assets/maps/emerald_sanctuary_stage_select.webp',
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
    worldId: 'world03',
    background: '/assets/maps/cerulean_depths_stage_select.webp',
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
    worldId: 'world04',
    background: '/assets/maps/frostveil_peaks_stage_select.webp',
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
    worldId: 'world05',
    background: '/assets/maps/emberfall_caldera_stage_select.webp',
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
    worldId: 'world06',
    background: '/assets/maps/abyssal_hollow_stage_select.webp',
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

const worldIds = ['world01', 'world02', 'world03', 'world04', 'world05', 'world06'] as const

function createStage(
  worldId: WorldId,
  worldNumber: 1 | 2 | 3 | 4 | 5 | 6,
  stageNumber: 1 | 2 | 3 | 4 | 5 | 6,
): StageData {
  const seed = seeds[worldId]
  const id = `${worldNumber}-${stageNumber}` as StageId
  const isBoss = stageNumber === 6

  return {
    id,
    worldId,
    number: stageNumber,
    titleRef: `stages.${id}.title`,
    subtitleRef: `stages.${id}.subtitle`,
    objectiveRef: isBoss ? 'stageObjectives.defeatBoss' : 'stageObjectives.reachGoal',
    collectibleCount: seed.coins[stageNumber - 1],
    nodePosition: seed.positions[stageNumber - 1],
    previewAssetRef: seed.background,
    isBoss,
  }
}

const orderedStages = worldIds.flatMap((worldId, worldIndex) =>
  ([1, 2, 3, 4, 5, 6] as const).map((stageNumber) =>
    createStage(worldId, (worldIndex + 1) as 1 | 2 | 3 | 4 | 5 | 6, stageNumber),
  ),
)

export const stages: StageCatalog = {
  order: orderedStages.map((stage) => stage.id),
  items: Object.fromEntries(orderedStages.map((stage) => [stage.id, stage])) as Record<
    StageId,
    StageData
  >,
}
