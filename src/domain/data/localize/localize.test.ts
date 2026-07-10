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

  it('groups title screen localization references', () => {
    expect(localize.references.title).toEqual({
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
          subtitle: '通往惡魔深淵的最終降途。',
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

  it('includes localized title screen UI values for every supported locale', () => {
    const expectedByLocale = {
      en: {
        promptPressAnyButton: 'Press Any Button',
        menuStart: 'Start Game',
        menuSettings: 'Settings',
        menuBack: 'Back',
        controlsSelect: 'Select',
        controlsConfirm: 'Confirm',
        controlsBack: 'Back',
        ariaScreen: 'Project Almost title screen',
        ariaOpenMenu: 'Open title menu',
        ariaMenu: 'Title menu',
      },
      ja: {
        promptPressAnyButton: 'いずれかのボタンを押してください',
        menuStart: 'ゲーム開始',
        menuSettings: '設定',
        menuBack: '戻る',
        controlsSelect: '選択',
        controlsConfirm: '決定',
        controlsBack: '戻る',
        ariaScreen: 'Project Almost タイトル画面',
        ariaOpenMenu: 'タイトルメニューを開く',
        ariaMenu: 'タイトルメニュー',
      },
      zhHant: {
        promptPressAnyButton: '按下任意按鈕',
        menuStart: '開始遊戲',
        menuSettings: '設定',
        menuBack: '返回',
        controlsSelect: '選擇',
        controlsConfirm: '確認',
        controlsBack: '返回',
        ariaScreen: 'Project Almost 標題畫面',
        ariaOpenMenu: '開啟標題選單',
        ariaMenu: '標題選單',
      },
      ko: {
        promptPressAnyButton: '아무 버튼이나 누르세요',
        menuStart: '게임 시작',
        menuSettings: '설정',
        menuBack: '뒤로',
        controlsSelect: '선택',
        controlsConfirm: '확인',
        controlsBack: '뒤로',
        ariaScreen: 'Project Almost 타이틀 화면',
        ariaOpenMenu: '타이틀 메뉴 열기',
        ariaMenu: '타이틀 메뉴',
      },
    }

    const locales = ['en', 'ja', 'zhHant', 'ko'] as const

    for (const locale of locales) {
      expect(resolveLocalizedText(localize, locale, 'title.prompt.pressAnyButton')).toBe(
        expectedByLocale[locale].promptPressAnyButton,
      )
      expect(resolveLocalizedText(localize, locale, 'title.menu.start')).toBe(
        expectedByLocale[locale].menuStart,
      )
      expect(resolveLocalizedText(localize, locale, 'title.menu.settings')).toBe(
        expectedByLocale[locale].menuSettings,
      )
      expect(resolveLocalizedText(localize, locale, 'title.menu.back')).toBe(
        expectedByLocale[locale].menuBack,
      )
      expect(resolveLocalizedText(localize, locale, 'title.controls.select')).toBe(
        expectedByLocale[locale].controlsSelect,
      )
      expect(resolveLocalizedText(localize, locale, 'title.controls.confirm')).toBe(
        expectedByLocale[locale].controlsConfirm,
      )
      expect(resolveLocalizedText(localize, locale, 'title.controls.back')).toBe(
        expectedByLocale[locale].controlsBack,
      )
      expect(resolveLocalizedText(localize, locale, 'title.aria.screen')).toBe(
        expectedByLocale[locale].ariaScreen,
      )
      expect(resolveLocalizedText(localize, locale, 'title.aria.openMenu')).toBe(
        expectedByLocale[locale].ariaOpenMenu,
      )
      expect(resolveLocalizedText(localize, locale, 'title.aria.menu')).toBe(
        expectedByLocale[locale].ariaMenu,
      )
    }
  })

  it('includes localized gameplay pause values for every supported locale', () => {
    const expectedByLocale = {
      en: {
        pausePaused: 'Paused',
        pauseResume: 'Resume',
        pauseRestart: 'Restart Stage',
        pauseStageSelect: 'Return to Stage Select',
        pauseAriaMenu: 'Pause menu',
      },
      ja: {
        pausePaused: 'ポーズ',
        pauseResume: '再開',
        pauseRestart: 'ステージ再開',
        pauseStageSelect: 'ステージ選択へ',
        pauseAriaMenu: 'ポーズメニュー',
      },
      zhHant: {
        pausePaused: '暫停',
        pauseResume: '繼續',
        pauseRestart: '重新開始關卡',
        pauseStageSelect: '返回選關畫面',
        pauseAriaMenu: '暫停選單',
      },
      ko: {
        pausePaused: '일시 정지',
        pauseResume: '계속',
        pauseRestart: '스테이지 재시작',
        pauseStageSelect: '스테이지 선택으로',
        pauseAriaMenu: '일시 정지 메뉴',
      },
    }

    const locales = ['en', 'ja', 'zhHant', 'ko'] as const

    for (const locale of locales) {
      expect(resolveLocalizedText(localize, locale, 'pause.paused')).toBe(
        expectedByLocale[locale].pausePaused,
      )
      expect(resolveLocalizedText(localize, locale, 'pause.resume')).toBe(
        expectedByLocale[locale].pauseResume,
      )
      expect(resolveLocalizedText(localize, locale, 'pause.restart')).toBe(
        expectedByLocale[locale].pauseRestart,
      )
      expect(resolveLocalizedText(localize, locale, 'pause.stageSelect')).toBe(
        expectedByLocale[locale].pauseStageSelect,
      )
      expect(resolveLocalizedText(localize, locale, 'pause.aria.menu')).toBe(
        expectedByLocale[locale].pauseAriaMenu,
      )
    }
  })

  it('includes localized stage select labels and objective values for every supported locale', () => {
    const expectedByLocale = {
      en: {
        title: 'Stage Select',
        objective: 'Objective',
        collectibles: 'Collectibles',
        bestTime: 'Best Time',
        rank: 'Rank',
        activeCharacter: 'Active Character',
        deploy: 'Deploy',
        recordUnavailable: '--',
        reachGoal: 'Reach the goal',
        defeatBoss: 'Defeat the boss',
        stageClear: 'Stage clear',
      },
      ja: {
        title: 'ステージ選択',
        objective: '目標',
        collectibles: '収集',
        bestTime: 'ベストタイム',
        rank: 'ランク',
        activeCharacter: '出撃キャラクター',
        deploy: '出撃',
        recordUnavailable: '--',
        reachGoal: 'ゴールに到達',
        defeatBoss: 'ボスを倒す',
        stageClear: 'ステージクリア',
      },
      zhHant: {
        title: '關卡選擇',
        objective: '目標',
        collectibles: '收集品',
        bestTime: '最佳時間',
        rank: '評級',
        activeCharacter: '出擊角色',
        deploy: '出擊',
        recordUnavailable: '--',
        reachGoal: '抵達終點',
        defeatBoss: '擊敗首領',
        stageClear: '關卡完成',
      },
      ko: {
        title: '스테이지 선택',
        objective: '목표',
        collectibles: '수집품',
        bestTime: '최고 기록',
        rank: '랭크',
        activeCharacter: '출격 캐릭터',
        deploy: '출격',
        recordUnavailable: '--',
        reachGoal: '목표 지점에 도달',
        defeatBoss: '보스 처치',
        stageClear: '스테이지 클리어',
      },
    } as const

    for (const locale of localize.languages.map((language) => language.code)) {
      expect(resolveLocalizedText(localize, locale, 'stageSelect.title')).toBe(expectedByLocale[locale].title)
      expect(resolveLocalizedText(localize, locale, 'stageSelect.objective')).toBe(
        expectedByLocale[locale].objective,
      )
      expect(resolveLocalizedText(localize, locale, 'stageSelect.collectibles')).toBe(
        expectedByLocale[locale].collectibles,
      )
      expect(resolveLocalizedText(localize, locale, 'stageSelect.bestTime')).toBe(
        expectedByLocale[locale].bestTime,
      )
      expect(resolveLocalizedText(localize, locale, 'stageSelect.rank')).toBe(expectedByLocale[locale].rank)
      expect(resolveLocalizedText(localize, locale, 'stageSelect.activeCharacter')).toBe(
        expectedByLocale[locale].activeCharacter,
      )
      expect(resolveLocalizedText(localize, locale, 'stageSelect.deploy')).toBe(expectedByLocale[locale].deploy)
      expect(resolveLocalizedText(localize, locale, 'stageSelect.recordUnavailable')).toBe(
        expectedByLocale[locale].recordUnavailable,
      )
      expect(resolveLocalizedText(localize, locale, 'stageObjectives.reachGoal')).toBe(
        expectedByLocale[locale].reachGoal,
      )
      expect(resolveLocalizedText(localize, locale, 'stageObjectives.defeatBoss')).toBe(
        expectedByLocale[locale].defeatBoss,
      )
      expect(resolveLocalizedText(localize, locale, 'stageObjectives.stageClear')).toBe(
        expectedByLocale[locale].stageClear,
      )
    }
  })

  it('includes localized gameplay boss HUD values for every supported locale', () => {
    const expectedByLocale = {
      en: {
        bossPhase: 'Boss Phase',
        bossPhaseHint: 'Each hit starts the next pattern from the entrance.',
        initial: 'Advance to the exit.',
        checkpoint: 'Checkpoint synchronized.',
        restored: 'Checkpoint restored.',
        fall: 'Altitude lost. Recovering.',
        critical: 'Critical damage. Avoid contact.',
        goal: 'Exit reached.',
        bossPattern: 'Boss phase {phase}/{max}. Evade the barrage.',
        bossVulnerable: 'Attack window open. Strike the Boss now.',
        bossDefeated: 'Boss signal defeated. The exit is open.',
      },
      ja: {
        bossPhase: 'ボスフェーズ',
        bossPhaseHint: '攻撃が当たるたび入口から次のパターンが始まります。',
        initial: '出口へ進んでください。',
        checkpoint: 'チェックポイントを同期しました。',
        restored: 'チェックポイントから復帰しました。',
        fall: '高度を失いました。復帰します。',
        critical: '致命傷です。接触を避けてください。',
        goal: '出口に到達しました。',
        bossPattern: 'ボスフェーズ {phase}/{max}。弾幕を回避してください。',
        bossVulnerable: '攻撃チャンス。今すぐボスを攻撃してください。',
        bossDefeated: 'ボス信号を撃破。出口が開きました。',
      },
      zhHant: {
        bossPhase: 'Boss 階段',
        bossPhaseHint: '每次命中後會回到入口，並進入下一段彈幕。',
        initial: '前往出口。',
        checkpoint: '檢查點已同步。',
        restored: '已從檢查點恢復。',
        fall: '高度流失，正在復原。',
        critical: '損傷過重，避免接觸。',
        goal: '已抵達出口。',
        bossPattern: 'Boss 階段 {phase}/{max}，閃避彈幕。',
        bossVulnerable: '攻擊窗口開啟，現在攻擊 Boss。',
        bossDefeated: 'Boss 已擊敗，出口已開啟。',
      },
      ko: {
        bossPhase: '보스 페이즈',
        bossPhaseHint: '한 번 맞힐 때마다 입구에서 다음 패턴이 시작됩니다.',
        initial: '출구로 전진하세요.',
        checkpoint: '체크포인트 동기화 완료.',
        restored: '체크포인트에서 복귀했습니다.',
        fall: '고도를 잃었습니다. 복구 중입니다.',
        critical: '치명적인 피해입니다. 접촉을 피하세요.',
        goal: '출구에 도달했습니다.',
        bossPattern: '보스 페이즈 {phase}/{max}. 탄막을 피하세요.',
        bossVulnerable: '공격 기회가 열렸습니다. 지금 보스를 공격하세요.',
        bossDefeated: '보스 신호를 격파했습니다. 출구가 열렸습니다.',
      },
    } as const

    for (const locale of localize.languages.map((language) => language.code)) {
      expect(resolveLocalizedText(localize, locale, 'hud.bossPhase')).toBe(
        expectedByLocale[locale].bossPhase,
      )
      expect(resolveLocalizedText(localize, locale, 'hud.bossPhaseHint')).toBe(
        expectedByLocale[locale].bossPhaseHint,
      )
      expect(resolveLocalizedText(localize, locale, 'status.initial')).toBe(
        expectedByLocale[locale].initial,
      )
      expect(resolveLocalizedText(localize, locale, 'status.checkpoint')).toBe(
        expectedByLocale[locale].checkpoint,
      )
      expect(resolveLocalizedText(localize, locale, 'status.restored')).toBe(
        expectedByLocale[locale].restored,
      )
      expect(resolveLocalizedText(localize, locale, 'status.fall')).toBe(
        expectedByLocale[locale].fall,
      )
      expect(resolveLocalizedText(localize, locale, 'status.critical')).toBe(
        expectedByLocale[locale].critical,
      )
      expect(resolveLocalizedText(localize, locale, 'status.goal')).toBe(
        expectedByLocale[locale].goal,
      )
      expect(resolveLocalizedText(localize, locale, 'status.bossPattern')).toBe(
        expectedByLocale[locale].bossPattern,
      )
      expect(resolveLocalizedText(localize, locale, 'status.bossVulnerable')).toBe(
        expectedByLocale[locale].bossVulnerable,
      )
      expect(resolveLocalizedText(localize, locale, 'status.bossDefeated')).toBe(
        expectedByLocale[locale].bossDefeated,
      )
    }
  })

  it('includes localized settings, common, and language values for every supported locale', () => {
    const expectedByLocale = {
      en: {
        systemMenu: 'System Menu',
        title: 'Settings',
        masterVolume: 'Master Volume',
        musicVolume: 'Music Volume',
        sfxVolume: 'SFX Volume',
        language: 'Language',
        fullscreen: 'Fullscreen',
        screenShake: 'Screen Shake',
        vibration: 'Controller Vibration',
        reset: 'Reset to Default',
        deleteSave: 'Delete Save Data',
        deleteTitle: 'Delete Save Data?',
        deleteBody: 'All stage clears, unlocks, records, and best ranks will be permanently deleted.',
        select: 'Select',
        adjust: 'Adjust',
        on: 'On',
        off: 'Off',
        cancel: 'Cancel',
        delete: 'Delete',
        warning: 'Warning',
        english: 'English',
      },
      ja: {
        systemMenu: 'システムメニュー',
        title: '設定',
        masterVolume: 'マスター音量',
        musicVolume: '音楽音量',
        sfxVolume: '効果音音量',
        language: '言語',
        fullscreen: 'フルスクリーン',
        screenShake: '画面振動',
        vibration: 'コントローラー振動',
        reset: '初期設定に戻す',
        deleteSave: 'セーブデータ削除',
        deleteTitle: 'セーブデータを削除しますか？',
        deleteBody: 'ステージクリア、解放、記録、最高ランクがすべて削除されます。',
        select: '選択',
        adjust: '調整',
        on: 'オン',
        off: 'オフ',
        cancel: 'キャンセル',
        delete: '削除',
        warning: '警告',
        english: '英語',
      },
      zhHant: {
        systemMenu: '系統選單',
        title: '設定',
        masterVolume: '主音量',
        musicVolume: '音樂音量',
        sfxVolume: '音效音量',
        language: '語言',
        fullscreen: '全螢幕',
        screenShake: '畫面震動',
        vibration: '控制器震動',
        reset: '恢復預設值',
        deleteSave: '刪除存檔',
        deleteTitle: '刪除存檔？',
        deleteBody: '所有過關、解鎖、紀錄與最佳評價都將永久刪除。',
        select: '選擇',
        adjust: '調整',
        on: '開啟',
        off: '關閉',
        cancel: '取消',
        delete: '刪除',
        warning: '警告',
        english: '英文',
      },
      ko: {
        systemMenu: '시스템 메뉴',
        title: '설정',
        masterVolume: '전체 음량',
        musicVolume: '음악 음량',
        sfxVolume: '효과음 음량',
        language: '언어',
        fullscreen: '전체 화면',
        screenShake: '화면 흔들림',
        vibration: '컨트롤러 진동',
        reset: '기본값 복원',
        deleteSave: '저장 데이터 삭제',
        deleteTitle: '저장 데이터를 삭제할까요?',
        deleteBody: '모든 클리어, 해금, 기록 및 최고 랭크가 영구 삭제됩니다.',
        select: '선택',
        adjust: '조정',
        on: '켜기',
        off: '끄기',
        cancel: '취소',
        delete: '삭제',
        warning: '경고',
        english: '영어',
      },
    }

    const locales = ['en', 'ja', 'zhHant', 'ko'] as const

    for (const locale of locales) {
      expect(resolveLocalizedText(localize, locale, 'settings.systemMenu')).toBe(
        expectedByLocale[locale].systemMenu,
      )
      expect(resolveLocalizedText(localize, locale, 'settings.title')).toBe(expectedByLocale[locale].title)
      expect(resolveLocalizedText(localize, locale, 'settings.masterVolume')).toBe(
        expectedByLocale[locale].masterVolume,
      )
      expect(resolveLocalizedText(localize, locale, 'settings.musicVolume')).toBe(
        expectedByLocale[locale].musicVolume,
      )
      expect(resolveLocalizedText(localize, locale, 'settings.sfxVolume')).toBe(
        expectedByLocale[locale].sfxVolume,
      )
      expect(resolveLocalizedText(localize, locale, 'settings.language')).toBe(
        expectedByLocale[locale].language,
      )
      expect(resolveLocalizedText(localize, locale, 'settings.fullscreen')).toBe(
        expectedByLocale[locale].fullscreen,
      )
      expect(resolveLocalizedText(localize, locale, 'settings.screenShake')).toBe(
        expectedByLocale[locale].screenShake,
      )
      expect(resolveLocalizedText(localize, locale, 'settings.vibration')).toBe(
        expectedByLocale[locale].vibration,
      )
      expect(resolveLocalizedText(localize, locale, 'settings.reset')).toBe(expectedByLocale[locale].reset)
      expect(resolveLocalizedText(localize, locale, 'settings.deleteSave')).toBe(
        expectedByLocale[locale].deleteSave,
      )
      expect(resolveLocalizedText(localize, locale, 'settings.deleteTitle')).toBe(
        expectedByLocale[locale].deleteTitle,
      )
      expect(resolveLocalizedText(localize, locale, 'settings.deleteBody')).toBe(
        expectedByLocale[locale].deleteBody,
      )
      expect(resolveLocalizedText(localize, locale, 'common.select')).toBe(expectedByLocale[locale].select)
      expect(resolveLocalizedText(localize, locale, 'common.adjust')).toBe(expectedByLocale[locale].adjust)
      expect(resolveLocalizedText(localize, locale, 'common.on')).toBe(expectedByLocale[locale].on)
      expect(resolveLocalizedText(localize, locale, 'common.off')).toBe(expectedByLocale[locale].off)
      expect(resolveLocalizedText(localize, locale, 'common.cancel')).toBe(expectedByLocale[locale].cancel)
      expect(resolveLocalizedText(localize, locale, 'common.delete')).toBe(expectedByLocale[locale].delete)
      expect(resolveLocalizedText(localize, locale, 'common.warning')).toBe(expectedByLocale[locale].warning)
      expect(resolveLocalizedText(localize, locale, 'language.en')).toBe(expectedByLocale[locale].english)
    }
  })

  it('includes localized locked copy for every supported locale', () => {
    expect(resolveLocalizedText(localize, 'en', 'common.locked')).toBe('Locked')
    expect(resolveLocalizedText(localize, 'ja', 'common.locked')).toBe('ロック中')
    expect(resolveLocalizedText(localize, 'zhHant', 'common.locked')).toBe('未解鎖')
    expect(resolveLocalizedText(localize, 'ko', 'common.locked')).toBe('잠김')
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

describe('prototype stage subtitle copy', () => {
  it('keeps Stage Select subtitles aligned with the prototype localization catalog', () => {
    const expectedByLocale = {
      en: {
        'stages.1-1.subtitle': 'The First Gate',
        'stages.1-6.subtitle': 'The High Spire',
        'stages.6-6.subtitle': 'Abyss Queen Duel',
      },
      ja: {
        'stages.1-1.subtitle': '最初の門',
        'stages.1-6.subtitle': '高き尖塔',
        'stages.6-6.subtitle': '深淵女王の決闘',
      },
      zhHant: {
        'stages.1-1.subtitle': '最初之門',
        'stages.1-6.subtitle': '高塔',
        'stages.6-6.subtitle': '深淵女王決鬥',
      },
      ko: {
        'stages.1-1.subtitle': '첫 번째 문',
        'stages.1-6.subtitle': '높은 첨탑',
        'stages.6-6.subtitle': '심연 여왕 결투',
      },
    } as const

    for (const locale of localize.languages.map((language) => language.code)) {
      for (const [key, expectedText] of Object.entries(expectedByLocale[locale])) {
        expect(resolveLocalizedText(localize, locale, key as LocalizationKey)).toBe(expectedText)
      }
    }
  })
})
