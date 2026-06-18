export function canCrouch(input: {
  crouchHeld: boolean
  grounded: boolean
  attacking: boolean
  hurting: boolean
}): boolean {
  return input.crouchHeld && input.grounded && !input.attacking && !input.hurting
}
