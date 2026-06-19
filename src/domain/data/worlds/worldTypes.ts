import type { LocalizationKey } from '../localize/localize'

export type WorldId = `world0${1 | 2 | 3 | 4 | 5 | 6}`
export type WorldNumber = 1 | 2 | 3 | 4 | 5 | 6
export type WorldTheme = 'palace' | 'forest' | 'ocean' | 'snow' | 'volcano' | 'abyss'
export type StageId = `${WorldNumber}-${1 | 2 | 3 | 4 | 5 | 6}`

export interface WorldAssetRefs {
  stageSelectBackground: string
}

export interface WorldMusicRefs {
  map: string
  bgm: string
  boss: string
}

export interface WorldData {
  id: WorldId
  number: WorldNumber
  titleRef: LocalizationKey
  subtitleRef: LocalizationKey
  theme: WorldTheme
  symbol: string
  stageCount: 6
  stageIds: readonly StageId[]
  assetRefs: WorldAssetRefs
  musicRefs: WorldMusicRefs
}

export interface WorldCatalog {
  order: readonly WorldId[]
  items: Record<WorldId, WorldData>
}
