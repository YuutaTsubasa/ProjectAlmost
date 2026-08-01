import type { StageId, WorldId, WorldNumber } from './worldTypes'

export const WORLD_COUNT = 6
export const STAGES_PER_WORLD = 6

export function formatStageId(worldNumber: number, stageNumber: number): StageId {
  return `${worldNumber}-${stageNumber}` as StageId
}

function isStageGridValue(value: number, max: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= max
}

export function isStageId(value: string): value is StageId {
  const parts = value.split('-')
  if (parts.length !== 2) return false

  const worldNumber = Number(parts[0])
  const stageNumber = Number(parts[1])
  // Bounds come from the shared grid constants (no duplicated range literal), and
  // the round-trip check rejects non-canonical spellings like "01-2" or " 1-2".
  return isStageGridValue(worldNumber, WORLD_COUNT)
    && isStageGridValue(stageNumber, STAGES_PER_WORLD)
    && formatStageId(worldNumber, stageNumber) === value
}

export function parseStageId(stageId: StageId): { worldNumber: WorldNumber; stageNumber: number } {
  const [worldNumber, stageNumber] = stageId.split('-').map(Number)
  return { worldNumber: worldNumber as WorldNumber, stageNumber }
}

export function worldIdFromNumber(worldNumber: number): WorldId {
  return `world0${worldNumber}` as WorldId
}
