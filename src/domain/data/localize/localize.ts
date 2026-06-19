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
    'worlds.world01.title': '白亜の宮殿',
    'worlds.world01.subtitle': '雲の上に輝く王国。',
    'worlds.world02.title': '翠緑の聖域',
    'worlds.world02.subtitle': '生きた森に取り戻された古代遺跡。',
    'worlds.world03.title': '蒼き深淵',
    'worlds.world03.subtitle': '果てしない潮の下に沈んだ領域。',
    'worlds.world04.title': '霜覆う峰々',
    'worlds.world04.subtitle': '山嵐の彼方にある凍てついた砦。',
    'worlds.world05.title': '燠火のカルデラ',
    'worlds.world05.subtitle': '火山の中心にある砕けた炉。',
    'worlds.world06.title': '深淵の空洞',
    'worlds.world06.subtitle': '魔の深淵へと続く最後の降下。',
  },
  zhHant: {
    'worlds.world01.title': '白色宮殿',
    'worlds.world01.subtitle': '雲端之上的光輝王國。',
    'worlds.world02.title': '翠綠聖域',
    'worlds.world02.subtitle': '被活生生森林奪回的古代遺跡。',
    'worlds.world03.title': '蔚藍深淵',
    'worlds.world03.subtitle': '沉沒在無盡潮汐之下的領域。',
    'worlds.world04.title': '霜幕群峰',
    'worlds.world04.subtitle': '山嵐彼端的冰封堡壘。',
    'worlds.world05.title': '燼落火山口',
    'worlds.world05.subtitle': '火山核心中破碎的熔爐。',
    'worlds.world06.title': '深淵空洞',
    'worlds.world06.subtitle': '通往惡魔深淵的最終下降。',
  },
  ko: {
    'worlds.world01.title': '하얀 궁전',
    'worlds.world01.subtitle': '구름 위에서 빛나는 왕국.',
    'worlds.world02.title': '에메랄드 성역',
    'worlds.world02.subtitle': '살아 있는 숲이 되찾은 고대 유적.',
    'worlds.world03.title': '푸른 심해',
    'worlds.world03.subtitle': '끝없는 조류 아래 가라앉은 영역.',
    'worlds.world04.title': '서리장막 봉우리',
    'worlds.world04.subtitle': '산 폭풍 너머의 얼어붙은 요새.',
    'worlds.world05.title': '잿불 칼데라',
    'worlds.world05.subtitle': '화산 중심부의 부서진 대장간.',
    'worlds.world06.title': '심연의 공동',
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
