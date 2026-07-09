import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = readFileSync('src/ui/gameplay/GameplayScreen.svelte', 'utf8')

describe('GameplayScreen stage clear callback wiring', () => {
  it('declares a stage clear callback prop', () => {
    expect(source).toContain('onStageClear: (result: StageClearResult) => void')
    expect(source).toContain('onStageClear,')
  })

  it('emits the clear result once per mounted gameplay run', () => {
    expect(source).toContain('let stageClearRecorded = $state(false)')
    expect(source).toContain('if (!hudState?.result || stageClearRecorded) return')
    expect(source).toContain('stageClearRecorded = true')
    expect(source).toContain('onStageClear({')
    expect(source).toContain('time: hudState.result.time')
    expect(source).toContain('rank: hudState.result.rank')
    expect(source).toContain('coins: hudState.result.coins')
  })
})
