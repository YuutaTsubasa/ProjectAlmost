import { describe, expect, it } from 'vitest'
import {
  createInitialPreloadProgress,
  presentPreloadProgress,
  recordPreloadFailure,
  recordPreloadSuccess,
} from './preloadProgress'

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
})
