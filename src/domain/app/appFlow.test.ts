import { describe, expect, it } from 'vitest'
import { createInitialAppState } from './appFlow'

describe('createInitialAppState', () => {
  it('boots the rebuild into the title screen', () => {
    expect(createInitialAppState()).toEqual({
      screen: { type: 'title' },
    })
  })
})
