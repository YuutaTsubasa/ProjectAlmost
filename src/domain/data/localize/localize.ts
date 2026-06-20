export type LocaleCode = 'en' | 'ja' | 'zhHant' | 'ko'

export type WorldLocalizationKey = `worlds.world0${1 | 2 | 3 | 4 | 5 | 6}.${'title' | 'subtitle'}`

export type StageSelectLocalizationKey =
  | 'stageSelect.title'
  | 'stageSelect.objective'
  | 'stageSelect.collectibles'
  | 'stageSelect.bestTime'
  | 'stageSelect.rank'
  | 'stageSelect.activeCharacter'
  | 'stageSelect.deploy'
  | 'stageSelect.recordUnavailable'
  | 'stageSelect.aria.screen'
  | 'stageSelect.aria.map'

export type StageObjectiveLocalizationKey =
  | 'stageObjectives.reachGoal'
  | 'stageObjectives.defeatBoss'

export type StageLocalizationKey =
  `stages.${1 | 2 | 3 | 4 | 5 | 6}-${1 | 2 | 3 | 4 | 5 | 6}.${'title' | 'subtitle'}`

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
  | StageSelectLocalizationKey
  | StageObjectiveLocalizationKey
  | StageLocalizationKey
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

export interface StageSelectLocalizationReferences {
  title: StageSelectLocalizationKey
  objective: StageSelectLocalizationKey
  collectibles: StageSelectLocalizationKey
  bestTime: StageSelectLocalizationKey
  rank: StageSelectLocalizationKey
  activeCharacter: StageSelectLocalizationKey
  deploy: StageSelectLocalizationKey
  recordUnavailable: StageSelectLocalizationKey
  ariaScreen: StageSelectLocalizationKey
  ariaMap: StageSelectLocalizationKey
}

export type WorldLocalizationReferenceGroup = Record<
  `world0${1 | 2 | 3 | 4 | 5 | 6}`,
  WorldLocalizationReferences
>

