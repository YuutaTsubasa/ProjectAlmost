import { derived, writable } from 'svelte/store'

export const locales = ['en', 'ja', 'zh-TW', 'ko'] as const
export type Locale = (typeof locales)[number]
export type TranslationParams = Record<string, string | number>

const en = {
  'language.en': 'English', 'language.ja': 'Japanese', 'language.zh-TW': 'Traditional Chinese', 'language.ko': 'Korean',
  'common.select': 'Select', 'common.confirm': 'Confirm', 'common.adjust': 'Adjust', 'common.back': 'Back', 'common.locked': 'Locked',
  'common.on': 'On', 'common.off': 'Off', 'common.cancel': 'Cancel', 'common.delete': 'Delete', 'common.warning': 'Warning',
  'title.start': 'Start Game', 'title.settings': 'Settings', 'title.pressAny': 'Press Any Button',
  'worldSelect.title': 'World Select', 'worldSelect.progress': 'Stage Progress', 'worldSelect.enter': 'Enter World',
  'world.1.name': 'White Palace', 'world.1.subtitle': 'A radiant kingdom above the clouds.',
  'world.2.name': 'Emerald Sanctuary', 'world.2.subtitle': 'Ancient ruins reclaimed by the living forest.',
  'world.3.name': 'Cerulean Depths', 'world.3.subtitle': 'A drowned realm beneath the endless tide.',
  'world.4.name': 'Frostveil Peaks', 'world.4.subtitle': 'Frozen fortresses beyond the mountain storm.',
  'world.5.name': 'Emberfall Caldera', 'world.5.subtitle': 'A shattered forge at the heart of the volcano.',
  'world.6.name': 'Abyssal Hollow', 'world.6.subtitle': 'The final descent into the demonic abyss.',
  'stageSelect.title': 'Stage Select', 'stageSelect.objective': 'Objective', 'stageSelect.collectibles': 'Collectibles',
  'stageSelect.bestTime': 'Best Time', 'stageSelect.rank': 'Rank', 'stageSelect.activeCharacter': 'Active Character', 'stageSelect.deploy': 'Deploy',
  'stage.1-1.subtitle': 'The First Gate', 'stage.1-2.subtitle': 'Azure Courtyard', 'stage.1-3.subtitle': 'Sky Terrace',
  'stage.1-4.subtitle': 'The Arch Bridge', 'stage.1-5.subtitle': 'Hanging Garden', 'stage.1-6.subtitle': 'The High Spire',
  'stage.objective.reachGoal': 'Reach the Goal', 'stage.objective.defeatBoss': 'Defeat the Boss',
  'settings.systemMenu': 'System Menu', 'settings.title': 'Settings', 'settings.masterVolume': 'Master Volume',
  'settings.musicVolume': 'Music Volume', 'settings.sfxVolume': 'SFX Volume', 'settings.language': 'Language',
  'settings.fullscreen': 'Fullscreen', 'settings.screenShake': 'Screen Shake', 'settings.vibration': 'Controller Vibration',
  'settings.reset': 'Reset to Default', 'settings.deleteSave': 'Delete Save Data', 'settings.decrease': 'Decrease {item}', 'settings.increase': 'Increase {item}',
  'settings.deleteTitle': 'Delete Save Data?', 'settings.deleteBody': 'All stage clears, unlocks, records, and best ranks will be permanently deleted.',
  'hud.systemStatus': 'System Status', 'hud.mapOverview': 'Map Overview', 'hud.objective': 'Objective', 'hud.controls': 'Controls',
  'hud.move': 'Move', 'hud.jump': 'Jump', 'hud.crouch': 'Crouch', 'hud.attack': 'Attack', 'hud.homing': 'Homing', 'hud.navigator': 'Palace Navigator',
  'hud.time': 'Time', 'hud.coins': 'Coins', 'hud.damage': 'Damage', 'hud.falls': 'Falls', 'hud.enemies': 'Enemies',
  'hud.checkpoints': 'Checkpoints', 'hud.rank': 'Rank',
  'pause.paused': 'Paused', 'pause.resume': 'Resume', 'pause.restart': 'Restart Stage', 'pause.stageSelect': 'Return to Stage Select',
  'result.title': 'Stage Clear', 'result.clearTime': 'Clear Time', 'result.newRecord': 'New Record', 'result.perfect': 'Perfect',
  'result.damageTaken': 'Damage Taken', 'result.enemiesDefeated': 'Enemies Defeated', 'result.finalEvaluation': 'Final Evaluation',
  'result.retry': 'Retry', 'result.stageSelect': 'Stage Select', 'result.nextStage': 'Next Stage', 'result.paladin': 'Paladin',
  'touch.pause': 'Pause', 'touch.move': 'Move', 'touch.jump': 'Jump', 'touch.attack': 'Attack',
  'boot.initializing': 'Initializing White Palace',
  'status.initial': 'Path confirmed. Proceed to the first gate.', 'status.azureDetected': 'Azure Core signals detected. Chain Homing Attacks to cross the courtyard.',
  'status.hurt': 'Armor integrity reduced. HP {hp}/{max}.', 'status.stabilized': 'Armor stabilized. Continue toward the gate.',
  'status.enemyCleared': 'Hostile signal cleared. Route to the gate is open.', 'status.coreRegenerated': 'Azure Core signal regenerated. Homing route restored.',
  'status.checkpoint': 'Checkpoint synchronized. Restoration point updated.', 'status.restored': 'Systems restored. Recommencing mission.',
  'status.fall': 'Route lost. Restoring from checkpoint.', 'status.critical': 'Critical damage. Restoring from checkpoint.',
  'status.goal': 'Gate reached. {coins}  {time}', 'status.homingHit': 'Homing strike confirmed. Continue toward the gate.',
  'status.homingMiss': 'No target contact. Resume course.',
  'status.bossPattern': 'Boss phase {phase}/{max}. Evade the barrage.', 'status.bossVulnerable': 'Attack window open. Strike the Boss now.',
  'status.bossDefeated': 'Boss signal defeated. The exit is open.',
  'avg.skip': 'Skip', 'avg.speaker.yuuta': 'Yuuta Tsubasa', 'avg.speaker.whitePriestess': 'White Priestess',
  'avg.1-6.line1': 'So, you are the one who reached the High Spire.',
  'avg.1-6.line2': 'If you are this palace’s guardian, please stand aside.',
  'avg.1-6.line3': 'I cannot. The palace light no longer recognizes those who return.',
  'avg.1-6.line4': 'Then I will prove I can pass through, in my own way.',
  'avg.1-6.line5': 'Very well. Cross my celestial rings, and show me your resolve.',
  'avg.1-6.line6': 'I will reach the exit behind you.',
} as const

