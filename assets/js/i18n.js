/**
 * i18n.js — 多語系 UI 字串模組
 * 語系：zh_tw / en / ja
 * 使用方式：I18N.t('key') 回傳當前語系字串
 */
(function (global) {
  'use strict';

  const STRINGS = {
    zh_tw: {
      // 首頁
      homeTitle:    '你的寶可夢守護位',
      homeSubtitle: '從出生資料、目前狀態與生活場景，找出最適合陪在你身邊的寶可夢。',
      startBtn:     '開始測驗',
      homeFeature1: '出生資料作為能量分析基礎',
      homeFeature2: '心理狀態測驗找出今日需求',
      homeFeature3: '場景適配，找到最合拍的夥伴',
      // 語系切換
      lang_zh_tw: '繁中',
      lang_en:    'English',
      lang_ja:    '日本語',
      // 進度列
      stepLabel: (cur, tot) => `${cur} / ${tot}`,
      steps: ['本命夥伴', '出生資料', '目前狀態', '使用場景', '結果'],
      // 通用按鈕
      nextBtn:    '下一步',
      backBtn:    '上一步',
      skipBtn:    '略過',
      clearBtn:   '清除資料',
      retakeBtn:  '重新測驗',
      // Step 1 — 本命夥伴
      s1Title:       '先選出你的本命夥伴',
      s1Desc:        '選出你最喜歡、最想帶在身邊的寶可夢。這隻寶可夢會被視為你的本命夥伴——測驗結果可能推薦其他適合現在狀態的寶可夢，但那不代表你要放棄原本喜歡的夥伴。',
      s1SearchPlaceholder: '用名字或編號搜尋（例：耿鬼、94、Gengar）',
      s1NoResult:    '找不到符合的寶可夢',
      s1SkipText:    '我沒有特別喜歡的，直接測驗',
      s1Selected:        '已選擇本命夥伴：',
      s1ChangeBtn:       '換一隻',
      favSelectedTitle:  '已選擇本命夥伴',
      favSelectedNote:   '這位夥伴會保留在結果頁中。測驗推薦的是今天或特定場景的配置參考，不會取代你原本喜歡的寶可夢。',
      // Step 2 — 出生資料
      s2Title: '輸入你的出生資料',
      s2Desc:  '輸入出生日期，作為本次能量分析的基礎參考。這是簡化計算，不是精確命理。',
      s2Year:        '出生年',
      s2Month:       '出生月',
      s2Day:         '出生日',
      s2Hour:        '大概出生時間，可略過',
      s2HourUnknown: '不知道／略過',
      s2HourOptions: [
        { value: '子', label: '23:00 – 00:59' },
        { value: '丑', label: '01:00 – 02:59' },
        { value: '寅', label: '03:00 – 04:59' },
        { value: '卯', label: '05:00 – 06:59' },
        { value: '辰', label: '07:00 – 08:59' },
        { value: '巳', label: '09:00 – 10:59' },
        { value: '午', label: '11:00 – 12:59' },
        { value: '未', label: '13:00 – 14:59' },
        { value: '申', label: '15:00 – 16:59' },
        { value: '酉', label: '17:00 – 18:59' },
        { value: '戌', label: '19:00 – 20:59' },
        { value: '亥', label: '21:00 – 22:59' },
      ],
      s2ErrYear:  '請輸入合理的年份（1900–2099）',
      s2ErrMonth: '請選擇月份',
      s2ErrDay:   '請輸入合理的日期（1–31）',
      s2ErrDate:  '這個月沒有這一天，請確認日期',
      // Step 3 — 心理測驗
      s3Title:    '今天的你，是什麼狀態？',
      s3Desc:     '選出最接近你現在感受的選項。沒有對錯，選直覺就好。',
      s3Progress: (cur, tot) => `第 ${cur} 題，共 ${tot} 題`,
      // Step 4 — 場景選擇
      s4Title:    '你想把守護寶可夢放在哪裡？',
      s4Desc:     '選擇一個最常待著、或最想守護的場景。',
      // Step 5 — 結果頁
      s5Title:              '你的守護寶可夢',
      energySummaryTitle:   '今日能量分析',
      energySummaryPrefix:  '今日配置重點：',
      slotFavorite:         '本命夥伴',
      slotMain:             '今日主守護',
      slotScene:            '場景補位',
      slotBalance:          '平衡補位',
      labelDexNo:           '圖鑑編號',
      labelElement:         '五行氣質',
      labelTypes:           '官方屬性',
      labelReason:          '推薦理由',
      officialLinkBtn:      '前往官方 30 週年頁面查看圖案',
      syncedNote:           '這隻寶可夢仍是你的本命夥伴。今天的配置由其他寶可夢協助不同場景。',
      tipNote:              '你原本喜歡的寶可夢仍然可以留在身邊。今天的結果只是提供另一種日常配置參考，讓不同場合多幾位適合陪伴的夥伴。',
      // 五行能量標籤
      elemLabel: { 木: '成長', 火: '活力', 土: '穩定', 金: '清晰', 水: '修復' },
      // 分享
      shareBtn:             '複製分享文字',
      shareCopied:          '已複製！',
      shareTitle:           '我測到的寶可夢守護位是：',
      shareEnergyLabel:     '今日能量配置：',
      shareFooter:          '想看看這些寶可夢的 30 週年圖案，可以前往 Pokémon 官方網站一起同樂。',
      shareToday:           '今日配置重點：',
      shareImgBtn:          '下載分享圖片',
      shareCardTitle:       '我的寶可夢守護位',
      shareCardDisclaimer:  '非官方粉絲向互動測驗。想看 30 週年圖案，請前往 Pokémon 官方網站。',
      shareCardPreview:     '分享圖片預覽',
      shareModalClose:      '關閉',
      // Beta 測試
      betaNotice:         '目前是 beta 測試版。如果你在操作中遇到卡住、文案不自然、分享圖片異常，歡迎回報給我。',
      betaFeedbackBtn:    '回報測試感受',
      betaFormNotSet:     '回饋表單尚未設定。',
      // 免責聲明
      disclaimerTitle: '非官方粉絲向企劃',
    },

    en: {
      homeTitle:    'Your Pokémon Aura Match',
      homeSubtitle: 'Find the Pokémon that match your current energy, space, and personality.',
      startBtn:     'Start Quiz',
      homeFeature1: 'Birth data as your energy baseline',
      homeFeature2: 'Personality quiz for today\'s needs',
      homeFeature3: 'Scene-based Pokémon matching',
      lang_zh_tw: '繁中',
      lang_en:    'English',
      lang_ja:    '日本語',
      stepLabel: (cur, tot) => `${cur} / ${tot}`,
      steps: ['Fav Partner', 'Birth Info', 'How You Feel', 'Your Space', 'Results'],
      nextBtn:    'Next',
      backBtn:    'Back',
      skipBtn:    'Skip',
      clearBtn:   'Clear Data',
      retakeBtn:  'Retake Quiz',
      s1Title:    'Choose Your Favorite Pokémon',
      s1Desc:     'Pick the Pokémon you love most or always want nearby. It will be saved as your favorite partner — the quiz may recommend others for your current state, but that doesn\'t mean you should give up on your favorite.',
      s1SearchPlaceholder: 'Search by name or number (e.g. Gengar, 94)',
      s1NoResult:  'No Pokémon found',
      s1SkipText:  'I don\'t have a particular favorite — just take the quiz',
      s1Selected:       'Selected: ',
      s1ChangeBtn:      'Change',
      favSelectedTitle: 'Favorite partner selected',
      favSelectedNote:  'This partner will stay with you on the result page. The quiz simply adds suggestions for today or for a specific space.',
      s2Title:    'Your Birth Info',
      s2Desc:     'Enter your birth date as a simple reference for this energy reading. This is a light, simplified reading — not a precise calculation.',
      s2Year:     'Birth Year',
      s2Month:    'Birth Month',
      s2Day:      'Birth Day',
      s2Hour:     'Approximate birth time, optional',
      s2HourUnknown: 'I don\'t know / Skip',
      s2HourOptions: [
        { value: '子', label: '11:00 PM – 1:00 AM' },
        { value: '丑', label: '1:00 AM – 3:00 AM'  },
        { value: '寅', label: '3:00 AM – 5:00 AM'  },
        { value: '卯', label: '5:00 AM – 7:00 AM'  },
        { value: '辰', label: '7:00 AM – 9:00 AM'  },
        { value: '巳', label: '9:00 AM – 11:00 AM' },
        { value: '午', label: '11:00 AM – 1:00 PM' },
        { value: '未', label: '1:00 PM – 3:00 PM'  },
        { value: '申', label: '3:00 PM – 5:00 PM'  },
        { value: '酉', label: '5:00 PM – 7:00 PM'  },
        { value: '戌', label: '7:00 PM – 9:00 PM'  },
        { value: '亥', label: '9:00 PM – 11:00 PM' },
      ],
      s2ErrYear:  'Please enter a valid year (1900–2099)',
      s2ErrMonth: 'Please select a month',
      s2ErrDay:   'Please enter a valid day (1–31)',
      s2ErrDate:  'That date doesn\'t exist in this month. Please check.',
      s3Title:    'How Are You Feeling Today?',
      s3Desc:     'Pick the option closest to how you feel right now. No right or wrong — just go with your gut.',
      s3Progress: (cur, tot) => `Question ${cur} of ${tot}`,
      s4Title:    'Where Will Your Pokémon Be?',
      s4Desc:     'Choose the space you spend the most time in or want to protect.',
      s5Title:              'Your Pokémon Guardian Match',
      energySummaryTitle:   'Today\'s Energy Reading',
      energySummaryPrefix:  'Today\'s setup focus: ',
      slotFavorite:         'Favorite Partner',
      slotMain:             'Main Guardian',
      slotScene:            'Scene Support',
      slotBalance:          'Balance Support',
      labelDexNo:           'Pokédex No.',
      labelElement:         'Five-Element Aura',
      labelTypes:           'Official Type',
      labelReason:          'Why This One',
      officialLinkBtn:      'View the official 30th anniversary artwork',
      syncedNote:           'This Pokémon remains your favorite partner. Today\'s setup adds other Pokémon to support different parts of your day.',
      tipNote:              'Your favorite Pokémon can always stay by your side. Today\'s results simply offer another arrangement — a few companions for different moments of your day.',
      elemLabel: { 木: 'growth', 火: 'vitality', 土: 'grounding', 金: 'clarity', 水: 'healing' },
      shareBtn:             'Copy Share Text',
      shareCopied:          'Copied!',
      shareTitle:           'My Pokémon Guardian Match:',
      shareEnergyLabel:     'Energy focus: ',
      shareFooter:          'To see these Pokémon\'s 30th anniversary artwork, visit the official Pokémon website and celebrate together!',
      shareToday:           'Today\'s focus: ',
      shareImgBtn:          'Download Share Card',
      shareCardTitle:       'My Pokémon Aura Match',
      shareCardDisclaimer:  'Fan-made quiz, not official. For 30th anniversary artwork, visit the Pokémon official website.',
      shareCardPreview:     'Share Card Preview',
      shareModalClose:      'Close',
      // Beta testing
      betaNotice:         'This is a beta version. If you get stuck, notice unnatural text, or have issues with the share image, feel free to send feedback.',
      betaFeedbackBtn:    'Send beta feedback',
      betaFormNotSet:     'Feedback form is not set yet.',
      disclaimerTitle: 'Fan Project — Not Official',
    },

    ja: {
      homeTitle:    'あなたのポケモンおまもり診断',
      homeSubtitle: '今のあなたの気分や空間に寄り添うポケモンを見つけてみましょう。',
      startBtn:     '診断スタート',
      homeFeature1: '生年月日をエネルギー分析の参考に',
      homeFeature2: '今の状態から今日のニーズを探す',
      homeFeature3: 'シーン別に最適なポケモンを発見',
      lang_zh_tw: '繁中',
      lang_en:    'English',
      lang_ja:    '日本語',
      stepLabel: (cur, tot) => `${cur} / ${tot}`,
      steps: ['推しポケモン', '生年月日', '今の状態', '置く場所', '結果'],
      nextBtn:    '次へ',
      backBtn:    '戻る',
      skipBtn:    'スキップ',
      clearBtn:   'データをクリア',
      retakeBtn:  'もう一度診断する',
      s1Title:    '推しポケモンを選んでください',
      s1Desc:     '一番好きな、いつも一緒にいたいポケモンを選んでください。診断結果に関係なく、そのポケモンは「推し相棒」として残ります。',
      s1SearchPlaceholder: '名前や図鑑番号で検索（例：ゲンガー、94）',
      s1NoResult:  '該当するポケモンが見つかりません',
      s1SkipText:  '特に決まっていないのでそのまま診断する',
      s1Selected:       '選択中：',
      s1ChangeBtn:      '変更する',
      favSelectedTitle: '大切な相棒を選びました',
      favSelectedNote:  'このポケモンは結果ページにも表示されます。診断結果は、今日や特定の場所に合う配置の参考として楽しんでください。',
      s2Title:    '生年月日を教えてください',
      s2Desc:     '生年月日を入力して、今回のエネルギー分析の参考にします。簡易的な計算で、命理学の正確な計算ではありません。',
      s2Year:     '生まれ年',
      s2Month:    '生まれ月',
      s2Day:      '生まれ日',
      s2Hour:     'だいたいの出生時間（任意）',
      s2HourUnknown: 'わからない／スキップ',
      s2HourOptions: [
        { value: '子', label: '23:00 – 00:59' },
        { value: '丑', label: '01:00 – 02:59' },
        { value: '寅', label: '03:00 – 04:59' },
        { value: '卯', label: '05:00 – 06:59' },
        { value: '辰', label: '07:00 – 08:59' },
        { value: '巳', label: '09:00 – 10:59' },
        { value: '午', label: '11:00 – 12:59' },
        { value: '未', label: '13:00 – 14:59' },
        { value: '申', label: '15:00 – 16:59' },
        { value: '酉', label: '17:00 – 18:59' },
        { value: '戌', label: '19:00 – 20:59' },
        { value: '亥', label: '21:00 – 22:59' },
      ],
      s2ErrYear:  '有効な年を入力してください（1900–2099）',
      s2ErrMonth: '月を選択してください',
      s2ErrDay:   '有効な日を入力してください（1–31）',
      s2ErrDate:  'その日付はその月には存在しません。',
      s3Title:    '今のあなたはどんな状態ですか？',
      s3Desc:     '今の感覚に一番近いものを選んでください。正解はありません、直感で選んでみて。',
      s3Progress: (cur, tot) => `${cur} 問目 / 全 ${tot} 問`,
      s4Title:    'ポケモンをどこに置きますか？',
      s4Desc:     '一番よくいる場所、または守りたいと思う空間を選んでください。',
      s5Title:              'あなたの守護ポケモン',
      energySummaryTitle:   '今日のエネルギー分析',
      energySummaryPrefix:  '今日の配置テーマ：',
      slotFavorite:         '推しポケモン',
      slotMain:             '今日のメイン守護',
      slotScene:            'シーン補助',
      slotBalance:          'バランス補助',
      labelDexNo:           '全国図鑑番号',
      labelElement:         '五行の気質',
      labelTypes:           '公式タイプ',
      labelReason:          'おすすめの理由',
      officialLinkBtn:      '公式30周年ページでアイコンを見る',
      syncedNote:           'このポケモンはこれからもあなたの大切な相棒です。今日の配置では、別のポケモンが今の場面をそっと支えてくれます。',
      tipNote:              'もともと好きなポケモンはいつもそばに置いて大丈夫です。今日の結果はあくまで一例で、場面ごとに違う相棒をそっとそろえるための参考にしてください。',
      elemLabel: { 木: '成長', 火: '活力', 土: '安定', 金: '明晰', 水: '癒し' },
      shareBtn:             'シェアテキストをコピー',
      shareCopied:          'コピーしました！',
      shareTitle:           '私のポケモンおまもり診断結果：',
      shareEnergyLabel:     '配置テーマ：',
      shareFooter:          '30周年アイコンを見たい方は、ポケモン公式サイトへ！一緒に盛り上がりましょう。',
      shareToday:           '今日のテーマ：',
      shareImgBtn:          'シェア画像を保存',
      shareCardTitle:       '私のポケモンおまもり診断',
      shareCardDisclaimer:  '非公式ファン向け企画。30周年アイコンはポケモン公式サイトでご確認ください。',
      shareCardPreview:     'シェア画像プレビュー',
      shareModalClose:      '閉じる',
      // ベータテスト
      betaNotice:         'これはベータテスト版です。操作が詰まる、文章が不自然に感じる、シェア画像に問題があるなど、お気づきの点があればぜひ教えてください。',
      betaFeedbackBtn:    'テスト感想を送る',
      betaFormNotSet:     'フィードバックフォームはまだ設定されていません。',
      disclaimerTitle: '非公式ファン向け企画',
    },
  };

  let _locale = 'zh_tw';

  function detectLocale() {
    const saved = localStorage.getItem('pgLocale');
    if (saved && STRINGS[saved]) return saved;
    const lang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
    if (lang.startsWith('zh-tw') || lang.startsWith('zh-hk') || lang.startsWith('zh-mo') || lang === 'zh') return 'zh_tw';
    if (lang.startsWith('ja')) return 'ja';
    return 'en';
  }

  function setLocale(locale) {
    if (!STRINGS[locale]) return;
    _locale = locale;
    localStorage.setItem('pgLocale', locale);
    document.documentElement.lang = locale === 'zh_tw' ? 'zh-TW' : locale === 'ja' ? 'ja' : 'en';
  }

  function getLocale() { return _locale; }

  function t(key, ...args) {
    const val = STRINGS[_locale] && STRINGS[_locale][key];
    if (val === undefined) return STRINGS['zh_tw'][key] || key;
    if (typeof val === 'function') return val(...args);
    return val;
  }

  // 從 rules.json 場景物件取出當前語系名稱
  function sceneLocName(sceneObj) {
    const loc = sceneObj[_locale] || sceneObj['zh_tw'];
    return loc ? loc.name : sceneObj.sceneId || '—';
  }
  function sceneLocTone(sceneObj) {
    const loc = sceneObj[_locale] || sceneObj['zh_tw'];
    return loc ? loc.tone : '';
  }

  // 從 quizQuestion 物件取出當前語系題目與選項
  function quizLocQuestion(qObj) {
    return (qObj[_locale] || qObj['zh_tw'] || {}).question || '';
  }
  function quizLocOptions(qObj) {
    return (qObj[_locale] || qObj['zh_tw'] || {}).options || [];
  }

  // 從 pokemon 物件取出當前語系名稱
  function pokemonName(p) {
    if (!p || !p.name) return '';
    return p.name[_locale] || p.name['zh_tw'] || p.name['en'] || '';
  }

  // 從 pokemon 物件取出當前語系屬性
  function pokemonTypes(p) {
    if (!p || !p.types) return [];
    return p.types[_locale] || p.types['zh_tw'] || p.types['en'] || [];
  }

  // 從 elemLabel 取五行對應的能量標籤（不暴露後台術語）
  function elemLabelText(main) {
    const map = (STRINGS[_locale] || STRINGS['zh_tw']).elemLabel || {};
    return map[main] || main;
  }

  global.I18N = {
    t, setLocale, getLocale, detectLocale,
    sceneLocName, sceneLocTone,
    quizLocQuestion, quizLocOptions,
    pokemonName, pokemonTypes, elemLabelText,
  };

})(window);
