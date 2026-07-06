import { describe, expect, it, vi } from 'vitest'
import { applyGameplayResultAction } from '../../domain/app/appFlow'

describe('GameplayScreen result wiring', () => {
  it('routes retry actions to the retry callback', () => {
    const onRetry = vi.fn()
    const onStageSelect = vi.fn()

    applyGameplayResultAction('retry', { onRetry, onStageSelect })

    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(onStageSelect).not.toHaveBeenCalled()
  })

  it('routes stage-select actions to the stage select callback', () => {
    const onRetry = vi.fn()
    const onStageSelect = vi.fn()

    applyGameplayResultAction('stage-select', { onRetry, onStageSelect })

    expect(onRetry).not.toHaveBeenCalled()
    expect(onStageSelect).toHaveBeenCalledTimes(1)
  })
})
