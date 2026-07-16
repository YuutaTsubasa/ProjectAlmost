export type CharacterId = 'yuuta'

export type CharacterProfile = {
  id: CharacterId
  displayName: string
  roleName: string
  hudPortraitAssetRef: string
  resultStandeeAssetRef: string
  portraitAlt: string
  standeeAlt: string
}

export const selectedCharacterId: CharacterId = 'yuuta'

const characterProfiles: Record<CharacterId, CharacterProfile> = {
  yuuta: {
    id: 'yuuta',
    displayName: 'Yuuta Tsubasa',
    roleName: 'Paladin Candidate',
    hudPortraitAssetRef: '/assets/hud/player-portrait.webp',
    resultStandeeAssetRef: '/assets/results/yuuta-stage-result-standee.webp',
    portraitAlt: 'Yuuta Tsubasa',
    standeeAlt: 'Yuuta Tsubasa',
  },
}

export function getCharacterProfile(id: CharacterId): CharacterProfile {
  return characterProfiles[id]
}
