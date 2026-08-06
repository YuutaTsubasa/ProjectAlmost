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
  | 'stageObjectives.stageClear'

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
  | 'common.locked'

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

export type PauseLocalizationKey =
  | 'pause.paused'
  | 'pause.resume'
  | 'pause.restart'
  | 'pause.stageSelect'
  | 'pause.aria.menu'

export type GameplayHudLocalizationKey =
  | 'hud.bossPhase'
  | 'hud.bossPhaseHint'

export type TouchLocalizationKey =
  | 'touch.pause'
  | 'touch.move'
  | 'touch.jump'
  | 'touch.attack'

export type GameplayStatusLocalizationKey =
  | 'status.initial'
  | 'status.checkpoint'
  | 'status.restored'
  | 'status.fall'
  | 'status.critical'
  | 'status.goal'
  | 'status.bossPattern'
  | 'status.bossVulnerable'
  | 'status.bossDefeated'

export type LoadingLocalizationKey =
  | 'loading.title'
  | 'loading.phase.boot'
  | 'loading.phase.gameplay'
  | 'loading.phase.background'
  | 'loading.warning'

export type AvgLocalizationKey =
  | 'avg.skip'
  | 'avg.speaker.yuuta'
  | 'avg.speaker.whitePriestess'
  | `avg.1-6.line${1 | 2 | 3 | 4 | 5 | 6}`

