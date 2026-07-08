import { describe, expect, it } from 'vitest'
import settingsPanelSource from './SettingsPanel.svelte?raw'
import settingsScreenSource from './SettingsScreen.svelte?raw'

describe('SettingsPanel UI contract', () => {
  it('centralizes settings rows for title and pause overlays', () => {
    expect(settingsPanelSource).toContain('type Props = {')
    expect(settingsPanelSource).toContain('screen: SettingsScreen')
    expect(settingsPanelSource).toContain('settings: GameSettings')
    expect(settingsPanelSource).toContain('SETTINGS_ROWS')
    expect(settingsPanelSource).toContain('class="settings-panel"')
    expect(settingsPanelSource).toContain('<ControlHints')
  })

  it('keeps SettingsScreen as a routed shell around SettingsPanel', () => {
    expect(settingsScreenSource).toContain("import SettingsPanel from './SettingsPanel.svelte'")
    expect(settingsScreenSource).toContain('<SettingsPanel')
    expect(settingsScreenSource).toContain('class="settings-screen"')
    expect(settingsScreenSource).not.toContain('{#each SETTINGS_ROWS as item, index}')
  })
})
