import type { StageId } from '../../domain/data/worlds/worldTypes'
import { parseStageId, worldIdFromNumber } from '../../domain/data/worlds/stageId'
import { localize, resolveLocalizedText, type LocalizationKey } from '../../domain/data/localize/localize'

export type GameplayHudStageDisplay = {
  worldLabel: string
  stageId: StageId
  stageSubtitle: string
}

export const GAMEPLAY_HUD_PLAYER_PORTRAIT_SRC = '/assets/hud/player-portrait.webp'

function getWorldTitleKey(stageId: StageId): LocalizationKey {
  return `worlds.${worldIdFromNumber(parseStageId(stageId).worldNumber)}.title`
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
