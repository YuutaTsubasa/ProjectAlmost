import { describe, expect, it } from 'vitest'
import { worlds } from './worldCatalog'

describe('worlds', () => {
  it('orders the six campaign worlds by world number', () => {
    expect(worlds.order).toEqual(['world01', 'world02', 'world03', 'world04', 'world05', 'world06'])
  })

  it('indexes every world item by its stable id', () => {
    for (const worldId of worlds.order) {
      expect(worlds.items[worldId].id).toBe(worldId)
    }
  })

  it('keeps each world to six stage ids matching its world number', () => {
    for (const worldId of worlds.order) {
      const world = worlds.items[worldId]
      const prefix = `${world.number}-`

      expect(world.stageCount).toBe(6)
      expect(world.stageIds).toHaveLength(6)
      expect(world.stageIds).toEqual([
        `${prefix}1`,
        `${prefix}2`,
        `${prefix}3`,
        `${prefix}4`,
        `${prefix}5`,
        `${prefix}6`,
      ])
    }
  })

  it('stores localization refs instead of embedded display strings', () => {
    expect(worlds.items.world01.titleRef).toBe('worlds.world01.title')
    expect(worlds.items.world01.subtitleRef).toBe('worlds.world01.subtitle')
    expect(worlds.items.world06.titleRef).toBe('worlds.world06.title')
    expect(worlds.items.world06.subtitleRef).toBe('worlds.world06.subtitle')
  })

  it('stores stable theme, symbol, asset, and music references', () => {
    expect(worlds.items.world01).toMatchObject({
      number: 1,
      theme: 'palace',
      symbol: '♜',
      assetRefs: {
        stageSelectBackground: '/assets/maps/white_palace_stage_select.webp',
      },
      musicRefs: {
        map: '/assets/audio/world01_map.mp3',
        bgm: '/assets/audio/world01_bgm.mp3',
        boss: '/assets/audio/world01_boss.mp3',
      },
    })

    expect(worlds.items.world06).toMatchObject({
      number: 6,
      theme: 'abyss',
      symbol: '✦',
      assetRefs: {
        stageSelectBackground: '/assets/maps/abyssal_hollow_stage_select.webp',
      },
      musicRefs: {
        map: '/assets/audio/world06_map.mp3',
        bgm: '/assets/audio/world06_bgm.mp3',
        boss: '/assets/audio/world06_boss.mp3',
      },
    })
  })
})
