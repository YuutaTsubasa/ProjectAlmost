import { describe, expect, it } from 'vitest'
import source from './LoadingScreen.svelte?raw'

describe('LoadingScreen UI', () => {
  it('is presentation-only and renders progress inputs', () => {
    expect(source).toContain('progress:')
    expect(source).toContain('phaseLabel:')
    expect(source).toContain('productName:')
    expect(source).toContain('warningLabel:')
    expect(source).toContain('aria-valuenow={progress.percent}')
    expect(source).not.toContain('appState')
    expect(source).not.toContain('onControlIntent')
    expect(source).not.toContain('createBrowserAssetPreloader')
  })
})
