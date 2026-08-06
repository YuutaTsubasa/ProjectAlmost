import { describe, expect, it } from 'vitest'
import source from './GameplayScreen.svelte?raw'

describe('GameplayScreen AVG wiring', () => {
  it('creates stage intro AVG state from the domain registry', () => {
    expect(source).toContain("import AvgOverlay from '../avg/AvgOverlay.svelte'")
    expect(source).toContain("import { getStageIntroSequence } from '../../domain/avg/avgRegistry'")
    expect(source).toContain('createAvgPlayback(stageIntroSequence)')
    expect(source).toContain('let avgPlayback = $state')
  })

  it('routes AVG control intents before pause or gameplay controls', () => {
    const keydownAvgIndex = source.indexOf('handleAvgControlIntent(intent)')
    const pauseIntentIndex = source.indexOf('handlePauseControlIntent(intent)')
    const resultIntentIndex = source.indexOf('handleResultControlIntent(intent)')

    expect(source).toContain('function handleAvgControlIntent(intent: ControlIntent): boolean')
    expect(keydownAvgIndex).toBeGreaterThan(-1)
    expect(pauseIntentIndex).toBeGreaterThan(keydownAvgIndex)
    expect(resultIntentIndex).toBeGreaterThan(-1)
  })

  it('pauses and resumes the renderer through local reactive AVG state', () => {
    expect(source).toContain('if (isAvgPlaybackActive(avgPlayback))')
    expect(source).toContain('renderer.pause()')
    expect(source).toContain('renderer.resume()')
    expect(source).toContain('renderer.resetTiming()')
    expect(source).not.toContain('projectrun:avg-state')
    expect(source).not.toContain('window.dispatchEvent')
  })

  it('pauses a newly created renderer when stage intro AVG starts active', () => {
    const rendererSetupStart = source.indexOf('renderer = createGameplayRenderer')
    const rendererSetupEnd = source.indexOf('function pollGamepad()', rendererSetupStart)
    const rendererSetup = source.slice(rendererSetupStart, rendererSetupEnd)

    expect(rendererSetupStart).toBeGreaterThan(-1)
    expect(rendererSetupEnd).toBeGreaterThan(rendererSetupStart)
    expect(rendererSetup).toContain('if (isAvgPlaybackActive(avgPlayback))')
    expect(rendererSetup).toContain('renderer.pause()')
    expect(rendererSetup).toContain('rendererPausedForAvg = true')
  })

  it('renders AVG overlay and hides virtual controls while AVG is active', () => {
    const markupStart = source.indexOf('</script>')
    const overlayIndex = source.indexOf('<AvgOverlay', markupStart)
    const virtualControlsIndex = source.indexOf('<VirtualControls', markupStart)

    expect(overlayIndex).toBeGreaterThan(-1)
    expect(virtualControlsIndex).toBeGreaterThan(overlayIndex)
    expect(source).toContain('!isAvgPlaybackActive(avgPlayback)')
    expect(source).toMatch(/virtualControlsState\.visible && isGameplayPlayable\(\) && !isAvgPlaybackActive\(avgPlayback\)/)
  })
})
