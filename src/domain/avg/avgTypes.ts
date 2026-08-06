import type { LocalizationKey } from '../data/localize/localize'

export type AvgSpeakerId = 'yuuta' | 'white-priestess'
export type AvgCharacterSide = 'left' | 'right'

export type AvgCharacter = {
  id: AvgSpeakerId
  nameKey: LocalizationKey
  portraitAssetRef: string
  side: AvgCharacterSide
}

export type AvgLine = {
  speakerId: AvgSpeakerId
  textKey: LocalizationKey
}

export type AvgSequence = {
  id: string
  characters: readonly AvgCharacter[]
  lines: readonly AvgLine[]
}

export type AvgPlaybackState =
  | { status: 'active'; sequence: AvgSequence; lineIndex: number }
  | { status: 'completed'; sequence: AvgSequence }
