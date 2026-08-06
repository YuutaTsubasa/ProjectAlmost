import { describe, expect, it } from 'vitest'
import { getStageIntroSequence } from './avgRegistry'
import {
  advanceAvgPlayback,
  createAvgPlayback,
  getActiveAvgLineView,
  isAvgPlaybackActive,
  skipAvgPlayback,
} from './avgPlayback'

const sequence = getStageIntroSequence('1-6')!

describe('AVG playback', () => {
  it('starts active at the first line', () => {
    const state = createAvgPlayback(sequence)

    expect(state).toMatchObject({ status: 'active', sequence, lineIndex: 0 })
    expect(isAvgPlaybackActive(state)).toBe(true)
    expect(getActiveAvgLineView(state)).toMatchObject({
      line: { speakerId: 'white-priestess', textKey: 'avg.1-6.line1' },
      speaker: { id: 'white-priestess' },
      lineIndex: 0,
      lineCount: 6,
    })
  })

  it('advances line by line and completes after the final line', () => {
    const line2 = advanceAvgPlayback(createAvgPlayback(sequence))
    expect(line2).toMatchObject({ status: 'active', lineIndex: 1 })
    expect(getActiveAvgLineView(line2)).toMatchObject({
      line: { speakerId: 'yuuta', textKey: 'avg.1-6.line2' },
      speaker: { id: 'yuuta' },
    })

    const completed = sequence.lines.reduce(
      (state) => advanceAvgPlayback(state),
      createAvgPlayback(sequence),
    )

    expect(completed).toEqual({ status: 'completed', sequence })
    expect(isAvgPlaybackActive(completed)).toBe(false)
    expect(getActiveAvgLineView(completed)).toBeNull()
  })

  it('skips directly to completed state', () => {
    const skipped = skipAvgPlayback(createAvgPlayback(sequence))

    expect(skipped).toEqual({ status: 'completed', sequence })
    expect(isAvgPlaybackActive(skipped)).toBe(false)
  })
})
