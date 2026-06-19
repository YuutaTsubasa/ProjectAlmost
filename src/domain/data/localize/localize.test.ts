import { describe, expect, it } from 'vitest'
import {
  localize,
  resolveLocalizedText,
  type LocalizedTextCatalog,
  type LocalizationKey,
} from './localize'

describe('localize', () => {
  it('declares the supported locales in deterministic order', () => {
    expect(localize.languages.map((language) => language.code)).toEqual(['en', 'ja', 'zhHant', 'ko'])
  })

  it('groups world title and subtitle localization references', () => {
    expect(localize.references.worlds.world01).toEqual({
      title: 'worlds.world01.title',
      subtitle: 'worlds.world01.subtitle',
    })
  })

  it('includes localized title and subtitle values for every supported locale', () => {
    expect(resolveLocalizedText(localize, 'en', 'worlds.world01.title')).toBe('White Palace')
    expect(resolveLocalizedText(localize, 'ja', 'worlds.world01.title')).toBe('白亜の宮殿')
    expect(resolveLocalizedText(localize, 'zhHant', 'worlds.world01.title')).toBe('白色宮殿')
    expect(resolveLocalizedText(localize, 'ko', 'worlds.world01.title')).toBe('하얀 궁전')

    expect(resolveLocalizedText(localize, 'en', 'worlds.world06.subtitle')).toBe(
      'The final descent into the demonic abyss.',
    )
    expect(resolveLocalizedText(localize, 'ja', 'worlds.world06.subtitle')).toBe('魔の深淵へと続く最後の降下。')
    expect(resolveLocalizedText(localize, 'zhHant', 'worlds.world06.subtitle')).toBe('通往惡魔深淵的最終下降。')
    expect(resolveLocalizedText(localize, 'ko', 'worlds.world06.subtitle')).toBe('악마의 심연으로 향하는 마지막 하강.')
  })
})

describe('resolveLocalizedText', () => {
  it('falls back to English when the requested locale is missing a key', () => {
    const catalog: LocalizedTextCatalog = {
      en: { 'worlds.world01.title': 'White Palace' },
      ja: {},
      zhHant: {},
      ko: {},
    }

    expect(resolveLocalizedText({ ...localize, catalog }, 'ja', 'worlds.world01.title')).toBe('White Palace')
  })

  it('returns the key itself when the key is missing from English too', () => {
    const missingKey = 'worlds.world99.title' as LocalizationKey

    expect(resolveLocalizedText(localize, 'zhHant', missingKey)).toBe('worlds.world99.title')
  })
})
