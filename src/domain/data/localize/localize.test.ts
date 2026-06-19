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
    const expectedByLocale = {
      en: {
        world01: {
          title: 'White Palace',
          subtitle: 'A radiant kingdom above the clouds.',
        },
        world02: {
          title: 'Emerald Sanctuary',
          subtitle: 'Ancient ruins reclaimed by the living forest.',
        },
        world03: {
          title: 'Cerulean Depths',
          subtitle: 'A drowned realm beneath the endless tide.',
        },
        world04: {
          title: 'Frostveil Peaks',
          subtitle: 'Frozen fortresses beyond the mountain storm.',
        },
        world05: {
          title: 'Emberfall Caldera',
          subtitle: 'A shattered forge at the heart of the volcano.',
        },
        world06: {
          title: 'Abyssal Hollow',
          subtitle: 'The final descent into the demonic abyss.',
        },
      },
      ja: {
        world01: {
          title: 'ホワイトパレス',
          subtitle: '雲海に輝く天空の王国。',
        },
        world02: {
          title: 'エメラルド・サンクチュアリ',
          subtitle: '生命の森に覆われた古代遺跡。',
        },
        world03: {
          title: 'セルリアン・デプス',
          subtitle: '果てなき潮の底に沈む王国。',
        },
        world04: {
          title: 'フロストヴェイル・ピークス',
          subtitle: '吹雪の彼方にそびえる氷の要塞。',
        },
        world05: {
          title: 'エンバーフォール・カルデラ',
          subtitle: '火山の中心に眠る崩壊した炉。',
        },
        world06: {
          title: 'アビサル・ホロウ',
          subtitle: '悪魔の深淵へ続く最後の降下。',
        },
      },
      zhHant: {
        world01: {
          title: '白色宮殿',
          subtitle: '高踞雲海之上的光輝王國。',
        },
        world02: {
          title: '翡翠聖林',
          subtitle: '被生命森林重新覆蓋的古老遺跡。',
        },
        world03: {
          title: '蔚藍深海',
          subtitle: '沉沒於無盡潮汐之下的國度。',
        },
        world04: {
          title: '霜幕群峰',
          subtitle: '暴風雪彼端的冰封要塞。',
        },
        world05: {
          title: '燼落火山',
          subtitle: '位於火山核心的破碎鍛造場。',
        },
        world06: {
          title: '深淵魔窟',
          subtitle: '通往惡魔深淵的最後の降途。',
        },
      },
      ko: {
        world01: {
          title: '화이트 팰리스',
          subtitle: '구름 위에서 빛나는 하늘의 왕국.',
        },
        world02: {
          title: '에메랄드 생추어리',
          subtitle: '살아 있는 숲이 되찾은 고대 유적.',
        },
        world03: {
          title: '세룰리안 심해',
          subtitle: '끝없는 조류 아래 가라앉은 왕국.',
        },
        world04: {
          title: '프로스트베일 봉우리',
          subtitle: '눈보라 너머의 얼어붙은 요새.',
        },
        world05: {
          title: '엠버폴 칼데라',
          subtitle: '화산 중심부에 부서진 대장간.',
        },
        world06: {
          title: '어비설 할로우',
          subtitle: '악마의 심연으로 향하는 마지막 하강.',
        },
      },
    }

    const locales = ['en', 'ja', 'zhHant', 'ko'] as const
    const worldIds = ['world01', 'world02', 'world03', 'world04', 'world05', 'world06'] as const

    for (const locale of locales) {
      for (const worldId of worldIds) {
        expect(resolveLocalizedText(localize, locale, `worlds.${worldId}.title`)).toBe(
          expectedByLocale[locale][worldId].title,
        )
        expect(resolveLocalizedText(localize, locale, `worlds.${worldId}.subtitle`)).toBe(
          expectedByLocale[locale][worldId].subtitle,
        )
      }
    }
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
