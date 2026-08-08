import type { AvgCharacter, AvgLine, AvgPlaybackState, AvgSequence } from './avgTypes'

export type ActiveAvgLineView = {
  line: AvgLine
  speaker: AvgCharacter
  lineIndex: number
  lineCount: number
}

export function createAvgPlayback(sequence: AvgSequence): AvgPlaybackState {
  assertValidAvgSequence(sequence)
  return { status: 'active', sequence, lineIndex: 0 }
}

export function advanceAvgPlayback(state: AvgPlaybackState): AvgPlaybackState {
  if (state.status === 'completed') return state

  const nextLineIndex = state.lineIndex + 1
  if (nextLineIndex >= state.sequence.lines.length) {
    return { status: 'completed', sequence: state.sequence }
  }

  return { ...state, lineIndex: nextLineIndex }
}

export function skipAvgPlayback(state: AvgPlaybackState): AvgPlaybackState {
  return { status: 'completed', sequence: state.sequence }
}

export function isAvgPlaybackActive(state: AvgPlaybackState | null): boolean {
  return state?.status === 'active'
}

export function getActiveAvgLineView(state: AvgPlaybackState | null): ActiveAvgLineView | null {
  if (!state || state.status === 'completed') return null

  const line = state.sequence.lines[state.lineIndex]
  const speaker = state.sequence.characters.find((character) => character.id === line?.speakerId)
  if (!line || !speaker) return null

  return {
    line,
    speaker,
    lineIndex: state.lineIndex,
    lineCount: state.sequence.lines.length,
  }
}

function assertValidAvgSequence(sequence: AvgSequence): void {
  if (sequence.lines.length === 0) {
    throw new Error(`AVG sequence ${sequence.id} must contain at least one line.`)
  }

  const speakerIds = new Set(sequence.characters.map((character) => character.id))
  for (const [index, line] of sequence.lines.entries()) {
    if (!speakerIds.has(line.speakerId)) {
      throw new Error(
        `AVG sequence ${sequence.id} line ${index + 1} references unknown speaker ${line.speakerId}.`,
      )
    }
  }
}