type TranslationKey = keyof typeof en
type Dictionary = Record<TranslationKey, string>

const ja: Dictionary = {
  ...en,
  'language.en': '英語', 'language.ja': '日本語', 'language.zh-TW': '繁体字中国語', 'language.ko': '韓国語',
  'common.select': '選択', 'common.confirm': '決定', 'common.adjust': '調整', 'common.back': '戻る', 'common.locked': 'ロック',
  'common.on': 'オン', 'common.off': 'オフ', 'common.cancel': 'キャンセル', 'common.delete': '削除', 'common.warning': '警告',
  'title.start': 'ゲーム開始', 'title.settings': '設定', 'title.pressAny': 'いずれかのボタンを押してください',
  'worldSelect.title': 'ワールド選択', 'worldSelect.progress': 'ステージ進行度', 'worldSelect.enter': 'ワールドへ',
  'world.1.name': 'ホワイトパレス', 'world.1.subtitle': '雲海に輝く天空の王国。',
  'world.2.name': 'エメラルド・サンクチュアリ', 'world.2.subtitle': '生命の森に覆われた古代遺跡。',
  'world.3.name': 'セルリアン・デプス', 'world.3.subtitle': '果てなき潮の底に沈む王国。',
  'world.4.name': 'フロストヴェイル・ピークス', 'world.4.subtitle': '吹雪の彼方にそびえる氷の要塞。',
  'world.5.name': 'エンバーフォール・カルデラ', 'world.5.subtitle': '火山の中心に眠る崩壊した炉。',
  'world.6.name': 'アビサル・ホロウ', 'world.6.subtitle': '悪魔の深淵へ続く最後の降下。',
  'stageSelect.title': 'ステージ選択', 'stageSelect.objective': '目標', 'stageSelect.collectibles': '収集物', 'stageSelect.bestTime': 'ベストタイム',
  'stageSelect.rank': 'ランク', 'stageSelect.activeCharacter': '使用キャラクター', 'stageSelect.deploy': '出撃',
  'stage.1-1.subtitle': '最初の門', 'stage.1-2.subtitle': '蒼の中庭', 'stage.1-3.subtitle': '空中テラス', 'stage.1-4.subtitle': '大アーチ橋',
  'stage.1-5.subtitle': '空中庭園', 'stage.1-6.subtitle': '高き尖塔', 'stage.objective.reachGoal': 'ゴールへ到達', 'stage.objective.defeatBoss': 'ボスを倒す',
  'settings.systemMenu': 'システムメニュー', 'settings.title': '設定', 'settings.masterVolume': 'マスター音量', 'settings.musicVolume': '音楽音量',
  'settings.sfxVolume': '効果音音量', 'settings.language': '言語', 'settings.fullscreen': 'フルスクリーン', 'settings.screenShake': '画面振動',
  'settings.vibration': 'コントローラー振動', 'settings.reset': '初期設定に戻す', 'settings.deleteSave': 'セーブデータ削除',
  'settings.decrease': '{item}を下げる', 'settings.increase': '{item}を上げる', 'settings.deleteTitle': 'セーブデータを削除しますか？',
  'settings.deleteBody': 'ステージクリア、解放、記録、最高ランクがすべて削除されます。',
  'hud.systemStatus': 'システム状態', 'hud.mapOverview': 'マップ', 'hud.objective': '目標', 'hud.controls': '操作', 'hud.move': '移動',
  'hud.jump': 'ジャンプ', 'hud.crouch': 'しゃがむ', 'hud.attack': '攻撃', 'hud.homing': 'ホーミング', 'hud.navigator': '宮殿ナビゲーター', 'hud.time': 'タイム',
  'hud.coins': 'コイン', 'hud.damage': 'ダメージ', 'hud.falls': '落下', 'hud.enemies': '敵', 'hud.checkpoints': 'チェックポイント', 'hud.rank': 'ランク',
  'pause.paused': 'ポーズ', 'pause.resume': '再開', 'pause.restart': 'ステージ再開', 'pause.stageSelect': 'ステージ選択へ',
  'result.title': 'ステージクリア', 'result.clearTime': 'クリアタイム', 'result.newRecord': '新記録', 'result.perfect': 'パーフェクト',
  'result.damageTaken': '被ダメージ', 'result.enemiesDefeated': '撃破した敵', 'result.finalEvaluation': '最終評価', 'result.retry': 'リトライ',
  'result.stageSelect': 'ステージ選択', 'result.nextStage': '次のステージ', 'result.paladin': 'パラディン',
  'touch.pause': 'ポーズ', 'touch.move': '移動', 'touch.jump': 'ジャンプ', 'touch.attack': '攻撃', 'boot.initializing': 'ホワイトパレスを初期化中',
  'status.initial': '進路確認。最初の門へ進んでください。', 'status.azureDetected': 'Azure Core信号を検出。ホーミング攻撃を連鎖してください。',
  'status.hurt': '装甲耐久低下。HP {hp}/{max}。', 'status.stabilized': '装甲安定。門へ進んでください。', 'status.enemyCleared': '敵性信号消失。進路確保。',
  'status.coreRegenerated': 'Azure Coreが再生。ホーミング経路が復旧しました。', 'status.checkpoint': 'チェックポイント同期完了。',
  'status.restored': 'システム復旧。任務を再開します。', 'status.fall': '進路喪失。チェックポイントから復旧します。',
  'status.critical': '致命的損傷。チェックポイントから復旧します。', 'status.goal': '門へ到達。{coins}  {time}',
  'status.homingHit': 'ホーミング攻撃成功。門へ進んでください。', 'status.homingMiss': 'ターゲット未接触。進路へ戻ってください。',
  'status.bossPattern': 'ボスフェーズ {phase}/{max}。弾幕を回避してください。', 'status.bossVulnerable': '攻撃チャンス。今すぐボスを攻撃してください。',
  'status.bossDefeated': 'ボスを撃破。出口が開きました。',
  'avg.skip': 'スキップ', 'avg.speaker.yuuta': 'ユウタ・ツバサ', 'avg.speaker.whitePriestess': '白の祭司',
  'avg.1-6.line1': '高き尖塔へ辿り着いたのは、あなたなのですね。',
  'avg.1-6.line2': 'この宮殿の守護者なら、道を開けてください。',
  'avg.1-6.line3': 'できません。宮殿の光は、帰還者を見分けられなくなりました。',
  'avg.1-6.line4': 'ならば、自分のやり方で通れることを証明します。',
  'avg.1-6.line5': 'よいでしょう。私の星環を越え、その決意を示してください。',
  'avg.1-6.line6': 'あなたの背後にある出口へ、必ず辿り着きます。',
}

