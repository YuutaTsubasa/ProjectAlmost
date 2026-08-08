import { describe, expect, it } from 'vitest'
import { getStageIntroSequence } from './avgRegistry'
import source from './avgRegistry.ts?raw'

describe('AVG registry', () => {
  it('returns the first chapter boss intro sequence for stage 1-6', () => {
    const sequence = getStageIntroSequence('1-6')

    expect(sequence).toMatchObject({
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
    })
  })

  it('returns null for stages without intro AVG', () => {
    expect(getStageIntroSequence('1-1')).toBeNull()
    expect(getStageIntroSequence('2-1')).toBeNull()
  })

  it('keeps AVG portrait paths under rebuild runtime assets', () => {
    const sequence = getStageIntroSequence('1-6')

    expect(sequence).not.toBeNull()
    expect(sequence!.characters.map((character) => character.portraitAssetRef)).toEqual([
      '/assets/avg/yuuta-dialogue.webp',
      '/assets/avg/white-priestess-dialogue.webp',
    ])
    expect(sequence!.characters.every((character) =>
      character.portraitAssetRef.startsWith('/assets/')
      && !character.portraitAssetRef.includes('__prototype__'),
    )).toBe(true)
  })

  it('uses the registry as the single source of truth for stage lookup', () => {
    expect(source).toContain('return stageIntroSequences[stageId] ?? null')
    expect(source).not.toContain("if (stageId !== '1-6') return null")
  })
})