export type LocalizationKey =
  | WorldLocalizationKey
  | StageSelectLocalizationKey
  | StageObjectiveLocalizationKey
  | StageLocalizationKey
  | TitleLocalizationKey
  | CommonLocalizationKey
  | LanguageLocalizationKey
  | SettingsLocalizationKey
  | PauseLocalizationKey
  | GameplayHudLocalizationKey
  | TouchLocalizationKey
  | GameplayStatusLocalizationKey
  | LoadingLocalizationKey
  | AvgLocalizationKey

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
    'loading.title': 'Loading',
    'loading.phase.boot': 'Preparing system assets',
    'loading.phase.gameplay': 'Preparing stage assets',
    'loading.phase.background': 'Preparing nearby assets',
    'loading.warning': 'Some assets could not be prepared',
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
    'common.locked': 'Locked',
    'touch.pause': 'Pause',
    'touch.move': 'Move',
    'touch.jump': 'Jump',
    'touch.attack': 'Attack',
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
    'stageObjectives.stageClear': 'Stage clear',
    'stages.1-1.title': 'White Palace 1-1',
    'stages.1-1.subtitle': 'The First Gate',
    'stages.1-2.title': 'White Palace 1-2',
    'stages.1-2.subtitle': 'Azure Courtyard',
    'stages.1-3.title': 'White Palace 1-3',
    'stages.1-3.subtitle': 'Sky Terrace',
    'stages.1-4.title': 'White Palace 1-4',
    'stages.1-4.subtitle': 'The Arch Bridge',
    'stages.1-5.title': 'White Palace 1-5',
    'stages.1-5.subtitle': 'Hanging Garden',
    'stages.1-6.title': 'White Palace 1-6',
    'stages.1-6.subtitle': 'The High Spire',
    'stages.2-1.title': 'Emerald Sanctuary 2-1',
    'stages.2-1.subtitle': 'Thornwake Steps',
    'stages.2-2.title': 'Emerald Sanctuary 2-2',
    'stages.2-2.subtitle': 'Vine Ferry',
    'stages.2-3.title': 'Emerald Sanctuary 2-3',
    'stages.2-3.subtitle': 'Bramble Run',
    'stages.2-4.title': 'Emerald Sanctuary 2-4',
    'stages.2-4.subtitle': 'Canopy Lift',
    'stages.2-5.title': 'Emerald Sanctuary 2-5',
    'stages.2-5.subtitle': 'Sanctuary Gauntlet',
    'stages.2-6.title': 'Emerald Sanctuary 2-6',
    'stages.2-6.subtitle': 'Heartroot Duel',
    'stages.3-1.title': 'Cerulean Depths 3-1',
    'stages.3-1.subtitle': 'Tide Inversion',
    'stages.3-2.title': 'Cerulean Depths 3-2',
    'stages.3-2.subtitle': 'Undertide Steps',
    'stages.3-3.title': 'Cerulean Depths 3-3',
    'stages.3-3.subtitle': 'Mirror Current',
    'stages.3-4.title': 'Cerulean Depths 3-4',
    'stages.3-4.subtitle': 'Pearl Vortex',
    'stages.3-5.title': 'Cerulean Depths 3-5',
    'stages.3-5.subtitle': 'Abyss Current',
    'stages.3-6.title': 'Cerulean Depths 3-6',
    'stages.3-6.subtitle': 'Leviathan Mirror',
    'stages.4-1.title': 'Frostveil Peaks 4-1',
    'stages.4-1.subtitle': 'Icebound Run',
    'stages.4-2.title': 'Frostveil Peaks 4-2',
    'stages.4-2.subtitle': 'Crystal Slope',
    'stages.4-3.title': 'Frostveil Peaks 4-3',
    'stages.4-3.subtitle': 'Frost Chain',
    'stages.4-4.title': 'Frostveil Peaks 4-4',
    'stages.4-4.subtitle': 'Blizzard Lifts',
    'stages.4-5.title': 'Frostveil Peaks 4-5',
    'stages.4-5.subtitle': 'Frozen Gauntlet',
    'stages.4-6.title': 'Frostveil Peaks 4-6',
    'stages.4-6.subtitle': 'Snowcrown Duel',
    'stages.5-1.title': 'Emberfall Caldera 5-1',
    'stages.5-1.subtitle': 'Cinder Run',
    'stages.5-2.title': 'Emberfall Caldera 5-2',
    'stages.5-2.subtitle': 'Magma Lift',
    'stages.5-3.title': 'Emberfall Caldera 5-3',
    'stages.5-3.subtitle': 'Eruption Chain',
    'stages.5-4.title': 'Emberfall Caldera 5-4',
    'stages.5-4.subtitle': 'Caldera Crossing',
    'stages.5-5.title': 'Emberfall Caldera 5-5',
    'stages.5-5.subtitle': 'Inferno Gauntlet',
    'stages.5-6.title': 'Emberfall Caldera 5-6',
    'stages.5-6.subtitle': 'Emberheart Duel',
    'stages.6-1.title': 'Abyssal Hollow 6-1',
    'stages.6-1.subtitle': 'Hollow Threshold',
    'stages.6-2.title': 'Abyssal Hollow 6-2',
    'stages.6-2.subtitle': 'Inverted Thorns',
    'stages.6-3.title': 'Abyssal Hollow 6-3',
    'stages.6-3.subtitle': 'Abyssal Conveyor',
    'stages.6-4.title': 'Abyssal Hollow 6-4',
    'stages.6-4.subtitle': 'Demon Current',
    'stages.6-5.title': 'Abyssal Hollow 6-5',
    'stages.6-5.subtitle': 'Final Synthesis',
    'stages.6-6.title': 'Abyssal Hollow 6-6',
    'stages.6-6.subtitle': 'Abyss Queen Duel',
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
    'pause.paused': 'Paused',
    'pause.resume': 'Resume',
    'pause.restart': 'Restart Stage',
    'pause.stageSelect': 'Return to Stage Select',
    'pause.aria.menu': 'Pause menu',
    'hud.bossPhase': 'Boss Phase',
    'hud.bossPhaseHint': 'Each hit starts the next pattern from the entrance.',
    'status.initial': 'Advance to the exit.',
    'status.checkpoint': 'Checkpoint synchronized.',
    'status.restored': 'Checkpoint restored.',
    'status.fall': 'Altitude lost. Recovering.',
    'status.critical': 'Critical damage. Avoid contact.',
    'status.goal': 'Exit reached.',
    'status.bossPattern': 'Boss phase {phase}/{max}. Evade the barrage.',
    'status.bossVulnerable': 'Attack window open. Strike the Boss now.',
    'status.bossDefeated': 'Boss signal defeated. The exit is open.',
  },
  ja: {
    'loading.title': '読み込み中',
    'loading.phase.boot': 'システムアセットを準備中',
    'loading.phase.gameplay': 'ステージアセットを準備中',
    'loading.phase.background': '周辺アセットを準備中',
    'loading.warning': '一部のアセットを準備できませんでした',
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
    'common.locked': 'ロック中',
    'touch.pause': 'ポーズ',
    'touch.move': '移動',
    'touch.jump': 'ジャンプ',
    'touch.attack': '攻撃',
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
    'stageObjectives.stageClear': 'ステージクリア',
    'stages.1-1.title': 'ホワイトパレス 1-1',
    'stages.1-1.subtitle': '最初の門',
    'stages.1-2.title': 'ホワイトパレス 1-2',
    'stages.1-2.subtitle': '蒼の中庭',
    'stages.1-3.title': 'ホワイトパレス 1-3',
    'stages.1-3.subtitle': '空中テラス',
    'stages.1-4.title': 'ホワイトパレス 1-4',
    'stages.1-4.subtitle': '大アーチ橋',
    'stages.1-5.title': 'ホワイトパレス 1-5',
    'stages.1-5.subtitle': '空中庭園',
    'stages.1-6.title': 'ホワイトパレス 1-6',
    'stages.1-6.subtitle': '高き尖塔',
    'stages.2-1.title': 'エメラルド・サンクチュアリ 2-1',
    'stages.2-1.subtitle': '棘醒めの階段',
    'stages.2-2.title': 'エメラルド・サンクチュアリ 2-2',
    'stages.2-2.subtitle': '蔦の渡し',
    'stages.2-3.title': 'エメラルド・サンクチュアリ 2-3',
    'stages.2-3.subtitle': '茨の疾走',
    'stages.2-4.title': 'エメラルド・サンクチュアリ 2-4',
    'stages.2-4.subtitle': '樹冠リフト',
    'stages.2-5.title': 'エメラルド・サンクチュアリ 2-5',
    'stages.2-5.subtitle': '聖域の試練',
    'stages.2-6.title': 'エメラルド・サンクチュアリ 2-6',
    'stages.2-6.subtitle': '心根の決闘',
    'stages.3-1.title': 'セルリアン・デプス 3-1',
    'stages.3-1.subtitle': '潮汐反転',
    'stages.3-2.title': 'セルリアン・デプス 3-2',
    'stages.3-2.subtitle': '逆潮の階段',
    'stages.3-3.title': 'セルリアン・デプス 3-3',
    'stages.3-3.subtitle': '鏡の海流',
    'stages.3-4.title': 'セルリアン・デプス 3-4',
    'stages.3-4.subtitle': '真珠の渦',
    'stages.3-5.title': 'セルリアン・デプス 3-5',
    'stages.3-5.subtitle': '深淵海流',
    'stages.3-6.title': 'セルリアン・デプス 3-6',
    'stages.3-6.subtitle': 'リヴァイアサンの鏡',
    'stages.4-1.title': 'フロストヴェイル・ピークス 4-1',
    'stages.4-1.subtitle': '氷縛の疾走',
    'stages.4-2.title': 'フロストヴェイル・ピークス 4-2',
    'stages.4-2.subtitle': '水晶斜面',
    'stages.4-3.title': 'フロストヴェイル・ピークス 4-3',
    'stages.4-3.subtitle': '霜の連鎖',
    'stages.4-4.title': 'フロストヴェイル・ピークス 4-4',
    'stages.4-4.subtitle': '吹雪リフト',
    'stages.4-5.title': 'フロストヴェイル・ピークス 4-5',
    'stages.4-5.subtitle': '凍結試練',
    'stages.4-6.title': 'フロストヴェイル・ピークス 4-6',
    'stages.4-6.subtitle': '雪冠の決闘',
    'stages.5-1.title': 'エンバーフォール・カルデラ 5-1',
    'stages.5-1.subtitle': '燃え殻の疾走',
    'stages.5-2.title': 'エンバーフォール・カルデラ 5-2',
    'stages.5-2.subtitle': 'マグマリフト',
    'stages.5-3.title': 'エンバーフォール・カルデラ 5-3',
    'stages.5-3.subtitle': '噴火連鎖',
    'stages.5-4.title': 'エンバーフォール・カルデラ 5-4',
    'stages.5-4.subtitle': 'カルデラ横断',
    'stages.5-5.title': 'エンバーフォール・カルデラ 5-5',
    'stages.5-5.subtitle': '業火試練',
    'stages.5-6.title': 'エンバーフォール・カルデラ 5-6',
    'stages.5-6.subtitle': '熾心の決闘',
    'stages.6-1.title': 'アビサル・ホロウ 6-1',
    'stages.6-1.subtitle': '虚ろの境界',
    'stages.6-2.title': 'アビサル・ホロウ 6-2',
    'stages.6-2.subtitle': '反転する棘',
    'stages.6-3.title': 'アビサル・ホロウ 6-3',
    'stages.6-3.subtitle': '深淵コンベア',
    'stages.6-4.title': 'アビサル・ホロウ 6-4',
    'stages.6-4.subtitle': '魔流',
    'stages.6-5.title': 'アビサル・ホロウ 6-5',
    'stages.6-5.subtitle': '最終融合',
    'stages.6-6.title': 'アビサル・ホロウ 6-6',
    'stages.6-6.subtitle': '深淵女王の決闘',
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
    'pause.paused': 'ポーズ',
    'pause.resume': '再開',
    'pause.restart': 'ステージ再開',
    'pause.stageSelect': 'ステージ選択へ',
    'pause.aria.menu': 'ポーズメニュー',
    'hud.bossPhase': 'ボスフェーズ',
    'hud.bossPhaseHint': '攻撃が当たるたび入口から次のパターンが始まります。',
    'status.initial': '出口へ進んでください。',
    'status.checkpoint': 'チェックポイントを同期しました。',
    'status.restored': 'チェックポイントから復帰しました。',
    'status.fall': '高度を失いました。復帰します。',
    'status.critical': '致命傷です。接触を避けてください。',
    'status.goal': '出口に到達しました。',
    'status.bossPattern': 'ボスフェーズ {phase}/{max}。弾幕を回避してください。',
    'status.bossVulnerable': '攻撃チャンス。今すぐボスを攻撃してください。',
    'status.bossDefeated': 'ボス信号を撃破。出口が開きました。',
  },
  zhHant: {
    'loading.title': '載入中',
    'loading.phase.boot': '正在準備系統資產',
    'loading.phase.gameplay': '正在準備關卡資產',
    'loading.phase.background': '正在準備周邊資產',
    'loading.warning': '部分資產無法準備',
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
    'common.locked': '未解鎖',
    'touch.pause': '暫停',
    'touch.move': '移動',
    'touch.jump': '跳躍',
    'touch.attack': '攻擊',
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
    'stageObjectives.stageClear': '關卡完成',
    'stages.1-1.title': '白色宮殿 1-1',
    'stages.1-1.subtitle': '最初之門',
    'stages.1-2.title': '白色宮殿 1-2',
    'stages.1-2.subtitle': '蒼藍中庭',
    'stages.1-3.title': '白色宮殿 1-3',
    'stages.1-3.subtitle': '天空露台',
    'stages.1-4.title': '白色宮殿 1-4',
    'stages.1-4.subtitle': '拱橋',
    'stages.1-5.title': '白色宮殿 1-5',
    'stages.1-5.subtitle': '空中花園',
    'stages.1-6.title': '白色宮殿 1-6',
    'stages.1-6.subtitle': '高塔',
    'stages.2-1.title': '翡翠聖林 2-1',
    'stages.2-1.subtitle': '刺醒階梯',
    'stages.2-2.title': '翡翠聖林 2-2',
    'stages.2-2.subtitle': '藤蔓渡台',
    'stages.2-3.title': '翡翠聖林 2-3',
    'stages.2-3.subtitle': '荊棘奔路',
    'stages.2-4.title': '翡翠聖林 2-4',
    'stages.2-4.subtitle': '樹冠升降',
    'stages.2-5.title': '翡翠聖林 2-5',
    'stages.2-5.subtitle': '聖林試煉',
    'stages.2-6.title': '翡翠聖林 2-6',
    'stages.2-6.subtitle': '心根決鬥',
    'stages.3-1.title': '蔚藍深海 3-1',
    'stages.3-1.subtitle': '潮汐反轉',
    'stages.3-2.title': '蔚藍深海 3-2',
    'stages.3-2.subtitle': '逆潮階梯',
    'stages.3-3.title': '蔚藍深海 3-3',
    'stages.3-3.subtitle': '鏡流',
    'stages.3-4.title': '蔚藍深海 3-4',
    'stages.3-4.subtitle': '珍珠渦流',
    'stages.3-5.title': '蔚藍深海 3-5',
    'stages.3-5.subtitle': '深淵洋流',
    'stages.3-6.title': '蔚藍深海 3-6',
    'stages.3-6.subtitle': '海龍鏡界',
    'stages.4-1.title': '霜幕群峰 4-1',
    'stages.4-1.subtitle': '冰封奔路',
    'stages.4-2.title': '霜幕群峰 4-2',
    'stages.4-2.subtitle': '水晶斜坡',
    'stages.4-3.title': '霜幕群峰 4-3',
    'stages.4-3.subtitle': '霜鏈',
    'stages.4-4.title': '霜幕群峰 4-4',
    'stages.4-4.subtitle': '暴雪升降',
    'stages.4-5.title': '霜幕群峰 4-5',
    'stages.4-5.subtitle': '冰封試煉',
    'stages.4-6.title': '霜幕群峰 4-6',
    'stages.4-6.subtitle': '雪冠決鬥',
    'stages.5-1.title': '燼落火山 5-1',
    'stages.5-1.subtitle': '燼火奔路',
    'stages.5-2.title': '燼落火山 5-2',
    'stages.5-2.subtitle': '熔岩升降',
    'stages.5-3.title': '燼落火山 5-3',
    'stages.5-3.subtitle': '噴發連鎖',
    'stages.5-4.title': '燼落火山 5-4',
    'stages.5-4.subtitle': '火山口橫越',
    'stages.5-5.title': '燼落火山 5-5',
    'stages.5-5.subtitle': '煉獄試煉',
    'stages.5-6.title': '燼落火山 5-6',
    'stages.5-6.subtitle': '燼心決鬥',
    'stages.6-1.title': '深淵魔窟 6-1',
    'stages.6-1.subtitle': '魔窟門檻',
    'stages.6-2.title': '深淵魔窟 6-2',
    'stages.6-2.subtitle': '反轉荊棘',
    'stages.6-3.title': '深淵魔窟 6-3',
    'stages.6-3.subtitle': '深淵輸送',
    'stages.6-4.title': '深淵魔窟 6-4',
    'stages.6-4.subtitle': '惡魔流域',
    'stages.6-5.title': '深淵魔窟 6-5',
    'stages.6-5.subtitle': '最終綜合',
    'stages.6-6.title': '深淵魔窟 6-6',
    'stages.6-6.subtitle': '深淵女王決鬥',
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
    'pause.paused': '暫停',
    'pause.resume': '繼續',
    'pause.restart': '重新開始關卡',
    'pause.stageSelect': '返回選關畫面',
    'pause.aria.menu': '暫停選單',
    'hud.bossPhase': 'Boss 階段',
    'hud.bossPhaseHint': '每次命中後會回到入口，並進入下一段彈幕。',
    'status.initial': '前往出口。',
    'status.checkpoint': '檢查點已同步。',
    'status.restored': '已從檢查點恢復。',
    'status.fall': '高度流失，正在復原。',
    'status.critical': '損傷過重，避免接觸。',
    'status.goal': '已抵達出口。',
    'status.bossPattern': 'Boss 階段 {phase}/{max}，閃避彈幕。',
    'status.bossVulnerable': '攻擊窗口開啟，現在攻擊 Boss。',
    'status.bossDefeated': 'Boss 已擊敗，出口已開啟。',
  },
  ko: {
    'loading.title': '로드 중',
    'loading.phase.boot': '시스템 에셋 준비 중',
    'loading.phase.gameplay': '스테이지 에셋 준비 중',
    'loading.phase.background': '주변 에셋 준비 중',
    'loading.warning': '일부 에셋을 준비하지 못했습니다',
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
    'common.locked': '잠김',
    'touch.pause': '일시 정지',
    'touch.move': '이동',
    'touch.jump': '점프',
    'touch.attack': '공격',
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
    'stageObjectives.stageClear': '스테이지 클리어',
    'stages.1-1.title': '화이트 팰리스 1-1',
    'stages.1-1.subtitle': '첫 번째 문',
    'stages.1-2.title': '화이트 팰리스 1-2',
    'stages.1-2.subtitle': '푸른 안뜰',
    'stages.1-3.title': '화이트 팰리스 1-3',
    'stages.1-3.subtitle': '하늘 테라스',
    'stages.1-4.title': '화이트 팰리스 1-4',
    'stages.1-4.subtitle': '아치 다리',
    'stages.1-5.title': '화이트 팰리스 1-5',
    'stages.1-5.subtitle': '공중 정원',
    'stages.1-6.title': '화이트 팰리스 1-6',
    'stages.1-6.subtitle': '높은 첨탑',
    'stages.2-1.title': '에메랄드 생추어리 2-1',
    'stages.2-1.subtitle': '가시 깨어난 계단',
    'stages.2-2.title': '에메랄드 생추어리 2-2',
    'stages.2-2.subtitle': '덩굴 나룻길',
    'stages.2-3.title': '에메랄드 생추어리 2-3',
    'stages.2-3.subtitle': '가시덤불 질주',
    'stages.2-4.title': '에메랄드 생추어리 2-4',
    'stages.2-4.subtitle': '수관 승강대',
    'stages.2-5.title': '에메랄드 생추어리 2-5',
    'stages.2-5.subtitle': '성역 시련',
    'stages.2-6.title': '에메랄드 생추어리 2-6',
    'stages.2-6.subtitle': '심근 결투',
    'stages.3-1.title': '세룰리안 심해 3-1',
    'stages.3-1.subtitle': '조수 반전',
    'stages.3-2.title': '세룰리안 심해 3-2',
    'stages.3-2.subtitle': '역조 계단',
    'stages.3-3.title': '세룰리안 심해 3-3',
    'stages.3-3.subtitle': '거울 해류',
    'stages.3-4.title': '세룰리안 심해 3-4',
    'stages.3-4.subtitle': '진주 소용돌이',
    'stages.3-5.title': '세룰리안 심해 3-5',
    'stages.3-5.subtitle': '심연 해류',
    'stages.3-6.title': '세룰리안 심해 3-6',
    'stages.3-6.subtitle': '레비아탄 거울',
    'stages.4-1.title': '프로스트베일 봉우리 4-1',
    'stages.4-1.subtitle': '얼음 질주',
    'stages.4-2.title': '프로스트베일 봉우리 4-2',
    'stages.4-2.subtitle': '수정 비탈',
    'stages.4-3.title': '프로스트베일 봉우리 4-3',
    'stages.4-3.subtitle': '서리 연쇄',
    'stages.4-4.title': '프로스트베일 봉우리 4-4',
    'stages.4-4.subtitle': '눈보라 승강대',
    'stages.4-5.title': '프로스트베일 봉우리 4-5',
    'stages.4-5.subtitle': '결빙 시련',
    'stages.4-6.title': '프로스트베일 봉우리 4-6',
    'stages.4-6.subtitle': '설관 결투',
    'stages.5-1.title': '엠버폴 칼데라 5-1',
    'stages.5-1.subtitle': '잿불 질주',
    'stages.5-2.title': '엠버폴 칼데라 5-2',
    'stages.5-2.subtitle': '마그마 승강대',
    'stages.5-3.title': '엠버폴 칼데라 5-3',
    'stages.5-3.subtitle': '분화 연쇄',
    'stages.5-4.title': '엠버폴 칼데라 5-4',
    'stages.5-4.subtitle': '칼데라 횡단',
    'stages.5-5.title': '엠버폴 칼데라 5-5',
    'stages.5-5.subtitle': '연옥 시련',
    'stages.5-6.title': '엠버폴 칼데라 5-6',
    'stages.5-6.subtitle': '불씨 결투',
    'stages.6-1.title': '어비설 할로우 6-1',
    'stages.6-1.subtitle': '공허의 문턱',
    'stages.6-2.title': '어비설 할로우 6-2',
    'stages.6-2.subtitle': '반전 가시',
    'stages.6-3.title': '어비설 할로우 6-3',
    'stages.6-3.subtitle': '심연 컨베이어',
    'stages.6-4.title': '어비설 할로우 6-4',
    'stages.6-4.subtitle': '악마 해류',
    'stages.6-5.title': '어비설 할로우 6-5',
    'stages.6-5.subtitle': '최종 종합',
    'stages.6-6.title': '어비설 할로우 6-6',
    'stages.6-6.subtitle': '심연 여왕 결투',
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
    'pause.paused': '일시 정지',
    'pause.resume': '계속',
    'pause.restart': '스테이지 재시작',
    'pause.stageSelect': '스테이지 선택으로',
    'pause.aria.menu': '일시 정지 메뉴',
    'hud.bossPhase': '보스 페이즈',
    'hud.bossPhaseHint': '한 번 맞힐 때마다 입구에서 다음 패턴이 시작됩니다.',
    'status.initial': '출구로 전진하세요.',
    'status.checkpoint': '체크포인트 동기화 완료.',
    'status.restored': '체크포인트에서 복귀했습니다.',
    'status.fall': '고도를 잃었습니다. 복구 중입니다.',
    'status.critical': '치명적인 피해입니다. 접촉을 피하세요.',
    'status.goal': '출구에 도달했습니다.',
    'status.bossPattern': '보스 페이즈 {phase}/{max}. 탄막을 피하세요.',
    'status.bossVulnerable': '공격 기회가 열렸습니다. 지금 보스를 공격하세요.',
    'status.bossDefeated': '보스 신호를 격파했습니다. 출구가 열렸습니다.',
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
