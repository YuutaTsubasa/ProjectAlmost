export type ControlIntent = 'open' | 'move-up' | 'move-down' | 'confirm' | 'back'

export type ControlContext = 'title-intro' | 'title-menu'

export type KeyboardControlDescriptor = {
  key: string
  repeat: boolean
}

export function mapKeyboardControlIntent(
  descriptor: KeyboardControlDescriptor,
  context: ControlContext,
): ControlIntent | null {
  if (descriptor.repeat) return null
  if (context === 'title-intro') return 'open'

  const key = descriptor.key.toLowerCase()

  if (descriptor.key === 'ArrowUp' || key === 'w') return 'move-up'
  if (descriptor.key === 'ArrowDown' || key === 's') return 'move-down'
  if (descriptor.key === 'Enter' || descriptor.key === ' ') return 'confirm'
  if (descriptor.key === 'Escape') return 'back'

  return null
}
