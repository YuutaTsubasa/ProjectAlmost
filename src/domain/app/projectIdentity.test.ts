import { describe, expect, it } from 'vitest'
import { PRODUCT_NAME, STORAGE_NAMESPACE, storageKey } from './projectIdentity'

describe('project identity', () => {
  it('exposes the product name', () => {
    expect(PRODUCT_NAME).toBe('Project Almost')
  })

  it('builds namespaced storage keys', () => {
    expect(STORAGE_NAMESPACE).toBe('project-almost')
    expect(storageKey('save')).toBe('project-almost:save')
  })
})