export interface LocalizeData {
  languages: readonly LocaleRecord[]
  references: {
    title: TitleLocalizationReferences
    stageSelect: StageSelectLocalizationReferences
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

const stageSelect: StageSelectLocalizationReferences = {
  title: 'stageSelect.title',
  objective: 'stageSelect.objective',
  collectibles: 'stageSelect.collectibles',
  bestTime: 'stageSelect.bestTime',
  rank: 'stageSelect.rank',
  activeCharacter: 'stageSelect.activeCharacter',
  deploy: 'stageSelect.deploy',
  recordUnavailable: 'stageSelect.recordUnavailable',
  ariaScreen: 'stageSelect.aria.screen',
  ariaMap: 'stageSelect.aria.map',
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
    'stageSelect.title': 'Stage Select',
    'stageSelect.objective': 'Objective',
    'stageSelect.collectibles': 'Collectibles',
    'stageSelect.bestTime': 'Best Time',
    'stageSelect.rank': 'Rank',
    'stageSelect.activeCharacter': 'Active Character',
    'stageSelect.deploy': 'Deploy',
    'stageSelect.recordUnavailable': '--',
    'stageSelect.aria.screen': 'Stage Select screen',
    'stageSelect.aria.map': 'Stage route map',
    'stageObjectives.reachGoal': 'Reach the goal',
    'stageObjectives.defeatBoss': 'Defeat the boss',
    'stages.1-1.title': 'White Palace 1-1',
    'stages.1-1.subtitle': 'Cloud Gate Approach',
    'stages.1-2.title': 'White Palace 1-2',
    'stages.1-2.subtitle': 'Sunlit Arcade',
    'stages.1-3.title': 'White Palace 1-3',
    'stages.1-3.subtitle': 'Mirror Terrace',
    'stages.1-4.title': 'White Palace 1-4',
    'stages.1-4.subtitle': 'Ivory Liftworks',
    'stages.1-5.title': 'White Palace 1-5',
    'stages.1-5.subtitle': 'Crown Spire',
    'stages.1-6.title': 'White Palace 1-6',
    'stages.1-6.subtitle': 'Priestess Arena',
    'stages.2-1.title': 'Emerald Sanctuary 2-1',
    'stages.2-1.subtitle': 'Root Gate',
    'stages.2-2.title': 'Emerald Sanctuary 2-2',
    'stages.2-2.subtitle': 'Moss Reliquary',
    'stages.2-3.title': 'Emerald Sanctuary 2-3',
    'stages.2-3.subtitle': 'Canopy Crossing',
    'stages.2-4.title': 'Emerald Sanctuary 2-4',
    'stages.2-4.subtitle': 'Ancient Greenhouse',
    'stages.2-5.title': 'Emerald Sanctuary 2-5',
    'stages.2-5.subtitle': 'Vine Observatory',
    'stages.2-6.title': 'Emerald Sanctuary 2-6',
    'stages.2-6.subtitle': 'Forest Core',
    'stages.3-1.title': 'Cerulean Depths 3-1',
    'stages.3-1.subtitle': 'Tidefall Entry',
    'stages.3-2.title': 'Cerulean Depths 3-2',
    'stages.3-2.subtitle': 'Coral Causeway',
    'stages.3-3.title': 'Cerulean Depths 3-3',
    'stages.3-3.subtitle': 'Sunken Gallery',
    'stages.3-4.title': 'Cerulean Depths 3-4',
    'stages.3-4.subtitle': 'Pressure Locks',
    'stages.3-5.title': 'Cerulean Depths 3-5',
    'stages.3-5.subtitle': 'Abyss Window',
    'stages.3-6.title': 'Cerulean Depths 3-6',
    'stages.3-6.subtitle': 'Leviathan Chamber',
    'stages.4-1.title': 'Frostveil Peaks 4-1',
    'stages.4-1.subtitle': 'Snowline Gate',
    'stages.4-2.title': 'Frostveil Peaks 4-2',
    'stages.4-2.subtitle': 'Glacier Steps',
    'stages.4-3.title': 'Frostveil Peaks 4-3',
    'stages.4-3.subtitle': 'Crystal Rampart',
    'stages.4-4.title': 'Frostveil Peaks 4-4',
    'stages.4-4.subtitle': 'Storm Bridge',
    'stages.4-5.title': 'Frostveil Peaks 4-5',
    'stages.4-5.subtitle': 'Frozen Keep',
    'stages.4-6.title': 'Frostveil Peaks 4-6',
    'stages.4-6.subtitle': 'Whiteout Throne',
    'stages.5-1.title': 'Emberfall Caldera 5-1',
    'stages.5-1.subtitle': 'Ashen Gate',
    'stages.5-2.title': 'Emberfall Caldera 5-2',
    'stages.5-2.subtitle': 'Magma Conduit',
    'stages.5-3.title': 'Emberfall Caldera 5-3',
    'stages.5-3.subtitle': 'Forge Ruins',
    'stages.5-4.title': 'Emberfall Caldera 5-4',
    'stages.5-4.subtitle': 'Cinder Elevator',
    'stages.5-5.title': 'Emberfall Caldera 5-5',
    'stages.5-5.subtitle': 'Core Crucible',
    'stages.5-6.title': 'Emberfall Caldera 5-6',
    'stages.5-6.subtitle': 'Inferno Heart',
    'stages.6-1.title': 'Abyssal Hollow 6-1',
    'stages.6-1.subtitle': 'Hollow Descent',
    'stages.6-2.title': 'Abyssal Hollow 6-2',
    'stages.6-2.subtitle': 'Silent Maw',
    'stages.6-3.title': 'Abyssal Hollow 6-3',
    'stages.6-3.subtitle': 'Umbral Stair',
    'stages.6-4.title': 'Abyssal Hollow 6-4',
    'stages.6-4.subtitle': 'Demon Archives',
    'stages.6-5.title': 'Abyssal Hollow 6-5',
    'stages.6-5.subtitle': 'Last Seal',
    'stages.6-6.title': 'Abyssal Hollow 6-6',
    'stages.6-6.subtitle': 'Abyss Throne',
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
    'stageSelect.title': 'ステージ選択',
    'stageSelect.objective': '目標',
    'stageSelect.collectibles': '収集',
    'stageSelect.bestTime': 'ベストタイム',
    'stageSelect.rank': 'ランク',
    'stageSelect.activeCharacter': '出撃キャラクター',
    'stageSelect.deploy': '出撃',
    'stageSelect.recordUnavailable': '--',
    'stageSelect.aria.screen': 'ステージ選択画面',
    'stageSelect.aria.map': 'ステージ進行マップ',
    'stageObjectives.reachGoal': 'ゴールに到達',
    'stageObjectives.defeatBoss': 'ボスを倒す',
    'stages.1-1.title': 'ホワイトパレス 1-1',
    'stages.1-1.subtitle': '雲門への道',
    'stages.1-2.title': 'ホワイトパレス 1-2',
    'stages.1-2.subtitle': '陽光の回廊',
    'stages.1-3.title': 'ホワイトパレス 1-3',
    'stages.1-3.subtitle': '鏡のテラス',
    'stages.1-4.title': 'ホワイトパレス 1-4',
    'stages.1-4.subtitle': '象牙の昇降機構',
    'stages.1-5.title': 'ホワイトパレス 1-5',
    'stages.1-5.subtitle': '王冠の尖塔',
    'stages.1-6.title': 'ホワイトパレス 1-6',
    'stages.1-6.subtitle': '巫女の闘技場',
    'stages.2-1.title': 'エメラルド・サンクチュアリ 2-1',
    'stages.2-1.subtitle': '根門',
    'stages.2-2.title': 'エメラルド・サンクチュアリ 2-2',
    'stages.2-2.subtitle': '苔むす聖遺物庫',
    'stages.2-3.title': 'エメラルド・サンクチュアリ 2-3',
    'stages.2-3.subtitle': '樹冠の渡り場',
    'stages.2-4.title': 'エメラルド・サンクチュアリ 2-4',
    'stages.2-4.subtitle': '古代温室',
    'stages.2-5.title': 'エメラルド・サンクチュアリ 2-5',
    'stages.2-5.subtitle': '蔦の観測塔',
    'stages.2-6.title': 'エメラルド・サンクチュアリ 2-6',
    'stages.2-6.subtitle': '森の核',
    'stages.3-1.title': 'セルリアン・デプス 3-1',
    'stages.3-1.subtitle': '潮落ちの入口',
    'stages.3-2.title': 'セルリアン・デプス 3-2',
    'stages.3-2.subtitle': '珊瑚の回廊',
    'stages.3-3.title': 'セルリアン・デプス 3-3',
    'stages.3-3.subtitle': '沈んだ展示廊',
    'stages.3-4.title': 'セルリアン・デプス 3-4',
    'stages.3-4.subtitle': '圧力隔壁',
    'stages.3-5.title': 'セルリアン・デプス 3-5',
    'stages.3-5.subtitle': '深淵の窓',
    'stages.3-6.title': 'セルリアン・デプス 3-6',
    'stages.3-6.subtitle': 'リヴァイアサンの間',
    'stages.4-1.title': 'フロストヴェイル・ピークス 4-1',
    'stages.4-1.subtitle': '雪線の門',
    'stages.4-2.title': 'フロストヴェイル・ピークス 4-2',
    'stages.4-2.subtitle': '氷河の階段',
    'stages.4-3.title': 'フロストヴェイル・ピークス 4-3',
    'stages.4-3.subtitle': '水晶の城壁',
    'stages.4-4.title': 'フロストヴェイル・ピークス 4-4',
    'stages.4-4.subtitle': '嵐の橋',
    'stages.4-5.title': 'フロストヴェイル・ピークス 4-5',
    'stages.4-5.subtitle': '凍てつく城砦',
    'stages.4-6.title': 'フロストヴェイル・ピークス 4-6',
    'stages.4-6.subtitle': '白霧の玉座',
    'stages.5-1.title': 'エンバーフォール・カルデラ 5-1',
    'stages.5-1.subtitle': '灰門',
    'stages.5-2.title': 'エンバーフォール・カルデラ 5-2',
    'stages.5-2.subtitle': '溶岩導路',
    'stages.5-3.title': 'エンバーフォール・カルデラ 5-3',
    'stages.5-3.subtitle': '炉跡',
    'stages.5-4.title': 'エンバーフォール・カルデラ 5-4',
    'stages.5-4.subtitle': '煤の昇降機',
    'stages.5-5.title': 'エンバーフォール・カルデラ 5-5',
    'stages.5-5.subtitle': '中核の坩堝',
    'stages.5-6.title': 'エンバーフォール・カルデラ 5-6',
    'stages.5-6.subtitle': '煉獄の心臓',
    'stages.6-1.title': 'アビサル・ホロウ 6-1',
    'stages.6-1.subtitle': '虚ろの降路',
    'stages.6-2.title': 'アビサル・ホロウ 6-2',
    'stages.6-2.subtitle': '静寂の顎',
    'stages.6-3.title': 'アビサル・ホロウ 6-3',
    'stages.6-3.subtitle': '影の階',
    'stages.6-4.title': 'アビサル・ホロウ 6-4',
    'stages.6-4.subtitle': '魔典書庫',
    'stages.6-5.title': 'アビサル・ホロウ 6-5',
    'stages.6-5.subtitle': '最後の封印',
    'stages.6-6.title': 'アビサル・ホロウ 6-6',
    'stages.6-6.subtitle': '深淵の玉座',
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
    'stageSelect.title': '關卡選擇',
    'stageSelect.objective': '目標',
    'stageSelect.collectibles': '收集品',
    'stageSelect.bestTime': '最佳時間',
    'stageSelect.rank': '評級',
    'stageSelect.activeCharacter': '出擊角色',
    'stageSelect.deploy': '出擊',
    'stageSelect.recordUnavailable': '--',
    'stageSelect.aria.screen': '關卡選擇畫面',
    'stageSelect.aria.map': '關卡路線地圖',
    'stageObjectives.reachGoal': '抵達終點',
    'stageObjectives.defeatBoss': '擊敗首領',
    'stages.1-1.title': '白色宮殿 1-1',
    'stages.1-1.subtitle': '雲門前路',
    'stages.1-2.title': '白色宮殿 1-2',
    'stages.1-2.subtitle': '日照迴廊',
    'stages.1-3.title': '白色宮殿 1-3',
    'stages.1-3.subtitle': '鏡面露臺',
    'stages.1-4.title': '白色宮殿 1-4',
    'stages.1-4.subtitle': '象牙升降工坊',
    'stages.1-5.title': '白色宮殿 1-5',
    'stages.1-5.subtitle': '王冠尖塔',
    'stages.1-6.title': '白色宮殿 1-6',
    'stages.1-6.subtitle': '祭司競技場',
    'stages.2-1.title': '翡翠聖林 2-1',
    'stages.2-1.subtitle': '根門入口',
    'stages.2-2.title': '翡翠聖林 2-2',
    'stages.2-2.subtitle': '苔紋聖物庫',
    'stages.2-3.title': '翡翠聖林 2-3',
    'stages.2-3.subtitle': '樹冠通道',
    'stages.2-4.title': '翡翠聖林 2-4',
    'stages.2-4.subtitle': '古代溫室',
    'stages.2-5.title': '翡翠聖林 2-5',
    'stages.2-5.subtitle': '藤蔓觀測臺',
    'stages.2-6.title': '翡翠聖林 2-6',
    'stages.2-6.subtitle': '森林核心',
    'stages.3-1.title': '蔚藍深海 3-1',
    'stages.3-1.subtitle': '潮落入口',
    'stages.3-2.title': '蔚藍深海 3-2',
    'stages.3-2.subtitle': '珊瑚道',
    'stages.3-3.title': '蔚藍深海 3-3',
    'stages.3-3.subtitle': '沉沒畫廊',
    'stages.3-4.title': '蔚藍深海 3-4',
    'stages.3-4.subtitle': '水壓閘門',
    'stages.3-5.title': '蔚藍深海 3-5',
    'stages.3-5.subtitle': '深淵之窗',
    'stages.3-6.title': '蔚藍深海 3-6',
    'stages.3-6.subtitle': '海獸之室',
    'stages.4-1.title': '霜幕群峰 4-1',
    'stages.4-1.subtitle': '雪線之門',
    'stages.4-2.title': '霜幕群峰 4-2',
    'stages.4-2.subtitle': '冰河階梯',
    'stages.4-3.title': '霜幕群峰 4-3',
    'stages.4-3.subtitle': '水晶堡壘',
    'stages.4-4.title': '霜幕群峰 4-4',
    'stages.4-4.subtitle': '風暴之橋',
    'stages.4-5.title': '霜幕群峰 4-5',
    'stages.4-5.subtitle': '冰封要塞',
    'stages.4-6.title': '霜幕群峰 4-6',
    'stages.4-6.subtitle': '白暴王座',
    'stages.5-1.title': '燼落火山 5-1',
    'stages.5-1.subtitle': '灰燼之門',
    'stages.5-2.title': '燼落火山 5-2',
    'stages.5-2.subtitle': '熔岩導道',
    'stages.5-3.title': '燼落火山 5-3',
    'stages.5-3.subtitle': '鍛爐遺跡',
    'stages.5-4.title': '燼落火山 5-4',
    'stages.5-4.subtitle': '灰燼升降梯',
    'stages.5-5.title': '燼落火山 5-5',
    'stages.5-5.subtitle': '核心熔爐',
    'stages.5-6.title': '燼落火山 5-6',
    'stages.5-6.subtitle': '煉獄之心',
    'stages.6-1.title': '深淵魔窟 6-1',
    'stages.6-1.subtitle': '空洞降道',
    'stages.6-2.title': '深淵魔窟 6-2',
    'stages.6-2.subtitle': '靜默巨口',
    'stages.6-3.title': '深淵魔窟 6-3',
    'stages.6-3.subtitle': '幽影階梯',
    'stages.6-4.title': '深淵魔窟 6-4',
    'stages.6-4.subtitle': '魔典檔庫',
    'stages.6-5.title': '深淵魔窟 6-5',
    'stages.6-5.subtitle': '最後封印',
    'stages.6-6.title': '深淵魔窟 6-6',
    'stages.6-6.subtitle': '深淵王座',
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
    'stageSelect.title': '스테이지 선택',
    'stageSelect.objective': '목표',
    'stageSelect.collectibles': '수집품',
    'stageSelect.bestTime': '최고 기록',
    'stageSelect.rank': '랭크',
    'stageSelect.activeCharacter': '출격 캐릭터',
    'stageSelect.deploy': '출격',
    'stageSelect.recordUnavailable': '--',
    'stageSelect.aria.screen': '스테이지 선택 화면',
    'stageSelect.aria.map': '스테이지 경로 지도',
    'stageObjectives.reachGoal': '목표 지점에 도달',
    'stageObjectives.defeatBoss': '보스 처치',
    'stages.1-1.title': '화이트 팰리스 1-1',
    'stages.1-1.subtitle': '구름 문 진입로',
    'stages.1-2.title': '화이트 팰리스 1-2',
    'stages.1-2.subtitle': '햇살 아케이드',
    'stages.1-3.title': '화이트 팰리스 1-3',
    'stages.1-3.subtitle': '거울 테라스',
    'stages.1-4.title': '화이트 팰리스 1-4',
    'stages.1-4.subtitle': '상아 승강 공방',
    'stages.1-5.title': '화이트 팰리스 1-5',
    'stages.1-5.subtitle': '크라운 첨탑',
    'stages.1-6.title': '화이트 팰리스 1-6',
    'stages.1-6.subtitle': '사제의 투기장',
    'stages.2-1.title': '에메랄드 생추어리 2-1',
    'stages.2-1.subtitle': '뿌리 관문',
    'stages.2-2.title': '에메랄드 생추어리 2-2',
    'stages.2-2.subtitle': '이끼 성물고',
    'stages.2-3.title': '에메랄드 생추어리 2-3',
    'stages.2-3.subtitle': '수관 횡단로',
    'stages.2-4.title': '에메랄드 생추어리 2-4',
    'stages.2-4.subtitle': '고대 온실',
    'stages.2-5.title': '에메랄드 생추어리 2-5',
    'stages.2-5.subtitle': '덩굴 관측소',
    'stages.2-6.title': '에메랄드 생추어리 2-6',
    'stages.2-6.subtitle': '숲의 핵심',
    'stages.3-1.title': '세룰리안 심해 3-1',
    'stages.3-1.subtitle': '조류 낙하 입구',
    'stages.3-2.title': '세룰리안 심해 3-2',
    'stages.3-2.subtitle': '산호 회랑',
    'stages.3-3.title': '세룰리안 심해 3-3',
    'stages.3-3.subtitle': '침몰 전시관',
    'stages.3-4.title': '세룰리안 심해 3-4',
    'stages.3-4.subtitle': '압력 격문',
    'stages.3-5.title': '세룰리안 심해 3-5',
    'stages.3-5.subtitle': '심연의 창',
    'stages.3-6.title': '세룰리안 심해 3-6',
    'stages.3-6.subtitle': '리바이어던 실',
    'stages.4-1.title': '프로스트베일 봉우리 4-1',
    'stages.4-1.subtitle': '설선 관문',
    'stages.4-2.title': '프로스트베일 봉우리 4-2',
    'stages.4-2.subtitle': '빙하 계단',
    'stages.4-3.title': '프로스트베일 봉우리 4-3',
    'stages.4-3.subtitle': '수정 성벽',
    'stages.4-4.title': '프로스트베일 봉우리 4-4',
    'stages.4-4.subtitle': '폭풍 다리',
    'stages.4-5.title': '프로스트베일 봉우리 4-5',
    'stages.4-5.subtitle': '빙결 요새',
    'stages.4-6.title': '프로스트베일 봉우리 4-6',
    'stages.4-6.subtitle': '백설 왕좌',
    'stages.5-1.title': '엠버폴 칼데라 5-1',
    'stages.5-1.subtitle': '재의 관문',
    'stages.5-2.title': '엠버폴 칼데라 5-2',
    'stages.5-2.subtitle': '마그마 도관',
    'stages.5-3.title': '엠버폴 칼데라 5-3',
    'stages.5-3.subtitle': '대장간 폐허',
    'stages.5-4.title': '엠버폴 칼데라 5-4',
    'stages.5-4.subtitle': '잿불 승강기',
    'stages.5-5.title': '엠버폴 칼데라 5-5',
    'stages.5-5.subtitle': '중핵 도가니',
    'stages.5-6.title': '엠버폴 칼데라 5-6',
    'stages.5-6.subtitle': '지옥의 심장',
    'stages.6-1.title': '어비설 할로우 6-1',
    'stages.6-1.subtitle': '공허 하강로',
    'stages.6-2.title': '어비설 할로우 6-2',
    'stages.6-2.subtitle': '침묵의 아가리',
    'stages.6-3.title': '어비설 할로우 6-3',
    'stages.6-3.subtitle': '암영 계단',
    'stages.6-4.title': '어비설 할로우 6-4',
    'stages.6-4.subtitle': '악마 서고',
    'stages.6-5.title': '어비설 할로우 6-5',
    'stages.6-5.subtitle': '최후의 봉인',
    'stages.6-6.title': '어비설 할로우 6-6',
    'stages.6-6.subtitle': '심연의 왕좌',
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
    stageSelect,
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
