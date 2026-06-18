import type { TranslationKey } from '../../i18n'

export type AvgSpeakerId = 'yuuta' | 'white-priestess'

export type AvgCharacter = {
  id: AvgSpeakerId
  name: TranslationKey
  portrait: string
  side: 'left' | 'right'
}

export type AvgLine = {
  speaker: AvgSpeakerId
  text: TranslationKey
}

export type AvgSequence = {
  id: string
  characters: AvgCharacter[]
  lines: AvgLine[]
}