const zhTW: Dictionary = {
  ...en,
  'language.en': '英文', 'language.ja': '日文', 'language.zh-TW': '繁體中文', 'language.ko': '韓文',
  'common.select': '選擇', 'common.confirm': '確認', 'common.adjust': '調整', 'common.back': '返回', 'common.locked': '未解鎖',
  'common.on': '開啟', 'common.off': '關閉', 'common.cancel': '取消', 'common.delete': '刪除', 'common.warning': '警告',
  'title.start': '開始遊戲', 'title.settings': '設定', 'title.pressAny': '按下任意按鍵',
  'worldSelect.title': '選擇世界', 'worldSelect.progress': '關卡進度', 'worldSelect.enter': '進入世界',
  'world.1.name': '白色宮殿', 'world.1.subtitle': '高踞雲海之上的光輝王國。',
  'world.2.name': '翡翠聖林', 'world.2.subtitle': '被生命森林重新覆蓋的古老遺跡。',
  'world.3.name': '蔚藍深海', 'world.3.subtitle': '沉沒於無盡潮汐之下的國度。',
  'world.4.name': '霜幕群峰', 'world.4.subtitle': '暴風雪彼端的冰封要塞。',
  'world.5.name': '燼落火山', 'world.5.subtitle': '位於火山核心的破碎鍛造場。',
  'world.6.name': '深淵魔窟', 'world.6.subtitle': '通往惡魔深淵的最終降途。',
  'stageSelect.title': '選擇關卡', 'stageSelect.objective': '目標', 'stageSelect.collectibles': '收集品', 'stageSelect.bestTime': '最佳時間',
  'stageSelect.rank': '評價', 'stageSelect.activeCharacter': '出戰角色', 'stageSelect.deploy': '出戰',
  'stage.1-1.subtitle': '最初之門', 'stage.1-2.subtitle': '蒼藍中庭', 'stage.1-3.subtitle': '天空露台', 'stage.1-4.subtitle': '拱橋',
  'stage.1-5.subtitle': '空中花園', 'stage.1-6.subtitle': '高塔', 'stage.objective.reachGoal': '抵達終點', 'stage.objective.defeatBoss': '擊敗 Boss',
  'settings.systemMenu': '系統選單', 'settings.title': '設定', 'settings.masterVolume': '主音量', 'settings.musicVolume': '音樂音量',
  'settings.sfxVolume': '音效音量', 'settings.language': '語言', 'settings.fullscreen': '全螢幕', 'settings.screenShake': '畫面震動',
  'settings.vibration': '控制器震動', 'settings.reset': '恢復預設值', 'settings.deleteSave': '刪除存檔',
  'settings.decrease': '降低{item}', 'settings.increase': '提高{item}', 'settings.deleteTitle': '刪除存檔？',
  'settings.deleteBody': '所有過關、解鎖、紀錄與最佳評價都將永久刪除。',
  'hud.systemStatus': '系統狀態', 'hud.mapOverview': '地圖', 'hud.objective': '目標', 'hud.controls': '操作', 'hud.move': '移動',
  'hud.jump': '跳躍', 'hud.crouch': '蹲下', 'hud.attack': '攻擊', 'hud.homing': '追蹤攻擊', 'hud.navigator': '宮殿導航 AI', 'hud.time': '時間',
  'hud.coins': '金幣', 'hud.damage': '受傷', 'hud.falls': '墜落', 'hud.enemies': '敵人', 'hud.checkpoints': '記錄點', 'hud.rank': '評價',
  'pause.paused': '暫停', 'pause.resume': '繼續', 'pause.restart': '重新開始關卡', 'pause.stageSelect': '返回選關畫面',
  'result.title': '關卡完成', 'result.clearTime': '完成時間', 'result.newRecord': '新紀錄', 'result.perfect': '完美',
  'result.damageTaken': '受到傷害', 'result.enemiesDefeated': '擊倒敵人', 'result.finalEvaluation': '最終評價', 'result.retry': '重試',
  'result.stageSelect': '選擇關卡', 'result.nextStage': '下一關', 'result.paladin': '聖騎士',
  'touch.pause': '暫停', 'touch.move': '移動', 'touch.jump': '跳躍', 'touch.attack': '攻擊', 'boot.initializing': '正在初始化白色宮殿',
  'status.initial': '路徑確認，前往最初之門。', 'status.azureDetected': '偵測到 Azure Core，連續使用追蹤攻擊穿越中庭。',
  'status.hurt': '裝甲完整度下降。HP {hp}/{max}。', 'status.stabilized': '裝甲已穩定，繼續前往大門。', 'status.enemyCleared': '敵對訊號已清除，路徑開放。',
  'status.coreRegenerated': 'Azure Core 已重新凝聚，追蹤路徑恢復。', 'status.checkpoint': '記錄點同步完成，重生位置已更新。',
  'status.restored': '系統恢復，重新開始任務。', 'status.fall': '偏離路徑，正在從記錄點恢復。', 'status.critical': '受到致命傷害，正在從記錄點恢復。',
  'status.goal': '已抵達大門。{coins}  {time}', 'status.homingHit': '追蹤攻擊命中，繼續前往大門。', 'status.homingMiss': '未命中目標，繼續前進。',
  'status.bossPattern': 'Boss 階段 {phase}/{max}，閃避彈幕。', 'status.bossVulnerable': '攻擊窗口開啟，現在攻擊 Boss。',
  'status.bossDefeated': 'Boss 已擊敗，出口已開啟。',
  'avg.skip': '跳過', 'avg.speaker.yuuta': 'Yuuta Tsubasa', 'avg.speaker.whitePriestess': '白之祭司',
  'avg.1-6.line1': '所以，抵達高塔的人是你。',
  'avg.1-6.line2': '如果你是守護這座宮殿的人，請讓開。',
  'avg.1-6.line3': '我不能。宮殿的光，早已不再辨認誰是歸來者。',
  'avg.1-6.line4': '那我就用自己的方式，證明我能通過。',
  'avg.1-6.line5': '很好。穿過我的星環，讓我看看你的決意。',
  'avg.1-6.line6': '我會抵達你身後的出口。',
}

