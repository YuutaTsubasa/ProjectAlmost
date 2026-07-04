import type { StageId } from '../../domain/data/worlds/worldTypes'

export type GameplayHudStageDisplay = {
  worldLabel: string
  stageId: StageId
  stageSubtitle: string
}

export const GAMEPLAY_HUD_PLAYER_PORTRAIT_SRC = '/assets/hud/player-portrait.webp'

const stageDisplays: Partial<Record<StageId, Omit<GameplayHudStageDisplay, 'stageId'>>> = {
  '1-1': {
    worldLabel: 'White Palace',
    stageSubtitle: 'The First Gate',
  },
}

export function getGameplayHudStageDisplay(stageId: StageId): GameplayHudStageDisplay {
  const display = stageDisplays[stageId]

  return {
    worldLabel: display?.worldLabel ?? 'Unknown World',
    stageId,
    stageSubtitle: display?.stageSubtitle ?? 'Unknown Stage',
  }
}
