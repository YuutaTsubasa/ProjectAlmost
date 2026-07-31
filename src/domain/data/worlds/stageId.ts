import type { StageId, WorldId, WorldNumber } from './worldTypes'

export const WORLD_COUNT = 6
export const STAGES_PER_WORLD = 6

const STAGE_ID_PATTERN = /^[1-6]-[1-6]$/

export function isStageId(value: string): value is StageId {
  return STAGE_ID_PATTERN.test(value)
}

export function formatStageId(worldNumber: number, stageNumber: number): StageId {
  return `${worldNumber}-${stageNumber}` as StageId
}

export function parseStageId(stageId: StageId): { worldNumber: WorldNumber; stageNumber: number } {
  const [worldNumber, stageNumber] = stageId.split('-').map(Number)
  return { worldNumber: worldNumber as WorldNumber, stageNumber }
}

export function worldIdFromNumber(worldNumber: number): WorldId {
  return `world0${worldNumber}` as WorldId
}
