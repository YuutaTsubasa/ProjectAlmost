import { describe, expect, it } from 'vitest'
import {
  GAMEPLAY_HUD_PLAYER_PORTRAIT_SRC,
  getGameplayHudStageDisplay,
} from './gameplayHudDisplay'

describe('gameplay HUD display data', () => {
  it('resolves rebuilt 1-1 to prototype-equivalent stage banner text', () => {
    expect(getGameplayHudStageDisplay('1-1')).toEqual({
      worldLabel: 'White Palace',
      stageId: '1-1',
      stageSubtitle: 'The First Gate',
    })
  })

  it('resolves non-first stages without falling back to unknown banner text', () => {
    expect(getGameplayHudStageDisplay('1-6')).toEqual({
      worldLabel: 'White Palace',
      stageId: '1-6',
      stageSubtitle: 'The High Spire',
    })
    expect(getGameplayHudStageDisplay('2-1')).toEqual({
      worldLabel: 'Emerald Sanctuary',
      stageId: '2-1',
      stageSubtitle: 'Thornwake Steps',
    })
  })

  it('keeps runtime HUD assets in rebuild public paths', () => {
    expect(GAMEPLAY_HUD_PLAYER_PORTRAIT_SRC).toBe('/assets/hud/player-portrait.webp')
  })
})
