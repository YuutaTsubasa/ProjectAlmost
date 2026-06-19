export type LocaleCode = 'en' | 'ja' | 'zhHant' | 'ko'

export type WorldLocalizationKey = `worlds.world0${1 | 2 | 3 | 4 | 5 | 6}.${'title' | 'subtitle'}`

export type TitleLocalizationKey =
  | 'title.prompt.pressAnyButton'
  | 'title.menu.start'
  | 'title.menu.settings'
  | 'title.menu.back'
  | 'title.controls.select'
  | 'title.controls.confirm'
  | 'title.controls.back'
  | 'title.aria.screen'
  | 'title.aria.openMenu'
  | 'title.aria.menu'

export type LocalizationKey = WorldLocalizationKey | TitleLocalizationKey

export interface LocaleRecord {
  code: LocaleCode
  label: string
}

export type LocalizedTextCatalog = Record<LocaleCode, Partial<Record<LocalizationKey, string>>>

export interface WorldLocalizationReferences {
  title: LocalizationKey
  subtitle: LocalizationKey
}

export interface TitleLocalizationReferences {
  promptPressAnyButton: TitleLocalizationKey
  menuStart: TitleLocalizationKey
  menuSettings: TitleLocalizationKey
  menuBack: TitleLocalizationKey
  controlsSelect: TitleLocalizationKey
  controlsConfirm: TitleLocalizationKey
  controlsBack: TitleLocalizationKey
  ariaScreen: TitleLocalizationKey
  ariaOpenMenu: TitleLocalizationKey
  ariaMenu: TitleLocalizationKey
}

export type WorldLocalizationReferenceGroup = Record<
  `world0${1 | 2 | 3 | 4 | 5 | 6}`,
  WorldLocalizationReferences
>

export interface LocalizeData {
  languages: readonly LocaleRecord[]
  references: {
    title: TitleLocalizationReferences
    worlds: WorldLocalizationReferenceGroup
  }
  catalog: LocalizedTextCatalog
}

const title: TitleLocalizationReferences = {
  promptPressAnyButton: 'title.prompt.pressAnyButton',
  menuStart: 'title.menu.start',
  menuSettings: 'title.menu.settings',
  menuBack: 'title.menu.back',
  controlsSelect: 'title.controls.select',
  controlsConfirm: 'title.controls.confirm',
  controlsBack: 'title.controls.back',
  ariaScreen: 'title.aria.screen',
  ariaOpenMenu: 'title.aria.openMenu',
  ariaMenu: 'title.aria.menu',
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
    'title.prompt.pressAnyButton': 'Press Any Button',
    'title.menu.start': 'Start Game',
    'title.menu.settings': 'Settings',
    'title.menu.back': 'Back',
    'title.controls.select': 'Select',
    'title.controls.confirm': 'Confirm',
    'title.controls.back': 'Back',
    'title.aria.screen': 'Project Almost title screen',
    'title.aria.openMenu': 'Open title menu',
    'title.aria.menu': 'Title menu',
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
    'title.prompt.pressAnyButton': 'いずれかのボタンを押してください',
    'title.menu.start': 'ゲーム開始',
    'title.menu.settings': '設定',
    'title.menu.back': '戻る',
    'title.controls.select': '選択',
    'title.controls.confirm': '決定',
    'title.controls.back': '戻る',
    'title.aria.screen': 'Project Almost タイトル画面',
    'title.aria.openMenu': 'タイトルメニューを開く',
    'title.aria.menu': 'タイトルメニュー',
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
    'title.prompt.pressAnyButton': '按下任意按鈕',
    'title.menu.start': '開始遊戲',
    'title.menu.settings': '設定',
    'title.menu.back': '返回',
    'title.controls.select': '選擇',
    'title.controls.confirm': '確認',
    'title.controls.back': '返回',
    'title.aria.screen': 'Project Almost 標題畫面',
    'title.aria.openMenu': '開啟標題選單',
    'title.aria.menu': '標題選單',
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
    'title.prompt.pressAnyButton': '아무 버튼이나 누르세요',
    'title.menu.start': '게임 시작',
    'title.menu.settings': '설정',
    'title.menu.back': '뒤로',
    'title.controls.select': '선택',
    'title.controls.confirm': '확인',
    'title.controls.back': '뒤로',
    'title.aria.screen': 'Project Almost 타이틀 화면',
    'title.aria.openMenu': '타이틀 메뉴 열기',
    'title.aria.menu': '타이틀 메뉴',
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
    title,
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