const ko: Dictionary = {
  ...en,
  'language.en': '영어', 'language.ja': '일본어', 'language.zh-TW': '번체 중국어', 'language.ko': '한국어',
  'common.select': '선택', 'common.confirm': '확인', 'common.adjust': '조정', 'common.back': '뒤로', 'common.locked': '잠김',
  'common.on': '켜기', 'common.off': '끄기', 'common.cancel': '취소', 'common.delete': '삭제', 'common.warning': '경고',
  'title.start': '게임 시작', 'title.settings': '설정', 'title.pressAny': '아무 버튼이나 누르세요',
  'worldSelect.title': '월드 선택', 'worldSelect.progress': '스테이지 진행도', 'worldSelect.enter': '월드 입장',
  'world.1.name': '화이트 팰리스', 'world.1.subtitle': '구름 위에서 빛나는 하늘의 왕국.',
  'world.2.name': '에메랄드 생추어리', 'world.2.subtitle': '살아 있는 숲이 되찾은 고대 유적.',
  'world.3.name': '세룰리안 심해', 'world.3.subtitle': '끝없는 조류 아래 가라앉은 왕국.',
  'world.4.name': '프로스트베일 봉우리', 'world.4.subtitle': '눈보라 너머의 얼어붙은 요새.',
  'world.5.name': '엠버폴 칼데라', 'world.5.subtitle': '화산 중심부에 부서진 대장간.',
  'world.6.name': '어비설 할로우', 'world.6.subtitle': '악마의 심연으로 향하는 마지막 하강.',
  'stageSelect.title': '스테이지 선택', 'stageSelect.objective': '목표', 'stageSelect.collectibles': '수집품', 'stageSelect.bestTime': '최고 기록',
  'stageSelect.rank': '랭크', 'stageSelect.activeCharacter': '출전 캐릭터', 'stageSelect.deploy': '출전',
  'stage.1-1.subtitle': '첫 번째 문', 'stage.1-2.subtitle': '푸른 안뜰', 'stage.1-3.subtitle': '하늘 테라스', 'stage.1-4.subtitle': '아치 다리',
  'stage.1-5.subtitle': '공중 정원', 'stage.1-6.subtitle': '높은 첨탑', 'stage.objective.reachGoal': '목표 지점에 도달', 'stage.objective.defeatBoss': '보스 처치',
  'settings.systemMenu': '시스템 메뉴', 'settings.title': '설정', 'settings.masterVolume': '전체 음량', 'settings.musicVolume': '음악 음량',
  'settings.sfxVolume': '효과음 음량', 'settings.language': '언어', 'settings.fullscreen': '전체 화면', 'settings.screenShake': '화면 흔들림',
  'settings.vibration': '컨트롤러 진동', 'settings.reset': '기본값 복원', 'settings.deleteSave': '저장 데이터 삭제',
  'settings.decrease': '{item} 낮추기', 'settings.increase': '{item} 높이기', 'settings.deleteTitle': '저장 데이터를 삭제할까요?',
  'settings.deleteBody': '모든 클리어, 해금, 기록 및 최고 랭크가 영구 삭제됩니다.',
  'hud.systemStatus': '시스템 상태', 'hud.mapOverview': '지도', 'hud.objective': '목표', 'hud.controls': '조작', 'hud.move': '이동',
  'hud.jump': '점프', 'hud.crouch': '앉기', 'hud.attack': '공격', 'hud.homing': '호밍', 'hud.navigator': '궁전 내비게이터', 'hud.time': '시간',
  'hud.coins': '코인', 'hud.damage': '피해', 'hud.falls': '낙하', 'hud.enemies': '적', 'hud.checkpoints': '체크포인트', 'hud.rank': '랭크',
  'pause.paused': '일시 정지', 'pause.resume': '계속', 'pause.restart': '스테이지 재시작', 'pause.stageSelect': '스테이지 선택으로',
  'result.title': '스테이지 클리어', 'result.clearTime': '클리어 시간', 'result.newRecord': '신기록', 'result.perfect': '완벽',
  'result.damageTaken': '받은 피해', 'result.enemiesDefeated': '처치한 적', 'result.finalEvaluation': '최종 평가', 'result.retry': '재도전',
  'result.stageSelect': '스테이지 선택', 'result.nextStage': '다음 스테이지', 'result.paladin': '팔라딘',
  'touch.pause': '일시 정지', 'touch.move': '이동', 'touch.jump': '점프', 'touch.attack': '공격', 'boot.initializing': '화이트 팰리스 초기화 중',
  'status.initial': '경로 확인. 첫 번째 문으로 이동하세요.', 'status.azureDetected': 'Azure Core 신호 감지. 호밍 공격을 연계하세요.',
  'status.hurt': '장갑 내구도 감소. HP {hp}/{max}.', 'status.stabilized': '장갑 안정화. 문으로 이동하세요.', 'status.enemyCleared': '적대 신호 제거. 경로가 열렸습니다.',
  'status.coreRegenerated': 'Azure Core 재생 완료. 호밍 경로가 복구되었습니다.', 'status.checkpoint': '체크포인트 동기화 완료.',
  'status.restored': '시스템 복구. 임무를 재개합니다.', 'status.fall': '경로 이탈. 체크포인트에서 복구합니다.', 'status.critical': '치명적 피해. 체크포인트에서 복구합니다.',
  'status.goal': '문에 도달했습니다. {coins}  {time}', 'status.homingHit': '호밍 공격 성공. 문으로 이동하세요.', 'status.homingMiss': '대상 접촉 실패. 경로로 복귀하세요.',
  'status.bossPattern': '보스 페이즈 {phase}/{max}. 탄막을 피하세요.', 'status.bossVulnerable': '공격 기회가 열렸습니다. 지금 보스를 공격하세요.',
  'status.bossDefeated': '보스를 처치했습니다. 출구가 열렸습니다.',
  'avg.skip': '건너뛰기', 'avg.speaker.yuuta': '유우타 츠바사', 'avg.speaker.whitePriestess': '백의 사제',
  'avg.1-6.line1': '높은 첨탑에 도달한 자가 바로 당신이군요.',
  'avg.1-6.line2': '이 궁전의 수호자라면 길을 비켜 주세요.',
  'avg.1-6.line3': '그럴 수 없습니다. 궁전의 빛은 이제 귀환자를 구별하지 못합니다.',
  'avg.1-6.line4': '그렇다면 제 방식으로 통과할 수 있음을 증명하겠습니다.',
  'avg.1-6.line5': '좋습니다. 제 성환을 넘어 당신의 결의를 보여 주세요.',
  'avg.1-6.line6': '당신 뒤의 출구까지 반드시 도달하겠습니다.',
}

const dictionaries: Record<Locale, Dictionary> = { en, ja, 'zh-TW': zhTW, ko }

export const locale = writable<Locale>('en')
export const translator = derived(locale, ($locale) => (key: TranslationKey, params: TranslationParams = {}) => {
  const template = dictionaries[$locale][key] ?? en[key] ?? key
  return Object.entries(params).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, String(value)), template)
})

export function normalizeLocale(value: unknown): Locale {
  return locales.includes(value as Locale) ? value as Locale : 'en'
}

export function setLocale(next: unknown): Locale {
  const normalized = normalizeLocale(next)
  locale.set(normalized)
  if (typeof document !== 'undefined') document.documentElement.lang = normalized
  return normalized
}

export function nextLocale(current: Locale, direction: number): Locale {
  const index = locales.indexOf(normalizeLocale(current))
  return locales[(index + direction + locales.length) % locales.length]
}

export type { TranslationKey }
