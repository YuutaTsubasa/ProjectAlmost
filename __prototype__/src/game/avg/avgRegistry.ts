import { IMAGE_ASSETS } from '../assets/assetManifest'
import type { StageId } from '../stages/stageRegistry'
import type { AvgSequence } from './avgTypes'

const highSpireIntro: AvgSequence = {
  id: '1-6-intro',
  characters: [
    {
      id: 'yuuta',
      name: 'avg.speaker.yuuta',
      portrait: IMAGE_ASSETS.yuutaDialogue,
      side: 'left',
    },
    {
      id: 'white-priestess',
      name: 'avg.speaker.whitePriestess',
      portrait: IMAGE_ASSETS.whitePriestessDialogue,
      side: 'right',
    },
  ],
  lines: [
    { speaker: 'white-priestess', text: 'avg.1-6.line1' },
    { speaker: 'yuuta', text: 'avg.1-6.line2' },
    { speaker: 'white-priestess', text: 'avg.1-6.line3' },
    { speaker: 'yuuta', text: 'avg.1-6.line4' },
    { speaker: 'white-priestess', text: 'avg.1-6.line5' },
    { speaker: 'yuuta', text: 'avg.1-6.line6' },
  ],
}

const stageIntroSequences: Partial<Record<StageId, AvgSequence>> = {
  '1-6': highSpireIntro,
}

export function getStageIntroSequence(stageId: StageId): AvgSequence | undefined {
  return stageIntroSequences[stageId]
}
