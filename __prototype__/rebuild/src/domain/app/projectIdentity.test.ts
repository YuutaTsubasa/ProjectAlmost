import { describe, expect, it } from 'vitest'
import { createProjectIdentity } from './projectIdentity'

describe('createProjectIdentity', () => {
  it('describes the rebuild as a Tauri v2 and Svelte app', () => {
    expect(createProjectIdentity()).toEqual({
      productName: 'Project Almost',
      shell: 'tauri-v2',
      ui: 'svelte',
      domainCore: 'functional',
      stateModel: 'reactive',
    })
  })
})
