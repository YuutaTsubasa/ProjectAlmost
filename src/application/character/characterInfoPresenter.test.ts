import { describe, expect, it } from 'vitest'
import { getCharacterProfile, selectedCharacterId } from '../../domain/character/characterProfile'
import { createCharacterInfoViewModel } from './characterInfoPresenter'

describe('createCharacterInfoViewModel', () => {
  it('projects one selected profile into stage select, gameplay HUD, and result hero data', () => {
    const profile = getCharacterProfile(selectedCharacterId)

    expect(createCharacterInfoViewModel(profile)).toEqual({
      stageSelect: {
        name: 'Yuuta Tsubasa',
        portraitAssetRef: '/assets/hud/player-portrait.webp',
        portraitAlt: 'Yuuta Tsubasa',
      },
      gameplayHud: {
        name: 'Yuuta Tsubasa',
        portraitAssetRef: '/assets/hud/player-portrait.webp',
        portraitAlt: 'Yuuta Tsubasa',
      },
      result: {
        name: 'Yuuta Tsubasa',
        roleName: 'Paladin Candidate',
        standeeAssetRef: '/assets/results/yuuta-stage-result-standee.webp',
        standeeAlt: 'Yuuta Tsubasa',
      },
    })
  })
})
