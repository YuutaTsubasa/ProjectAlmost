import type { StageId } from '../data/worlds/worldTypes'
import type { AvgSequence } from './avgTypes'

const firstChapterBossIntro: AvgSequence = {
  id: '1-6-intro',
  characters: [
    {
      id: 'yuuta',
      nameKey: 'avg.speaker.yuuta',
      portraitAssetRef: '/assets/avg/yuuta-dialogue.webp',
      side: 'left',
    },
    {
      id: 'white-priestess',
      nameKey: 'avg.speaker.whitePriestess',
      portraitAssetRef: '/assets/avg/white-priestess-dialogue.webp',
      side: 'right',
    },
  ],
  lines: [
    { speakerId: 'white-priestess', textKey: 'avg.1-6.line1' },
    { speakerId: 'yuuta', textKey: 'avg.1-6.line2' },
    { speakerId: 'white-priestess', textKey: 'avg.1-6.line3' },
    { speakerId: 'yuuta', textKey: 'avg.1-6.line4' },
    { speakerId: 'white-priestess', textKey: 'avg.1-6.line5' },
    { speakerId: 'yuuta', textKey: 'avg.1-6.line6' },
  ],
} as const

const stageIntroSequences = {
  '1-6': firstChapterBossIntro,
} as const satisfies Partial<Record<StageId, AvgSequence>>

export function getStageIntroSequence(stageId: StageId): AvgSequence | null {
  if (stageId !== '1-6') return null

  return stageIntroSequences[stageId]
}
