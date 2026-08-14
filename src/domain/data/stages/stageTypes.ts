import type { LocalizationKey } from '../localize/localize'
import type { StageId, WorldId } from '../worlds/worldTypes'

export type StageNodePosition = {
  x: number
  y: number
}

export interface StageData {
  id: StageId
  worldId: WorldId
  number: 1 | 2 | 3 | 4 | 5 | 6
  titleRef: LocalizationKey
  subtitleRef: LocalizationKey
  objectiveRef: LocalizationKey
  nodePosition: StageNodePosition
  previewAssetRef: string
  previewBackgroundAssetRef?: string
  isBoss: boolean
}

export interface StageCatalog {
  order: readonly StageId[]
  items: Record<StageId, StageData>
}
