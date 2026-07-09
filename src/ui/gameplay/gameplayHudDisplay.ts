import type { StageId } from '../../domain/data/worlds/worldTypes'
import { localize, resolveLocalizedText, type LocalizationKey } from '../../domain/data/localize/localize'

export type GameplayHudStageDisplay = {
  worldLabel: string
  stageId: StageId
  stageSubtitle: string
}

export const GAMEPLAY_HUD_PLAYER_PORTRAIT_SRC = '/assets/hud/player-portrait.webp'

const worldIdsByStagePrefix = {
  '1': 'world01',
  '2': 'world02',
  '3': 'world03',
  '4': 'world04',
  '5': 'world05',
  '6': 'world06',
} as const

function getWorldTitleKey(stageId: StageId): LocalizationKey {
  const worldPrefix = stageId.split('-')[0] as keyof typeof worldIdsByStagePrefix
  return `worlds.${worldIdsByStagePrefix[worldPrefix]}.title`
}

function getStageSubtitleKey(stageId: StageId): LocalizationKey {
  return `stages.${stageId}.subtitle`
}

export function getGameplayHudStageDisplay(stageId: StageId): GameplayHudStageDisplay {
  return {
    worldLabel: resolveLocalizedText(localize, 'en', getWorldTitleKey(stageId)),
    stageId,
    stageSubtitle: resolveLocalizedText(localize, 'en', getStageSubtitleKey(stageId)),
  }
}
