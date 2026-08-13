import { describe, expect, it } from 'vitest'
import { stages } from '../../domain/data/stages/stageCatalog'
import { worlds } from '../../domain/data/worlds/worldCatalog'
import type { StageId } from '../../domain/data/worlds/worldTypes'
import type { StageProgressionOptionState, StageRecord } from '../../domain/progression/stageProgression'
import {
  projectStageSelectInfo,
  projectWorldSelectInfo,
} from './selectInfoPresenter'

const record: StageRecord = {
  cleared: true,
  bestTimeMs: 12_340,
  bestTime: '00:12.34',
  bestRank: 'A',
  maxCoins: 5,
}

function option(
  stageId: StageId,
  overrides: Partial<StageProgressionOptionState<StageId>> = {},
): StageProgressionOptionState<StageId> {
  return {
    stageId,
    unlocked: false,
    cleared: false,
    record: undefined,
    ...overrides,
  }
}

describe('world select info presenter', () => {
  it('counts cleared progress per world from that world stage ids only', () => {
    const info = projectWorldSelectInfo(worlds, [
      option('1-1', { unlocked: true, cleared: true, record }),
      option('1-2', { unlocked: true, cleared: true, record }),
      option('2-1', { unlocked: true, cleared: true, record }),
    ])

    expect(info.worlds.find((world) => world.world.id === 'world01')).toMatchObject({
      clearedStageCount: 2,
      stageCount: 6,
      progressPercent: (2 / 6) * 100,
    })
    expect(info.worlds.find((world) => world.world.id === 'world02')).toMatchObject({
      clearedStageCount: 1,
      stageCount: 6,
      progressPercent: (1 / 6) * 100,
    })
  })

  it('treats missing progression as uncleared chapter progress', () => {
    const info = projectWorldSelectInfo(worlds, [
      option('3-1', { unlocked: true, cleared: true, record }),
    ])

    expect(info.worlds.find((world) => world.world.id === 'world01')).toMatchObject({
      clearedStageCount: 0,
      stageCount: 6,
      progressPercent: 0,
    })
    expect(info.worlds.find((world) => world.world.id === 'world03')).toMatchObject({
      clearedStageCount: 1,
      stageCount: 6,
      progressPercent: (1 / 6) * 100,
    })
  })
})

describe('stage select info presenter', () => {
  it('projects selected world stages with progression state and records', () => {
    const info = projectStageSelectInfo(worlds, stages, 'world02', [
      option('2-1', { unlocked: true, cleared: true, record }),
      option('2-2', { unlocked: true }),
    ])

    expect(info.world.id).toBe('world02')
    expect(info.stages.map((stage) => stage.stage.id)).toEqual(['2-1', '2-2', '2-3', '2-4', '2-5', '2-6'])
    expect(info.stages[0]).toMatchObject({
      unlocked: true,
      cleared: true,
      record,
    })
    expect(info.stages[1]).toMatchObject({
      unlocked: true,
      cleared: false,
      record: undefined,
    })
  })

  it('treats missing stage progression entries as locked and recordless', () => {
    const info = projectStageSelectInfo(worlds, stages, 'world01', [
      option('1-1', { unlocked: true }),
    ])

    expect(info.stages[0]).toMatchObject({ unlocked: true, cleared: false, record: undefined })
    expect(info.stages[1]).toMatchObject({ unlocked: false, cleared: false, record: undefined })
  })
})
