import { describe, expect, it } from 'vitest'
import source from './AvgOverlay.svelte?raw'

describe('AvgOverlay UI', () => {
  it('is presentation-only and receives AVG data through props', () => {
    expect(source).toContain('playback:')
    expect(source).toContain('localizeData:')
    expect(source).toContain('locale:')
    expect(source).toContain('onAdvance:')
    expect(source).toContain('onSkip:')
    expect(source).toContain('getActiveAvgLineView')
    expect(source).not.toContain('createGameplayRenderer')
    expect(source).not.toContain('createBrowserAssetPreloader')
    expect(source).not.toContain('localStorage')
    expect(source).not.toContain('appState')
    expect(source).not.toContain('window.dispatchEvent')
  })

  it('derives sequence data and accessible label from playback state', () => {
    expect(source).not.toContain('sequence:')
    expect(source).not.toContain('let { sequence,')
    expect(source).toContain('const sequence = $derived(playback.sequence)')
    expect(source).toContain('aria-label={text(activeLine.speaker.nameKey)}')
    expect(source).not.toContain("aria-label={text('avg.speaker.whitePriestess')}")
  })

  it('renders the approved AVG overlay visual structure', () => {
    expect(source).toContain('avg-overlay')
    expect(source).toContain('avg-veil')
    expect(source).toContain('avg-advance')
    expect(source).toContain('avg-character')
    expect(source).toContain('avg-skip')
    expect(source).toContain('avg-name')
    expect(source).toContain('avg-dialogue')
    expect(source).toContain('avg-progress')
    expect(source).toContain('avg-next')
  })
})
