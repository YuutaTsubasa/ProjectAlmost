import { describe, expect, it } from 'vitest'
import { getCharacterProfile, selectedCharacterId } from './characterProfile'

describe('character profile catalog', () => {
  it('resolves the selected prototype-equivalent character from rebuild-owned metadata', () => {
    const profile = getCharacterProfile(selectedCharacterId)

    expect(profile).toEqual({
      id: 'yuuta',
      displayName: 'Yuuta Tsubasa',
      roleName: 'Paladin Candidate',
      hudPortraitAssetRef: '/assets/hud/player-portrait.webp',
      resultStandeeAssetRef: '/assets/results/yuuta-stage-result-standee.webp',
      portraitAlt: 'Yuuta Tsubasa',
      standeeAlt: 'Yuuta Tsubasa',
    })
  })

  it('keeps character runtime assets inside the rebuild asset tree', () => {
    const profile = getCharacterProfile(selectedCharacterId)
    const assetRefs = [profile.hudPortraitAssetRef, profile.resultStandeeAssetRef]

    expect(assetRefs.every((assetRef) => assetRef.startsWith('/assets/'))).toBe(true)
    expect(assetRefs.every((assetRef) => !assetRef.includes('__prototype__'))).toBe(true)
  })
})
