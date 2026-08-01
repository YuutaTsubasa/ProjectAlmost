import { describe, expect, it } from 'vitest'
import {
  createInitialPreloadProgress,
  presentPreloadProgress,
  recordPreloadFailure,
  recordPreloadSuccess,
} from './preloadProgress'
import source from './preloadProgress.ts?raw'

describe('preload progress presenter', () => {
  it('reports completed, total, percent, and warning count', () => {
    const initial = createInitialPreloadProgress(4, 'boot')
    const afterSuccess = recordPreloadSuccess(initial, '/assets/title/project-almost-title-background.webp')
    const afterFailure = recordPreloadFailure(afterSuccess, {
      source: '/assets/audio/missing.mp3',
      kind: 'audio',
      message: '404 Not Found',
    })

    expect(presentPreloadProgress(afterFailure)).toEqual({
      phase: 'boot',
      completed: 2,
      total: 4,
      percent: 50,
      warningCount: 1,
      status: 'loading',
    })
  })

  it('marks a completed plan with failures as ready-with-errors', () => {
    const state = recordPreloadFailure(createInitialPreloadProgress(1, 'gameplay'), {
      source: '/assets/audio/missing.mp3',
      kind: 'audio',
      message: '404 Not Found',
    })

    expect(presentPreloadProgress(state).status).toBe('ready-with-errors')
  })

  it('presents an empty plan as idle', () => {
    expect(presentPreloadProgress(createInitialPreloadProgress(0, 'boot'))).toEqual({
      phase: 'boot',
      completed: 0,
      total: 0,
      percent: 0,
      warningCount: 0,
      status: 'idle',
    })
  })

  it('uses explicit preload phases including background work', () => {
    expect(presentPreloadProgress(createInitialPreloadProgress(1, 'background'))).toMatchObject({
      phase: 'background',
      status: 'loading',
    })
    expect(source).toContain("export type PreloadPhase = 'boot' | 'gameplay' | 'background'")
    expect(source).not.toContain('| string')
  })
})
