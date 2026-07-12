import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { SFX_ASSETS } from './audioAssets'

const publicRoot = fileURLToPath(new URL('../../../public', import.meta.url))

describe('public audio assets', () => {
  it('contains every declared sfx asset', () => {
    for (const assetPath of Object.values(SFX_ASSETS)) {
      expect(existsSync(`${publicRoot}${assetPath}`), assetPath).toBe(true)
    }
  })
})
