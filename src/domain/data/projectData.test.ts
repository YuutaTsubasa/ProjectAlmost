import { describe, expect, it } from 'vitest'
import { localize } from './localize/localize'
import { projectData } from './projectData'
import { worlds } from './worlds/worldCatalog'

describe('projectData', () => {
  it('exposes exactly the current project data categories', () => {
    expect(Object.keys(projectData).sort()).toEqual(['localize', 'worlds'])
  })

  it('uses the localization category as the project localization source', () => {
    expect(projectData.localize).toBe(localize)
  })

  it('uses the world catalog as the project worlds source', () => {
    expect(projectData.worlds).toBe(worlds)
  })
})
