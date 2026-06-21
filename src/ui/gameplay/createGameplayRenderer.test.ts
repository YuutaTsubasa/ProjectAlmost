import { describe, expect, it, vi } from 'vitest'
import { getGameplayStageMap } from '../../domain/gameplay/gameplayStageMaps'
import { createGameplayRendererConfig } from './createGameplayRenderer'

vi.mock('phaser', () => {
  class Scene {
    constructor(public readonly key?: string) {}
  }

  return {
    default: {
      AUTO: 'AUTO',
      Scale: {
        FIT: 'FIT',
        CENTER_BOTH: 'CENTER_BOTH',
      },
      Scene,
      Game: class Game {
        constructor(public readonly config: unknown) {}
      },
    },
  }
})

describe('createGameplayRendererConfig', () => {
  it('creates a Phaser config for the provided parent and stage map', () => {
    const stage = getGameplayStageMap('1-1')

    expect(stage).toBeDefined()
    if (!stage) return

    const parent = {} as HTMLElement
    const config = createGameplayRendererConfig({ parent, stage })

    expect(config.parent).toBe(parent)
    expect(config.width).toBe(1280)
    expect(config.height).toBe(720)
    expect(config.backgroundColor).toBe('#05070d')
    expect(config.scene).toHaveLength(1)
  })
})
