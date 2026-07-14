import { describe, expect, it } from 'vitest'
import type { AppScreen } from '../../domain/app/appFlow'
import {
  canStartSceneTransition,
  getSceneTransitionTiming,
  initialSceneTransitionState,
  resolveSceneTransitionStyle,
  shouldBlockSceneTransitionReentry,
  type SceneTransitionState,
} from './sceneTransitionPolicy'

const titleMenu: AppScreen = { type: 'title-menu', selectedItemIndex: 0 }
const worldSelect: AppScreen = { type: 'world-select', selectedWorldIndex: 0 }
const stageSelect: AppScreen = {
  type: 'stage-select',
  selectedWorldIndex: 0,
  worldId: 'world01',
  selectedStageIndex: 0,
}
const gameplay: AppScreen = { type: 'gameplay', stageId: '1-1', runId: 0 }
const settings: AppScreen = { type: 'settings', selectedItemIndex: 0, deleteConfirm: null }

describe('scene transition policy', () => {
  it('maps world and stage select navigation to directional world-stage styles', () => {
    expect(resolveSceneTransitionStyle(worldSelect, stageSelect)).toBe('world-stage-forward')
    expect(resolveSceneTransitionStyle(stageSelect, worldSelect)).toBe('world-stage-back')
  })

  it('maps navigation into gameplay to the gameplay transition style', () => {
    expect(resolveSceneTransitionStyle(stageSelect, gameplay)).toBe('gameplay')
    expect(resolveSceneTransitionStyle(gameplay, { ...gameplay, runId: 1 })).toBe('gameplay')
  })

  it('uses page transitions for other screen replacements', () => {
    expect(resolveSceneTransitionStyle(titleMenu, worldSelect)).toBe('page')
    expect(resolveSceneTransitionStyle(settings, titleMenu)).toBe('page')
    expect(resolveSceneTransitionStyle(gameplay, stageSelect)).toBe('page')
  })

  it('does not transition same-screen selection changes', () => {
    expect(resolveSceneTransitionStyle(worldSelect, { type: 'world-select', selectedWorldIndex: 1 })).toBeNull()
    expect(resolveSceneTransitionStyle(stageSelect, {
      type: 'stage-select',
      selectedWorldIndex: 0,
      worldId: 'world01',
      selectedStageIndex: 1,
    })).toBeNull()
  })

  it('exposes prototype-aligned timing values per style', () => {
    expect(getSceneTransitionTiming('page')).toEqual({
      coverMs: 260,
      holdMs: 140,
      revealMs: 620,
    })
    expect(getSceneTransitionTiming('world-stage-forward')).toEqual({
      coverMs: 300,
      holdMs: 140,
      revealMs: 540,
    })
    expect(getSceneTransitionTiming('world-stage-back')).toEqual({
      coverMs: 300,
      holdMs: 140,
      revealMs: 540,
    })
    expect(getSceneTransitionTiming('gameplay')).toEqual({
      coverMs: 260,
      holdMs: 420,
      revealMs: 620,
    })
  })

  it('allows transitions only while idle', () => {
    const idle: SceneTransitionState = { phase: 'idle', style: 'page' }
    const covering: SceneTransitionState = { phase: 'cover', style: 'page' }
    const revealing: SceneTransitionState = { phase: 'reveal', style: 'page' }

    expect(canStartSceneTransition(idle)).toBe(true)
    expect(canStartSceneTransition(covering)).toBe(false)
    expect(canStartSceneTransition(revealing)).toBe(false)
  })

  it('blocks styled screen replacements while another scene transition is active', () => {
    const covering: SceneTransitionState = { phase: 'cover', style: 'page' }
    const revealing: SceneTransitionState = { phase: 'reveal', style: 'gameplay' }

    expect(shouldBlockSceneTransitionReentry('page', covering)).toBe(true)
    expect(shouldBlockSceneTransitionReentry('gameplay', revealing)).toBe(true)
    expect(shouldBlockSceneTransitionReentry('page', initialSceneTransitionState)).toBe(false)
  })

  it('keeps null-style same-screen changes immediate even during an active transition', () => {
    const covering: SceneTransitionState = { phase: 'cover', style: 'page' }

    expect(shouldBlockSceneTransitionReentry(null, covering)).toBe(false)
    expect(resolveSceneTransitionStyle(worldSelect, {
      type: 'world-select',
      selectedWorldIndex: 1,
    })).toBeNull()
  })
})
