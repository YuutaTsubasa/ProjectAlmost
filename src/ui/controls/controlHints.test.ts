import { describe, expect, it } from 'vitest'
import settingsSource from '../settings/SettingsScreen.svelte?raw'
import stageSelectSource from '../stage/StageSelectScreen.svelte?raw'
import titleSource from '../title/TitleScreen.svelte?raw'
import worldSelectSource from '../world/WorldSelectScreen.svelte?raw'

const screenSources = [
  ['TitleScreen', titleSource],
  ['WorldSelectScreen', worldSelectSource],
  ['SettingsScreen', settingsSource],
  ['StageSelectScreen', stageSelectSource],
] as const

describe('ControlHints component contract', () => {
  it('centralizes menu control hint markup for input-device specific rendering later', async () => {
    const controlHintsSource = await import('./ControlHints.svelte?raw').then((module) => module.default)

    expect(controlHintsSource).toContain('export type ControlHint')
    expect(controlHintsSource).toContain('hints: readonly ControlHint[]')
    expect(controlHintsSource).toContain('<kbd>{key}</kbd>')
    expect(controlHintsSource).toContain('class={`control-hints ${className}`}')
  })

  it('uses shared control hints on all menu screens instead of inline keycap markup', () => {
    for (const [screenName, source] of screenSources) {
      expect(source, screenName).toContain("import ControlHints from '../controls/ControlHints.svelte'")
      expect(source, screenName).toContain('<ControlHints')
      expect(source, screenName).not.toContain('<kbd>')
    }
  })

  it('keeps World Select control labels localized through common references', () => {
    expect(worldSelectSource).toContain("text('common.select')")
    expect(worldSelectSource).toContain("text('common.confirm')")
    expect(worldSelectSource).toContain("text('common.back')")
    expect(worldSelectSource).not.toContain('Select</span>')
    expect(worldSelectSource).not.toContain('Confirm</span>')
    expect(worldSelectSource).not.toContain('Back</span>')
  })
})
