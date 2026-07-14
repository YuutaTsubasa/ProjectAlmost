import { describe, expect, it } from 'vitest'
import { projectData } from '../../domain/data/projectData'
import { resolveShellBackdrop } from './shellBackdrop'

describe('shell backdrop resolver', () => {
  it('uses the selected world background on world select', () => {
    expect(resolveShellBackdrop({
      screen: { type: 'world-select', selectedWorldIndex: 1 },
      worlds: projectData.worlds,
      stages: projectData.stages,
    })).toEqual({
      assetRef: '/assets/maps/emerald_sanctuary_stage_select.webp',
      theme: 'forest',
    })
  })

  it('uses the selected world background on stage select', () => {
    expect(resolveShellBackdrop({
      screen: { type: 'stage-select', selectedWorldIndex: 4, worldId: 'world05', selectedStageIndex: 0 },
      worlds: projectData.worlds,
      stages: projectData.stages,
    })).toEqual({
      assetRef: '/assets/maps/emberfall_caldera_stage_select.webp',
      theme: 'volcano',
    })
  })

  it('uses the gameplay stage world background', () => {
    expect(resolveShellBackdrop({
      screen: { type: 'gameplay', stageId: '6-3', runId: 0 },
      worlds: projectData.worlds,
      stages: projectData.stages,
    })).toEqual({
      assetRef: '/assets/maps/abyssal_hollow_stage_select.webp',
      theme: 'abyss',
    })
  })

  it('preserves the previous backdrop while settings are open', () => {
    expect(resolveShellBackdrop({
      screen: { type: 'settings', selectedItemIndex: 0, deleteConfirm: null },
      worlds: projectData.worlds,
      stages: projectData.stages,
      previous: {
        assetRef: '/assets/maps/frostveil_peaks_stage_select.webp',
        theme: 'snow',
      },
    })).toEqual({
      assetRef: '/assets/maps/frostveil_peaks_stage_select.webp',
      theme: 'snow',
    })
  })

  it('falls back to world 01 for title and missing context', () => {
    expect(resolveShellBackdrop({
      screen: { type: 'title-menu', selectedItemIndex: 0 },
      worlds: projectData.worlds,
      stages: projectData.stages,
    })).toEqual({
      assetRef: '/assets/maps/white_palace_stage_select.webp',
      theme: 'palace',
    })
  })
})
