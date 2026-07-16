import { describe, expect, it } from 'vitest'
import stageSelectSource from './StageSelectScreen.svelte?raw'

describe('StageSelectScreen character info contract', () => {
  it('renders active character identity from selected character info props', () => {
    expect(stageSelectSource).toContain('characterInfo.stageSelect.portraitAssetRef')
    expect(stageSelectSource).toContain('characterInfo.stageSelect.portraitAlt')
    expect(stageSelectSource).toContain('characterInfo.stageSelect.name')
    expect(stageSelectSource).not.toContain("const activeCharacterName = 'Yuuta Tsubasa'")
  })
})
