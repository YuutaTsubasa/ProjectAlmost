export type LocaleCode = 'en' | 'ja' | 'zhHant' | 'ko'

export type LocalizationKey = `worlds.world0${1 | 2 | 3 | 4 | 5 | 6}.${'title' | 'subtitle'}`

export interface LocaleRecord {
  code: LocaleCode
  label: string
}

export type LocalizedTextCatalog = Record<LocaleCode, Partial<Record<LocalizationKey, string>>>

export interface WorldLocalizationReferences {
  title: LocalizationKey
  subtitle: LocalizationKey
}

export type WorldLocalizationReferenceGroup = Record<
  `world0${1 | 2 | 3 | 4 | 5 | 6}`,
  WorldLocalizationReferences
>

export interface LocalizeData {
  languages: readonly LocaleRecord[]
  references: {
    worlds: WorldLocalizationReferenceGroup
  }
  catalog: LocalizedTextCatalog
}

const worlds: WorldLocalizationReferenceGroup = {
  world01: {
    title: 'worlds.world01.title',
    subtitle: 'worlds.world01.subtitle',
  },
  world02: {
    title: 'worlds.world02.title',
    subtitle: 'worlds.world02.subtitle',
  },
  world03: {
    title: 'worlds.world03.title',
    subtitle: 'worlds.world03.subtitle',
  },
  world04: {
    title: 'worlds.world04.title',
    subtitle: 'worlds.world04.subtitle',
  },
  world05: {
    title: 'worlds.world05.title',
    subtitle: 'worlds.world05.subtitle',
  },
  world06: {
    title: 'worlds.world06.title',
    subtitle: 'worlds.world06.subtitle',
  },
}

const catalog: LocalizedTextCatalog = {
  en: {
    'worlds.world01.title': 'White Palace',
    'worlds.world01.subtitle': 'A radiant kingdom above the clouds.',
    'worlds.world02.title': 'Emerald Sanctuary',
    'worlds.world02.subtitle': 'Ancient ruins reclaimed by the living forest.',
    'worlds.world03.title': 'Cerulean Depths',
    'worlds.world03.subtitle': 'A drowned realm beneath the endless tide.',
    'worlds.world04.title': 'Frostveil Peaks',
    'worlds.world04.subtitle': 'Frozen fortresses beyond the mountain storm.',
    'worlds.world05.title': 'Emberfall Caldera',
    'worlds.world05.subtitle': 'A shattered forge at the heart of the volcano.',
    'worlds.world06.title': 'Abyssal Hollow',
    'worlds.world06.subtitle': 'The final descent into the demonic abyss.',
  },
  ja: {
    'worlds.world01.title': 'ホワイトパレス',
    'worlds.world01.subtitle': '雲海に輝く天空の王国。',
    'worlds.world02.title': 'エメラルド・サンクチュアリ',
    'worlds.world02.subtitle': '生命の森に覆われた古代遺跡。',
    'worlds.world03.title': 'セルリアン・デプス',
    'worlds.world03.subtitle': '果てなき潮の底に沈む王国。',
    'worlds.world04.title': 'フロストヴェイル・ピークス',
    'worlds.world04.subtitle': '吹雪の彼方にそびえる氷の要塞。',
    'worlds.world05.title': 'エンバーフォール・カルデラ',
    'worlds.world05.subtitle': '火山の中心に眠る崩壊した炉。',
    'worlds.world06.title': 'アビサル・ホロウ',
    'worlds.world06.subtitle': '悪魔の深淵へ続く最後の降下。',
  },
  zhHant: {
    'worlds.world01.title': '白色宮殿',
    'worlds.world01.subtitle': '高踞雲海之上的光輝王國。',
    'worlds.world02.title': '翡翠聖林',
    'worlds.world02.subtitle': '被生命森林重新覆蓋的古老遺跡。',
    'worlds.world03.title': '蔚藍深海',
    'worlds.world03.subtitle': '沉沒於無盡潮汐之下的國度。',
    'worlds.world04.title': '霜幕群峰',
    'worlds.world04.subtitle': '暴風雪彼端的冰封要塞。',
    'worlds.world05.title': '燼落火山',
    'worlds.world05.subtitle': '位於火山核心的破碎鍛造場。',
    'worlds.world06.title': '深淵魔窟',
    'worlds.world06.subtitle': '通往惡魔深淵的最終降途。',
  },
  ko: {
    'worlds.world01.title': '화이트 팰리스',
    'worlds.world01.subtitle': '구름 위에서 빛나는 하늘의 왕국.',
    'worlds.world02.title': '에메랄드 생추어리',
    'worlds.world02.subtitle': '살아 있는 숲이 되찾은 고대 유적.',
    'worlds.world03.title': '세룰리안 심해',
    'worlds.world03.subtitle': '끝없는 조류 아래 가라앉은 왕국.',
    'worlds.world04.title': '프로스트베일 봉우리',
    'worlds.world04.subtitle': '눈보라 너머의 얼어붙은 요새.',
    'worlds.world05.title': '엠버폴 칼데라',
    'worlds.world05.subtitle': '화산 중심부에 부서진 대장간.',
    'worlds.world06.title': '어비설 할로우',
    'worlds.world06.subtitle': '악마의 심연으로 향하는 마지막 하강.',
  },
}

export const localize: LocalizeData = {
  languages: [
    { code: 'en', label: 'English' },
    { code: 'ja', label: '日本語' },
    { code: 'zhHant', label: '繁體中文' },
    { code: 'ko', label: '한국어' },
  ],
  references: {
    worlds,
  },
  catalog,
}

export function resolveLocalizedText(
  localizeData: LocalizeData,
  locale: LocaleCode,
  key: LocalizationKey,
): string {
  return localizeData.catalog[locale][key] ?? localizeData.catalog.en[key] ?? key
}
