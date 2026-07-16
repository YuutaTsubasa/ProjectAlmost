import type { CharacterProfile } from '../../domain/character/characterProfile'

export type CharacterInfoViewModel = {
  stageSelect: {
    name: string
    portraitAssetRef: string
    portraitAlt: string
  }
  gameplayHud: {
    name: string
    portraitAssetRef: string
    portraitAlt: string
  }
  result: {
    name: string
    roleName: string
    standeeAssetRef: string
    standeeAlt: string
  }
}

export function createCharacterInfoViewModel(profile: CharacterProfile): CharacterInfoViewModel {
  return {
    stageSelect: {
      name: profile.displayName,
      portraitAssetRef: profile.hudPortraitAssetRef,
      portraitAlt: profile.portraitAlt,
    },
    gameplayHud: {
      name: profile.displayName,
      portraitAssetRef: profile.hudPortraitAssetRef,
      portraitAlt: profile.portraitAlt,
    },
    result: {
      name: profile.displayName,
      roleName: profile.roleName,
      standeeAssetRef: profile.resultStandeeAssetRef,
      standeeAlt: profile.standeeAlt,
    },
  }
}
