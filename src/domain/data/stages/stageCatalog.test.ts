import { afterEach, describe, expect, it, vi } from 'vitest'
import { localize, resolveLocalizedText } from '../localize/localize'
import { worlds } from '../worlds/worldCatalog'
import { stages } from './stageCatalog'

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('../worlds/worldCatalog')
})

describe('stages', () => {
  it('orders all 36 campaign stages by world and stage number', () => {
    const orderedStageIds = worlds.order.flatMap((worldId) => worlds.items[worldId].stageIds)

    expect(stages.order).toHaveLength(36)
    expect(stages.order).toEqual(orderedStageIds)
  })

  it('derives ordered stages from the world catalog order', async () => {
    const reversedWorlds = {
      ...worlds,
      order: [...worlds.order].reverse(),
    }

    await import('./stageCatalog')
    vi.resetModules()

    vi.doMock('../worlds/worldCatalog', () => ({
      worlds: reversedWorlds,
    }))

    try {
      const { stages: stagesFromWorldCatalog } = await import('./stageCatalog')

      expect(stagesFromWorldCatalog.order).toEqual(
        reversedWorlds.order.flatMap((worldId) => reversedWorlds.items[worldId].stageIds),
      )
    } finally {
      vi.doUnmock('../worlds/worldCatalog')
      vi.resetModules()
    }
  })

  it('indexes every stage by stable id with UI-ready metadata', () => {
    expect(stages.items['1-1']).toEqual({
      id: '1-1',
      worldId: 'world01',
      number: 1,
      titleRef: 'stages.1-1.title',
      subtitleRef: 'stages.1-1.subtitle',
      objectiveRef: 'stageObjectives.reachGoal',
      collectibleCount: 24,
      nodePosition: { x: 34, y: 82 },
      previewAssetRef: '/assets/maps/white_palace_mid_bg_loop.webp',
      previewBackgroundAssetRef: '/assets/maps/white_palace_sky.webp',
      isBoss: false,
    })
    expect(stages.items['1-6']).toMatchObject({
      id: '1-6',
      worldId: 'world01',
      number: 6,
      nodePosition: { x: 71, y: 26 },
      objectiveRef: 'stageObjectives.defeatBoss',
      isBoss: true,
    })
    expect(stages.items['1-4']).toMatchObject({
      id: '1-4',
      nodePosition: { x: 53, y: 51 },
    })
    expect(stages.items['1-5']).toMatchObject({
      id: '1-5',
      nodePosition: { x: 37, y: 41 },
    })
    expect(stages.items['6-6']).toMatchObject({
      id: '6-6',
      worldId: 'world06',
      number: 6,
      objectiveRef: 'stageObjectives.defeatBoss',
      isBoss: true,
    })
  })

  it('keeps world stage ids backed by the stage catalog', () => {
    for (const worldId of worlds.order) {
      const world = worlds.items[worldId]
      expect(world.stageIds.map((stageId) => stages.items[stageId]?.worldId)).toEqual(
        world.stageIds.map(() => worldId),
      )
    }
  })

  it('keeps node positions inside the map percentage coordinate space', () => {
    for (const stageId of stages.order) {
      const { nodePosition } = stages.items[stageId]
      expect(nodePosition.x).toBeGreaterThanOrEqual(0)
      expect(nodePosition.x).toBeLessThanOrEqual(100)
      expect(nodePosition.y).toBeGreaterThanOrEqual(0)
      expect(nodePosition.y).toBeLessThanOrEqual(100)
    }
  })

  it('uses localization refs that resolve for every supported locale', () => {
    for (const locale of localize.languages.map((language) => language.code)) {
      expect(resolveLocalizedText(localize, locale, 'stageSelect.title')).toBeTruthy()
      expect(resolveLocalizedText(localize, locale, 'stageSelect.deploy')).toBeTruthy()
      expect(resolveLocalizedText(localize, locale, 'stageObjectives.reachGoal')).toBeTruthy()
      expect(resolveLocalizedText(localize, locale, 'stageObjectives.defeatBoss')).toBeTruthy()

      for (const stageId of stages.order) {
        const stage = stages.items[stageId]
        expect(resolveLocalizedText(localize, locale, stage.titleRef)).toBeTruthy()
        expect(resolveLocalizedText(localize, locale, stage.subtitleRef)).toBeTruthy()
        expect(resolveLocalizedText(localize, locale, stage.objectiveRef)).toBeTruthy()
      }
    }
  })
})
