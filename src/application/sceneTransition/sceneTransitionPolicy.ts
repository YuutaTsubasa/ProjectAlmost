import type { AppScreen } from '../../domain/app/appFlow'

export type SceneTransitionPhase = 'idle' | 'cover' | 'reveal'

export type SceneTransitionStyle = 'page' | 'world-stage-forward' | 'world-stage-back' | 'gameplay'

export type SceneTransitionState = {
  phase: SceneTransitionPhase
  style: SceneTransitionStyle
}

export type SceneTransitionTiming = {
  coverMs: number
  holdMs: number
  revealMs: number
}

export const initialSceneTransitionState: SceneTransitionState = {
  phase: 'idle',
  style: 'page',
}

const TIMINGS: Record<SceneTransitionStyle, SceneTransitionTiming> = {
  page: { coverMs: 260, holdMs: 140, revealMs: 620 },
  'world-stage-forward': { coverMs: 300, holdMs: 140, revealMs: 540 },
  'world-stage-back': { coverMs: 300, holdMs: 140, revealMs: 540 },
  gameplay: { coverMs: 260, holdMs: 420, revealMs: 620 },
}

export function getSceneTransitionTiming(style: SceneTransitionStyle): SceneTransitionTiming {
  return TIMINGS[style]
}

export function canStartSceneTransition(state: SceneTransitionState): boolean {
  return state.phase === 'idle'
}

export function resolveSceneTransitionStyle(from: AppScreen, to: AppScreen): SceneTransitionStyle | null {
  if (from.type === to.type && to.type !== 'gameplay') return null
  if (from.type === 'world-select' && to.type === 'stage-select') return 'world-stage-forward'
  if (from.type === 'stage-select' && to.type === 'world-select') return 'world-stage-back'
  if (to.type === 'gameplay') return 'gameplay'
  return 'page'
}
