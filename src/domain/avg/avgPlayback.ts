import type { AvgCharacter, AvgLine, AvgPlaybackState, AvgSequence } from './avgTypes'

export type ActiveAvgLineView = {
  line: AvgLine
  speaker: AvgCharacter
  lineIndex: number
  lineCount: number
}

export function createAvgPlayback(sequence: AvgSequence): AvgPlaybackState {
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
