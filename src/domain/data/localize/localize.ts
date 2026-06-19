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

export type CommonLocalizationKey =
  | 'common.select'
  | 'common.confirm'
  | 'common.adjust'
  | 'common.back'
  | 'common.on'
  | 'common.off'
  | 'common.cancel'
  | 'common.delete'
  | 'common.warning'

export type LanguageLocalizationKey = `language.${LocaleCode}`

export type SettingsLocalizationKey =
  | 'settings.systemMenu'
  | 'settings.title'
  | 'settings.masterVolume'
  | 'settings.musicVolume'
  | 'settings.sfxVolume'
  | 'settings.language'
  | 'settings.fullscreen'
  | 'settings.screenShake'
  | 'settings.vibration'
  | 'settings.reset'
  | 'settings.deleteSave'
  | 'settings.decrease'
  | 'settings.increase'
  | 'settings.deleteTitle'
  | 'settings.deleteBody'
  | 'settings.aria.screen'
  | 'settings.aria.menu'
  | 'settings.aria.deleteConfirm'

export type LocalizationKey =
  | WorldLocalizationKey
  | TitleLocalizationKey
  | CommonLocalizationKey
  | LanguageLocalizationKey
  | SettingsLocalizationKey

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
    'language.en': 'English',
    'language.ja': 'Japanese',
    'language.zhHant': 'Traditional Chinese',
    'language.ko': 'Korean',
    'common.select': 'Select',
    'common.confirm': 'Confirm',
    'common.adjust': 'Adjust',
    'common.back': 'Back',
    'common.on': 'On',
    'common.off': 'Off',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.warning': 'Warning',
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
    'settings.systemMenu': 'System Menu',
    'settings.title': 'Settings',
    'settings.masterVolume': 'Master Volume',
    'settings.musicVolume': 'Music Volume',
    'settings.sfxVolume': 'SFX Volume',
    'settings.language': 'Language',
    'settings.fullscreen': 'Fullscreen',
    'settings.screenShake': 'Screen Shake',
    'settings.vibration': 'Controller Vibration',
    'settings.reset': 'Reset to Default',
    'settings.deleteSave': 'Delete Save Data',
    'settings.decrease': 'Decrease {item}',
    'settings.increase': 'Increase {item}',
    'settings.deleteTitle': 'Delete Save Data?',
    'settings.deleteBody': 'All stage clears, unlocks, records, and best ranks will be permanently deleted.',
    'settings.aria.screen': 'Settings screen',
    'settings.aria.menu': 'Settings menu',
    'settings.aria.deleteConfirm': 'Delete save data confirmation',
  },
  ja: {
    'language.en': '英語',
    'language.ja': '日本語',
    'language.zhHant': '繁体字中国語',
    'language.ko': '韓国語',
    'common.select': '選択',
    'common.confirm': '決定',
    'common.adjust': '調整',
    'common.back': '戻る',
    'common.on': 'オン',
    'common.off': 'オフ',
    'common.cancel': 'キャンセル',
    'common.delete': '削除',
    'common.warning': '警告',
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
    'settings.systemMenu': 'システムメニュー',
    'settings.title': '設定',
    'settings.masterVolume': 'マスター音量',
    'settings.musicVolume': '音楽音量',
    'settings.sfxVolume': '効果音音量',
    'settings.language': '言語',
    'settings.fullscreen': 'フルスクリーン',
    'settings.screenShake': '画面振動',
    'settings.vibration': 'コントローラー振動',
    'settings.reset': '初期設定に戻す',
    'settings.deleteSave': 'セーブデータ削除',
    'settings.decrease': '{item}を下げる',
    'settings.increase': '{item}を上げる',
    'settings.deleteTitle': 'セーブデータを削除しますか？',
    'settings.deleteBody': 'ステージクリア、解放、記録、最高ランクがすべて削除されます。',
    'settings.aria.screen': '設定画面',
    'settings.aria.menu': '設定メニュー',
    'settings.aria.deleteConfirm': 'セーブデータ削除確認',
  },
  zhHant: {
    'language.en': '英文',
    'language.ja': '日文',
    'language.zhHant': '繁體中文',
    'language.ko': '韓文',
    'common.select': '選擇',
    'common.confirm': '確認',
    'common.adjust': '調整',
    'common.back': '返回',
    'common.on': '開啟',
    'common.off': '關閉',
    'common.cancel': '取消',
    'common.delete': '刪除',
    'common.warning': '警告',
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
    'settings.systemMenu': '系統選單',
    'settings.title': '設定',
    'settings.masterVolume': '主音量',
    'settings.musicVolume': '音樂音量',
    'settings.sfxVolume': '音效音量',
    'settings.language': '語言',
    'settings.fullscreen': '全螢幕',
    'settings.screenShake': '畫面震動',
    'settings.vibration': '控制器震動',
    'settings.reset': '恢復預設值',
    'settings.deleteSave': '刪除存檔',
    'settings.decrease': '降低{item}',
    'settings.increase': '提高{item}',
    'settings.deleteTitle': '刪除存檔？',
    'settings.deleteBody': '所有過關、解鎖、紀錄與最佳評價都將永久刪除。',
    'settings.aria.screen': '設定畫面',
    'settings.aria.menu': '設定選單',
    'settings.aria.deleteConfirm': '刪除存檔確認',
  },
  ko: {
    'language.en': '영어',
    'language.ja': '일본어',
    'language.zhHant': '번체 중국어',
    'language.ko': '한국어',
    'common.select': '선택',
    'common.confirm': '확인',
    'common.adjust': '조정',
    'common.back': '뒤로',
    'common.on': '켜기',
    'common.off': '끄기',
    'common.cancel': '취소',
    'common.delete': '삭제',
    'common.warning': '경고',
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
    'settings.systemMenu': '시스템 메뉴',
    'settings.title': '설정',
    'settings.masterVolume': '전체 음량',
    'settings.musicVolume': '음악 음량',
    'settings.sfxVolume': '효과음 음량',
    'settings.language': '언어',
    'settings.fullscreen': '전체 화면',
    'settings.screenShake': '화면 흔들림',
    'settings.vibration': '컨트롤러 진동',
    'settings.reset': '기본값 복원',
    'settings.deleteSave': '저장 데이터 삭제',
    'settings.decrease': '{item} 낮추기',
    'settings.increase': '{item} 높이기',
    'settings.deleteTitle': '저장 데이터를 삭제할까요?',
    'settings.deleteBody': '모든 클리어, 해금, 기록 및 최고 랭크가 영구 삭제됩니다.',
    'settings.aria.screen': '설정 화면',
    'settings.aria.menu': '설정 메뉴',
    'settings.aria.deleteConfirm': '저장 데이터 삭제 확인',
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
