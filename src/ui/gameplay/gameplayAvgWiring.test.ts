import { describe, expect, it } from 'vitest'
import rawSource from './GameplayScreen.svelte?raw'

const source = rawSource.replaceAll('\r\n', '\n')

describe('GameplayScreen AVG wiring', () => {
  it('creates stage intro AVG state from the domain registry', () => {
    expect(source).toContain("import AvgOverlay from '../avg/AvgOverlay.svelte'")
    expect(source).toContain("import { getStageIntroSequence } from '../../domain/avg/avgRegistry'")
    expect(source).toContain('function createStageIntroAvgPlayback(): AvgPlaybackState | null')
    expect(source).toContain('createAvgPlayback(sequence)')
    expect(source).toContain('let avgPlayback = $state')
  })

  it('routes AVG control intents before pause or gameplay controls', () => {
    const keydownAvgIndex = source.indexOf('handleAvgControlIntent(intent)')
    const pauseIntentIndex = source.indexOf('handlePauseControlIntent(intent)')
    const resultIntentIndex = source.indexOf('handleResultControlIntent(intent)')

    expect(source).toContain('function handleAvgControlIntent(intent: ControlIntent): void')
    expect(keydownAvgIndex).toBeGreaterThan(-1)
    expect(pauseIntentIndex).toBeGreaterThan(keydownAvgIndex)
    expect(resultIntentIndex).toBeGreaterThan(-1)
  })

  it('consumes every keyboard event while AVG is active before pause routing', () => {
    const keyboardBlockMatch = source.match(/function handleKeydown\(event: KeyboardEvent\): void \{[\s\S]*?\n  \}/)
    const keyboardBlock = keyboardBlockMatch?.[0] ?? ''
    const avgInputIndex = keyboardBlock.indexOf('if (isAvgPlaybackActive(avgPlayback)) {')
    const pauseContextIndex = keyboardBlock.indexOf('const context = resolveGameplayControlContext()')

    expect(keyboardBlock).toContain(
      "if (isAvgPlaybackActive(avgPlayback)) {\n      const intent = mapKeyboardControlIntent(",
    )
    expect(keyboardBlock).toContain("'avg',")
    expect(keyboardBlock).toContain('event.preventDefault()')
    expect(keyboardBlock).toContain('if (intent) handleAvgControlIntent(intent)')
    expect(avgInputIndex).toBeGreaterThan(-1)
    expect(pauseContextIndex).toBeGreaterThan(-1)
    expect(avgInputIndex).toBeLessThan(pauseContextIndex)
  })

  it('uses a dedicated AVG control context and early-return context resolver', () => {
    const resolverMatch = source.match(/function resolveGameplayControlContext\(\): ControlContext \{[\s\S]*?\n  \}/)
    const resolver = resolverMatch?.[0] ?? ''
    const pollGamepadMatch = source.match(/function pollGamepad\(\) \{[\s\S]*?previousGamepadSnapshot = currentSnapshot/)
    const pollGamepad = pollGamepadMatch?.[0] ?? ''

    expect(resolver).toContain("if (isAvgPlaybackActive(avgPlayback)) return 'avg'")
    expect(resolver).toContain("if (hudState?.result) return 'stage-select'")
    expect(resolver).toContain("if (pauseState.mode === 'paused') return 'gameplay-pause-menu'")
    expect(resolver).toContain("if (pauseState.mode === 'settings') return pauseSettingsControlContext()")
    expect(pollGamepad).toContain('const context = resolveGameplayControlContext()')
    expect(pollGamepad).not.toContain("? 'stage-select'")
    expect(pollGamepad).not.toContain(": 'stage-select'")
  })

  it('requires neutral gameplay input before resuming after AVG finishes', () => {
    const releaseGateIndex = source.indexOf('renderer.requireGameplayInputRelease()')
    const resumeIndex = source.indexOf('renderer.resume()', releaseGateIndex)

    expect(releaseGateIndex).toBeGreaterThan(-1)
    expect(resumeIndex).toBeGreaterThan(releaseGateIndex)
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
    expect(source).not.toContain('stageIntroSequence && avgPlayback && isAvgPlaybackActive(avgPlayback)')
    expect(source).not.toContain('sequence={stageIntroSequence}')
    expect(source).toContain('!isAvgPlaybackActive(avgPlayback)')
    expect(source).toMatch(/virtualControlsState\.visible && isGameplayPlayable\(\) && !isAvgPlaybackActive\(avgPlayback\)/)
  })
})
