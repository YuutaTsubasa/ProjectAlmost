import { describe, expect, it } from 'vitest'
import { localize } from './localize/localize'
import { projectData } from './projectData'
import { stages } from './stages/stageCatalog'
import { worlds } from './worlds/worldCatalog'

describe('projectData', () => {
  it('exposes exactly the current project data categories', () => {
    expect(Object.keys(projectData).sort()).toEqual(['localize', 'stages', 'worlds'])
  })

  it('uses the localization category as the project localization source', () => {
    expect(projectData.localize).toBe(localize)
  })

  it('uses the world catalog as the project worlds source', () => {
    expect(projectData.worlds).toBe(worlds)
  })

  it('uses the stage catalog as the project stages source', () => {
    expect(projectData.stages).toBe(stages)
  })

  it('backs every world stage id with matching stage project data', () => {
    for (const worldId of projectData.worlds.order) {
      const world = projectData.worlds.items[worldId]

      for (const stageId of world.stageIds) {
        expect(projectData.stages.items[stageId]).toBeDefined()
        expect(projectData.stages.items[stageId].worldId).toBe(worldId)
      }
    }
  })
})
