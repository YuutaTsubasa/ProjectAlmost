import type { PreloadAssetKind } from '../../domain/assets/preloadManifest'

export type PreloadPhase = 'boot' | 'gameplay' | 'background'
export type PreloadStatus = 'idle' | 'loading' | 'ready' | 'ready-with-errors'

export type PreloadFailure = {
  source: string
  kind: PreloadAssetKind
  message: string
}

export type PreloadProgressState = {
  phase: PreloadPhase
  total: number
  completedSources: readonly string[]
  failures: readonly PreloadFailure[]
}

export type PreloadProgressSnapshot = {
  phase: PreloadPhase
  completed: number
  total: number
  percent: number
  warningCount: number
  status: PreloadStatus
}

export function createInitialPreloadProgress(total: number, phase: PreloadPhase): PreloadProgressState {
  return {
    phase,
    total: Math.max(0, total),
    completedSources: [],
    failures: [],
  }
}

export function recordPreloadSuccess(state: PreloadProgressState, source: string): PreloadProgressState {
  if (state.completedSources.includes(source)) return state

  return {
    ...state,
    completedSources: [...state.completedSources, source],
  }
}

export function recordPreloadFailure(
  state: PreloadProgressState,
  failure: PreloadFailure,
): PreloadProgressState {
  if (state.failures.some((item) => item.source === failure.source)) return state

  return {
    ...state,
    failures: [...state.failures, failure],
  }
}

function getPreloadStatus(input: {
  total: number
  completed: number
  failureCount: number
}): PreloadStatus {
  if (input.total === 0) return 'idle'
  if (input.completed < input.total) return 'loading'

  return input.failureCount > 0 ? 'ready-with-errors' : 'ready'
}

export function presentPreloadProgress(state: PreloadProgressState): PreloadProgressSnapshot {
  const completed = Math.min(state.total, state.completedSources.length + state.failures.length)
  const percent = state.total === 0 ? 0 : Math.min(100, Math.max(0, Math.round((completed / state.total) * 100)))
  const status = getPreloadStatus({
    total: state.total,
    completed,
    failureCount: state.failures.length,
  })

  return {
    phase: state.phase,
    completed,
    total: state.total,
    percent,
    warningCount: state.failures.length,
    status,
  }
}
