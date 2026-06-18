import { describe, expect, test } from 'vitest'
import { canCrouch } from './crouchRules'

describe('canCrouch', () => {
  test('allows crouch only when input is held, grounded, and player is not attacking or hurting', () => {
    expect(canCrouch({
      crouchHeld: true,
      grounded: true,
      attacking: false,
      hurting: false,
    })).toBe(true)
  })

  test('requires crouch input to be held', () => {
    expect(canCrouch({
      crouchHeld: false,
      grounded: true,
      attacking: false,
      hurting: false,
    })).toBe(false)
  })

  test('requires player to be grounded', () => {
    expect(canCrouch({
      crouchHeld: true,
      grounded: false,
      attacking: false,
      hurting: false,
    })).toBe(false)
  })

  test('does not allow crouch while attacking', () => {
    expect(canCrouch({
      crouchHeld: true,
      grounded: true,
      attacking: true,
      hurting: false,
    })).toBe(false)
  })

  test('does not allow crouch while hurting', () => {
    expect(canCrouch({
      crouchHeld: true,
      grounded: true,
      attacking: false,
      hurting: true,
    })).toBe(false)
  })
})
