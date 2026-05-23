/**
 * recommendation.js  v2.0
 * Pokémon Guardian Game — 推薦引擎
 *
 * 變更（v2.0）：
 *   - 細化 scoreDetail：directElementScore / generatingElementScore /
 *     balancingElementScore / sceneElementScore / yinYangScore /
 *     quizTagScore / sceneTagScore / popularityScore / penaltyScore /
 *     diversityAdjustment / elementRelationNotes / slotSelectionReason
 *   - 加入五行相生（+4/+2）與相剋調節（+2）
 *   - 加入槽位多樣性機制 slotDiversityPolicy
 *   - 推薦理由文案改為五行上的穩土感 / 柔水感 / 暖火感 / 木感成長力 / 清金感
 *   - 不嵌入或展示官方圖片，official30th.link 只作外部連結保留
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ── 常數 ─────────────────────────────────────────────────────────────────────
const ELEMENTS        = ['木', '火', '土', '金', '水'];
const SCORING_VERSION = 'v2';
const PRIMARY_PRIORITY = ['木', '土', '水', '金', '火'];

// 五行氣質文案（不使用「X系能量」避免混淆官方屬性）
const ELEM_QUALITY = {
  木: '五行上的木感成長力',
  火: '五行上的暖火感',
  土: '五行上的穩土感',
  金: '五行上的清金感',
  水: '五行上的柔水感',
};

// 槽位多樣性：替代候選與原候選分差超過此值時保留原候選
const DIVERSITY_SCORE_THRESHOLD = 12;
// 分差在此範圍內才啟動人氣 / quiz 命中 tie-break
const TIE_SCORE_RANGE = 3;

// ── 1. loadJsonFile ───────────────────────────────────────────────────────────
function loadJsonFile(filePath) {
  const abs = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);
  return JSON.parse(fs.readFileSync(abs, 'utf-8'));
}

// ── 2. calculateBirthElementProfile ──────────────────────────────────────────
function calculateBirthElementProfile(birth, rules) {
  const profile = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  const br = rules.birthElementRules;

  const month = birth.month;
  for (const [elem, months] of Object.entries(br.monthRules.scores)) {
    if (months.includes(month)) profile[elem] += br.monthRules.weight;
  }

  const dayDigit = birth.day % 10;
  for (const [elem, digits] of Object.entries(br.dayDigitRules.scores)) {
    if (digits.includes(dayDigit)) profile[elem] += br.dayDigitRules.weight;
  }

  const hb = birth.hourBranch;
  if (hb && hb !== 'unknown' && hb !== '') {
    for (const [elem, branches] of Object.entries(br.hourRules.scores)) {
      if (branches.includes(hb)) { profile[elem] += br.hourRules.weight; break; }
    }
  }
  return profile;
}

// ── 3. deriveElementNeeds ─────────────────────────────────────────────────────
function deriveElementNeeds(elementProfile) {
  const scores    = elementProfile;
  const minScore  = Math.min(...ELEMENTS.map(e => scores[e]));
  const maxScore  = Math.max(...ELEMENTS.map(e => scores[e]));
  const weakest   = ELEMENTS.filter(e => scores[e] === minScore);
  const strongest = ELEMENTS.filter(e => scores[e] === maxScore);

  let primaryNeed = null;
  for (const e of PRIMARY_PRIORITY) {
    if (weakest.includes(e)) { primaryNeed = e; break; }
  }

  let secondaryNeed = '土';
  if (primaryNeed === '土') secondaryNeed = '木';

  return { strongest, weakest, primaryNeed, secondaryNeed };
}

// ── 4. collectQuizTags ────────────────────────────────────────────────────────
function collectQuizTags(input) {
  return Array.isArray(input.quizTags) ? [...input.quizTags] : [];
}

// ── 5. getSceneRule ───────────────────────────────────────────────────────────
function getSceneRule(sceneId, rules) {
  return rules.sceneRules[sceneId] || null;
}

// ── 6. deriveDynamicSceneElements ─────────────────────────────────────────────
function deriveDynamicSceneElements(quizTags, rules) {
  const map   = rules.tagElementMap || {};
  const tally = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  for (const tag of quizTags) {
    for (const elem of ELEMENTS) {
      const list = map[elem];
      if (Array.isArray(list) && list.includes(tag)) tally[elem]++;
    }
  }
  const maxCount = Math.max(...ELEMENTS.map(e => tally[e]));
  if (maxCount === 0) return ['土'];
  return ELEMENTS.filter(e => tally[e] === maxCount);
}

// ── 7. scorePokemon ───────────────────────────────────────────────────────────
/**
 * 對單一寶可夢計分，回傳 { baseScore, totalScore, scoreDetail }
 * scoreDetail 欄位：
 *   directElementScore      主 / 次需求直接命中
 *   generatingElementScore  相生間接補位
 *   balancingElementScore   相剋溫和調節
 *   sceneElementScore       場景五行
 *   yinYangScore            場景陰陽
 *   quizTagScore            心理標籤命中
 *   sceneTagScore           場景標籤命中
 *   popularityScore         人氣加分
 *   penaltyScore            扣分合計
 *   diversityAdjustment     多樣性調整（槽位選取後填入）
 *   elementRelationNotes    相生相剋參與說明
 *   slotSelectionReason     槽位選取原因（槽位選取後填入）
 */
function scorePokemon(pokemon, context, rules) {
  const { elementNeeds, quizTags, sceneRule, effectiveSceneElements, sceneId } = context;
  const rel  = rules.fiveElementRelations || {};

  const pElem = pokemon.fiveElement && pokemon.fiveElement.main;
  const pRaw  = (pokemon.fiveElement && pokemon.fiveElement.raw) || '';
  const pYY   = pokemon.fiveElement && pokemon.fiveElement.yinYang;
  const kw    = pokemon.keywords    || [];
  const ps    = pokemon.psychStates || [];

  const detail = {
    directElementScore:     0,
    generatingElementScore: 0,
    balancingElementScore:  0,
    sceneElementScore:      0,
    yinYangScore:           0,
    quizTagScore:           0,
    sceneTagScore:          0,
    popularityScore:        0,
    penaltyScore:           0,
    diversityAdjustment:    0,
    elementRelationNotes:   [],
    slotSelectionReason:    '',
  };

  // ── (1) 直接補缺
  if (pElem) {
    if (pElem === elementNeeds.primaryNeed) {
      detail.directElementScore += 10;
    } else if (pElem === elementNeeds.secondaryNeed) {
      detail.directElementScore += 6;
    }
  }

  // ── (2) 相生間接補位
  if (pElem && rel.generates) {
    // 寶可夢的五行能「生出 primaryNeed」→ +4
    if (rel.generates[pElem] === elementNeeds.primaryNeed) {
      detail.generatingElementScore += 4;
      detail.elementRelationNotes.push(
        `${pElem}生${elementNeeds.primaryNeed}，間接補位 primaryNeed (+4)`
      );
    }
    // 寶可夢的五行能「生出 secondaryNeed」→ +2（不與上面重疊）
    else if (rel.generates[pElem] === elementNeeds.secondaryNeed) {
      detail.generatingElementScore += 2;
      detail.elementRelationNotes.push(
        `${pElem}生${elementNeeds.secondaryNeed}，間接補位 secondaryNeed (+2)`
      );
    }
  }

  // ── (3) 相剋調節過旺（+2，最低優先）
  if (pElem && rel.controls && elementNeeds.strongest.length > 0) {
    for (const strongElem of elementNeeds.strongest) {
      if (rel.controls[pElem] === strongElem) {
        detail.balancingElementScore += 2;
        detail.elementRelationNotes.push(
          `${pElem}可平衡偏旺的${strongElem}，整理過旺狀態 (+2)`
        );
        break; // 每隻寶可夢只計一次
      }
    }
  }

  // ── (4) 場景五行 +6
  if (pElem && effectiveSceneElements.includes(pElem)) {
    detail.sceneElementScore = 6;
  }

  // ── (5) 場景陰陽 +4
  const suitableYY = (sceneRule && sceneRule.suitableYinYang) || [];
  if (pYY && suitableYY.includes(pYY)) {
    detail.yinYangScore = 4;
  }

  // 兼容 boostTags / bonusTags
  const sceneTags = [
    ...((sceneRule && sceneRule.boostTags) || []),
    ...((sceneRule && sceneRule.bonusTags) || []),
  ];
  const avoidTags = (sceneRule && sceneRule.avoidTags) || [];

  // ── (6-7) quiz 標籤命中 +3 each
  for (const k of kw) { if (quizTags.includes(k)) detail.quizTagScore += 3; }
  for (const p of ps) { if (quizTags.includes(p)) detail.quizTagScore += 3; }

  // ── (8-9) 場景標籤命中 +3 each
  for (const k of kw) { if (sceneTags.includes(k)) detail.sceneTagScore += 3; }
  for (const p of ps) { if (sceneTags.includes(p)) detail.sceneTagScore += 3; }

  // ── (10) 人氣加分
  const pop = pokemon.popularityScore;
  if (typeof pop === 'number' && pop >= 1 && pop <= 5) {
    detail.popularityScore = pop;
  }

  // ── (11) 扣分
  let penalty = 0;
  for (const k of kw) { if (avoidTags.includes(k)) penalty -= 5; }
  for (const p of ps) { if (avoidTags.includes(p)) penalty -= 5; }
  if (elementNeeds.strongest.includes('火') && pRaw === '陽火') penalty -= 5;
  if (elementNeeds.strongest.includes('水') && pRaw === '陰水' && sceneId !== 'bedroom') penalty -= 3;

  // 臥室場景：相生補位的陽火也需額外限制（避免高刺激火感大量入前排）
  if (sceneId === 'bedroom' && pRaw === '陽火') penalty -= 3;

  detail.penaltyScore = penalty;

  const baseScore =
    detail.directElementScore +
    detail.generatingElementScore +
    detail.balancingElementScore +
    detail.sceneElementScore +
    detail.yinYangScore +
    detail.quizTagScore +
    detail.sceneTagScore +
    detail.popularityScore +
    detail.penaltyScore;

  return { baseScore, totalScore: baseScore, scoreDetail: detail };
}

// ── 輔助：quiz 命中數量 ───────────────────────────────────────────────────────
function quizHitCount(pokemon, quizTags) {
  const kw = pokemon.keywords    || [];
  const ps = pokemon.psychStates || [];
  let count = 0;
  for (const k of kw) { if (quizTags.includes(k)) count++; }
  for (const p of ps) { if (quizTags.includes(p)) count++; }
  return count;
}

// ── 輔助：場景分 ──────────────────────────────────────────────────────────────
function calcSceneScore(sd) {
  return (sd.sceneElementScore || 0) + (sd.yinYangScore || 0) +
         (sd.sceneTagScore || 0) + (sd.penaltyScore || 0);
}

// ── 輔助：穩定 tie-break 選取 ─────────────────────────────────────────────────
function tieBreakSelect(candidates, quizTags) {
  return candidates.slice().sort((a, b) => {
    const scoreDiff = b.totalScore - a.totalScore;
    if (Math.abs(scoreDiff) > TIE_SCORE_RANGE) return scoreDiff;
    // 人氣
    const popDiff = (b.pokemon.popularityScore || 0) - (a.pokemon.popularityScore || 0);
    if (popDiff !== 0) return popDiff;
    // quiz 命中數
    const hitDiff = quizHitCount(b.pokemon, quizTags) - quizHitCount(a.pokemon, quizTags);
    if (hitDiff !== 0) return hitDiff;
    // dexNo 穩定排序
    return a.pokemon.dexNo - b.pokemon.dexNo;
  });
}

// ── 8. buildRecommendationReason ──────────────────────────────────────────────
// slotRole: 'favoritePartner' | 'mainGuardian' | 'sceneSupport' | 'balanceSupport' | 'topCandidate' | null
function buildRecommendationReason(pokemon, scoreDetail, context, locale, slotRole) {
  const loc    = locale || 'zh_tw';
  const { sceneId } = context;

  // ── favoritePartner: 固定文案，三語系 ──────────────────────────────────────
  if (slotRole === 'favoritePartner') {
    const fp = {
      zh_tw: '這位夥伴代表你原本的喜好與熟悉感，會保留在今天的配置裡。其他推薦只是補充不同場景的參考。',
      en:    "This partner reflects your personal favorite and stays with you in today's setup. The other suggestions simply add support for different moments or spaces.",
      ja:    'このポケモンは、あなたが選んだ大切な相棒として今日の配置にも残ります。ほかのおすすめは、場面に合わせた参考として楽しんでください。',
    };
    return fp[loc] || fp.zh_tw;
  }

  const elem = pokemon.fiveElement && pokemon.fiveElement.main;

  // ── 元素描述（依分數層級 × 語系，不使用後台術語） ──────────────────────────
  const elemDesc = {
    zh_tw: {
      木: { h: '適合正在開展新事物、學習或需要重新出發的時刻', m: '帶來溫和的成長感，為今日配置補充一點活力', g: '以輔助的方式，間接為今日狀態帶來一點新生感', b: '為整體配置帶來一點新鮮的成長氣息' },
      火: { h: '在需要啟動、推進或提振幹勁的時候帶來助力', m: '帶來輕微的推進感，讓今日節奏更流暢', g: '以間接的方式，支援今日的活力與推動力', b: '為偏靜的配置帶來一點溫暖與積極感' },
      土: { h: '在需要落地、休息或讓自己安定下來的時刻帶來踏實感', m: '帶來溫和的穩定感，讓今日配置更踏實', g: '以輔助的方式，間接強化今日的穩定基礎', b: '為今日配置增添一份安心與踏實' },
      金: { h: '有助於整理思緒、提升專注力與效率', m: '帶來輕微的整理感，讓頭腦保持清晰', g: '以間接的方式，支援今日的專注與條理', b: '為配置帶來一點清晰感與條理感' },
      水: { h: '適合需要修復、放鬆或慢慢整理狀態的時刻', m: '帶來溫和的修復感，讓今日步調放慢一點', g: '以輔助的方式，間接支援今日的放鬆與修復', b: '為配置帶來一點舒緩，讓整體節奏更柔和' },
    },
    en: {
      木: { h: "a good match when you're looking to begin something new, learn, or find a fresh direction", m: "brings a gentle sense of growth and renewal to round out today's setup", g: 'quietly works in the background to add a spark of new energy to today\'s balance', b: "adds a touch of fresh, growing energy to today's mix" },
      火: { h: 'works well when you need to get started, push forward, or lift your energy', m: "adds a light sense of momentum to keep today's rhythm moving", g: "provides quiet support for today's drive and forward energy", b: 'adds a touch of warmth and positive energy to balance things out' },
      土: { h: 'a good fit when you need to slow down, rest, or feel more settled and grounded', m: "brings a calming steadiness that helps anchor today's setup", g: "quietly backs up today's sense of stability from behind the scenes", b: "adds a grounding, reassuring quality to today's overall feel" },
      金: { h: 'helps clear your head, sharpen focus, and bring a sense of order to the day', m: 'adds a light touch of clarity to help keep things organized and on track', g: "provides quiet support for today's focus and mental clarity", b: "brings a bit of structure and clarity to balance today's setup" },
      水: { h: "a good match when you need to slow down, recover, or gently sort through how you're feeling", m: "brings a soft, restorative quality that helps ease today's pace", g: "quietly supports today's need for rest and gentle recovery", b: "adds a soothing note that softens the overall energy of today's setup" },
    },
    ja: {
      木: { h: '新しいことを始めたい時や、学びや再出発が必要な時に向いています', m: 'やさしい成長感を添えて、今日の配置に活気をプラスしてくれます', g: '間接的なサポートで、今日の状態にそっと新しい息吹を加えてくれます', b: '今日の配置に、フレッシュな成長のエネルギーをそっと添えてくれます' },
      火: { h: '動き出したい時、前へ進みたい時、気力を高めたい時に力を添えてくれます', m: 'やわらかな推進力を加えて、今日のリズムをスムーズにしてくれます', g: '間接的に今日の活力と前進するエネルギーをサポートしてくれます', b: '落ち着いた配置に、少し温かみと前向きさを加えてくれます' },
      土: { h: 'ゆっくり休みたい時や、気持ちを落ち着かせて安定したい時に寄り添ってくれます', m: '穏やかな安定感をプラスして、今日の配置をより落ち着いたものにしてくれます', g: '間接的に今日の安定感をバックアップしてくれます', b: '今日の配置に、安心感と落ち着きをそっと添えてくれます' },
      金: { h: '頭を整理したい時や、集中力や効率を高めたい時に助けになってくれます', m: '軽やかな整理感を加えて、頭の中をクリアに保ってくれます', g: '間接的に今日の明晰さと集中をそっとサポートしてくれます', b: '今日の配置に、すっきりとした条理感をプラスしてくれます' },
      水: { h: '少しペースを落として休みたい時や、じっくり状態を整えたい時に向いています', m: '穏やかな癒し感を添えて、今日の歩調をゆるやかにしてくれます', g: '間接的に今日の休息と回復をそっと支えてくれます', b: '少し緊張感のある配置に、やさしい和らぎをそっと加えてくれます' },
    },
  };

  // ── 場景名稱（三語系） ────────────────────────────────────────────────────
  const sceneNames = {
    zh_tw: { entrance: '玄關', bedroom: '臥室', desk: '書桌', office: '辦公室', watch: '手錶桌面', bag: '隨身包包' },
    en:    { entrance: 'your entryway', bedroom: 'the bedroom', desk: 'your desk', office: 'the office', watch: 'your watch face', bag: 'your everyday bag' },
    ja:    { entrance: '玄関', bedroom: '寝室', desk: 'デスク', office: 'オフィス', watch: 'ウォッチ画面', bag: 'バッグ' },
  };
  const sceneName = (sceneNames[loc] || sceneNames.zh_tw)[sceneId] || sceneId;

  // ── 槽位前綴（三語系） ────────────────────────────────────────────────────
  const slotPrefixes = {
    zh_tw: { mainGuardian: '作為今日的主要守護，', sceneSupport: '', balanceSupport: '' },
    en:    { mainGuardian: "As today's main guardian, ", sceneSupport: '', balanceSupport: '' },
    ja:    { mainGuardian: '今日のメイン守護として、', sceneSupport: '', balanceSupport: '' },
  };
  const prefix = ((slotPrefixes[loc] || slotPrefixes.zh_tw)[slotRole]) || '';

  const locDesc = (elemDesc[loc] || elemDesc.zh_tw)[elem] || {};
  let core = '';

  if (scoreDetail.directElementScore >= 10) {
    core = locDesc.h || '';
  } else if (scoreDetail.directElementScore >= 6) {
    core = locDesc.m || '';
  } else if (scoreDetail.generatingElementScore > 0) {
    core = locDesc.g || '';
  } else if (scoreDetail.balancingElementScore > 0) {
    core = locDesc.b || '';
  } else {
    const generic = { zh_tw: '在今日的配置中帶來穩定的支援', en: "adds a steady, supportive presence to today's setup", ja: '今日の配置にそっと安定したサポートを添えてくれます' };
    core = generic[loc] || generic.zh_tw;
  }

  const parts = [prefix + core];

  // ── 場景匹配補充（只在有場景加分時附加） ───────────────────────────────────
  if (scoreDetail.sceneElementScore > 0 || scoreDetail.yinYangScore > 0 || scoreDetail.sceneTagScore > 0) {
    const sceneMatch = {
      zh_tw: `放在${sceneName}時特別合適`,
      en:    `especially fitting for ${sceneName}`,
      ja:    `${sceneName}に置くのにとてもよく合っています`,
    };
    parts.push(sceneMatch[loc] || sceneMatch.zh_tw);
  }

  const sep = loc === 'en' ? '. ' : '。';
  const end = loc === 'en' ? '.' : '。';
  return parts.filter(Boolean).join(sep) + end;
}

// ── 槽位多樣性選取 ────────────────────────────────────────────────────────────
/**
 * 從候選清單中選出一個槽位寶可夢，套用多樣性限制。
 *
 * @param {object[]} pool          已排除前序槽位的計分結果陣列（已排序）
 * @param {Set}      usedElements  前序槽位已用五行集合
 * @param {number}   elemLimit     同一五行最多允許幾次（全域）
 * @param {Map}      elemCount     目前各五行計數
 * @param {string[]} quizTags      心理標籤
 * @param {string}   preferElem    偏好五行（選填，如 secondaryNeed）
 * @returns {{ entry, diversityNote }}
 */
function pickWithDiversity(pool, elemCount, quizTags, preferElem) {
  // 先嘗試按偏好五行找
  const MAX_SAME_ELEM = 2;

  const preferred = preferElem
    ? pool.filter(s => s.pokemon.fiveElement && s.pokemon.fiveElement.main === preferElem)
    : [];

  // 主候選：最高分
  const primary = pool[0];
  if (!primary) return { entry: null, diversityNote: '無候選' };

  const primaryElem = primary.pokemon.fiveElement && primary.pokemon.fiveElement.main;
  const primaryCount = (primaryElem && elemCount.get(primaryElem)) || 0;

  // 檢查是否可直接選主候選
  if (primaryCount < MAX_SAME_ELEM) {
    const reason = preferElem && primaryElem === preferElem
      ? `優先補位 ${preferElem}，選最高分候選`
      : `最高分候選，五行 ${primaryElem} 出現次數（${primaryCount}）在限制內`;
    return { entry: primary, diversityNote: reason };
  }

  // 主候選五行已達上限，尋找替代
  const alt = pool.find(s => {
    const e = s.pokemon.fiveElement && s.pokemon.fiveElement.main;
    return (elemCount.get(e) || 0) < MAX_SAME_ELEM;
  });

  if (!alt) {
    // 沒有符合多樣性的替代，保留主候選
    return {
      entry: primary,
      diversityNote: `找不到符合多樣性限制的替代候選，保留最高分（五行 ${primaryElem}）`,
    };
  }

  // 分差超過閾值 → 保留原候選
  if (primary.totalScore - alt.totalScore > DIVERSITY_SCORE_THRESHOLD) {
    return {
      entry: primary,
      diversityNote: `替代候選比最高分低超過 ${DIVERSITY_SCORE_THRESHOLD} 分，保留原候選（五行 ${primaryElem}）`,
    };
  }

  return {
    entry: alt,
    diversityNote: `五行 ${primaryElem} 已達上限，改選 ${alt.pokemon.fiveElement && alt.pokemon.fiveElement.main}（分差 ${primary.totalScore - alt.totalScore}）`,
  };
}

// ── 9. recommendPokemon ───────────────────────────────────────────────────────
function recommendPokemon(input, pokemonData, rules) {
  const locale  = input.locale  || 'zh_tw';
  const sceneId = input.sceneId || 'bedroom';

  // 出生五行
  const birthElementProfile = input.birth
    ? calculateBirthElementProfile(input.birth, rules)
    : { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };

  const elementNeeds = deriveElementNeeds(birthElementProfile);
  const quizTags     = collectQuizTags(input);
  const sceneRule    = getSceneRule(sceneId, rules) || {};

  let effectiveSceneElements = sceneRule.suitableElements || [];
  if (sceneRule.dynamicElementMode && sceneRule.dynamicElementSource === 'quizTags') {
    effectiveSceneElements = deriveDynamicSceneElements(quizTags, rules);
  }

  const context = { elementNeeds, quizTags, sceneRule, effectiveSceneElements, sceneId, locale };

  // 全量計分
  const scored = pokemonData.map(pokemon => {
    const { baseScore, totalScore, scoreDetail } = scorePokemon(pokemon, context, rules);
    return { pokemon, baseScore, totalScore, scoreDetail };
  });

  // 穩定排序：totalScore → popularity → quizHit → dexNo
  scored.sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    const popDiff = (b.pokemon.popularityScore || 0) - (a.pokemon.popularityScore || 0);
    if (popDiff !== 0) return popDiff;
    const hitDiff = quizHitCount(b.pokemon, quizTags) - quizHitCount(a.pokemon, quizTags);
    if (hitDiff !== 0) return hitDiff;
    return a.pokemon.dexNo - b.pokemon.dexNo;
  });

  // ── favoritePartner
  let favoritePartner = null;
  const fpDexNo = input.favoritePokemon
    ? (input.favoritePokemon.dexNo || null)
    : null;

  if (input.favoritePokemon) {
    const fp = input.favoritePokemon;
    const found = pokemonData.find(p =>
      (fp.dexNo  && p.dexNo  === fp.dexNo) ||
      (fp.name   && (p.name.zh_tw === fp.name || p.name.en === fp.name || p.name.ja === fp.name))
    );
    if (found) {
      const fpEntry = scored.find(s => s.pokemon.dexNo === found.dexNo);
      const fpRank  = fpEntry ? scored.indexOf(fpEntry) + 1 : null;
      const synced  = fpRank !== null && fpRank <= 10;
      const reason  = fpEntry
        ? buildRecommendationReason(found, fpEntry.scoreDetail, context, locale, 'favoritePartner')
        : '這是你長期喜歡與認同的夥伴，今日配置由其他寶可夢協助不同場景。';
      favoritePartner = {
        dexNo: found.dexNo, id: found.id, name: found.name,
        types: found.types,
        fiveElement: found.fiveElement, popularityScore: found.popularityScore,
        officialLink: found.official30th ? found.official30th.link : '',
        totalScore: fpEntry ? fpEntry.totalScore : null,
        scoreDetail: fpEntry ? fpEntry.scoreDetail : null,
        rank: fpRank, synced,
        reason,
        syncedNote: synced ? null : '這隻寶可夢仍是你的本命夥伴。今天的配置由其他寶可夢協助不同場景。',
        slotSelectionReason: '由使用者指定，永遠保留，不受多樣性限制影響。',
      };
    }
  }

  // 排除 favoritePartner 的候選池
  const pool = fpDexNo
    ? scored.filter(s => s.pokemon.dexNo !== fpDexNo)
    : scored;

  // ── mainGuardian（最高分）
  const elemCount = new Map(ELEMENTS.map(e => [e, 0]));

  const mgEntry = pool[0];
  let mainGuardian = null;
  if (mgEntry) {
    const mgElem = mgEntry.pokemon.fiveElement && mgEntry.pokemon.fiveElement.main;
    elemCount.set(mgElem, (elemCount.get(mgElem) || 0) + 1);
    mgEntry.scoreDetail.slotSelectionReason = '全量排序第一名，綜合分最高。';
    mainGuardian = buildSlotResult(mgEntry, context, locale, 'mainGuardian');
  }
  const mgDexNo = mainGuardian ? mainGuardian.dexNo : null;

  // ── sceneSupport（場景分最高 + 多樣性）
  // 先按場景分排序候選（排除 mg）
  const ssPool = pool
    .filter(s => s.pokemon.dexNo !== mgDexNo)
    .map(s => ({
      ...s,
      sceneScore: calcSceneScore(s.scoreDetail),
    }))
    .sort((a, b) => {
      if (b.sceneScore !== a.sceneScore) return b.sceneScore - a.sceneScore;
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      return a.pokemon.dexNo - b.pokemon.dexNo;
    });

  const mgElem = mgEntry && mgEntry.pokemon.fiveElement && mgEntry.pokemon.fiveElement.main;

  // 若 sceneSupport 最高分與 mainGuardian 同五行，且分差未超 8，嘗試找不同五行
  let ssEntry, ssDiversityNote;
  const ssTop = ssPool[0];
  if (ssTop) {
    const ssTopElem = ssTop.pokemon.fiveElement && ssTop.pokemon.fiveElement.main;
    if (ssTopElem === mgElem) {
      // 找第一個不同五行的場景候選
      const altSs = ssPool.find(s => {
        const e = s.pokemon.fiveElement && s.pokemon.fiveElement.main;
        return e !== mgElem;
      });
      if (altSs && ssTop.sceneScore - altSs.sceneScore <= 8) {
        ssEntry       = altSs;
        ssDiversityNote = `場景分最高候選與 mainGuardian 同五行（${mgElem}），改選分差在 8 以內的不同五行候選（${altSs.pokemon.fiveElement && altSs.pokemon.fiveElement.main}）`;
      } else if (altSs && ssTop.totalScore - altSs.totalScore > DIVERSITY_SCORE_THRESHOLD) {
        ssEntry       = ssTop;
        ssDiversityNote = `替代候選分差超過 ${DIVERSITY_SCORE_THRESHOLD}，保留原候選（五行 ${ssTopElem}）`;
      } else {
        ssEntry       = altSs || ssTop;
        ssDiversityNote = altSs
          ? `改選不同五行（${altSs.pokemon.fiveElement && altSs.pokemon.fiveElement.main}）提升多樣性`
          : `無其他五行候選，保留同五行（${ssTopElem}）`;
      }
    } else {
      ssEntry       = ssTop;
      ssDiversityNote = `場景分最高，五行（${ssTopElem}）與 mainGuardian 不同，直接選用。`;
    }
  }

  let sceneSupport = null;
  const ssDexNo = ssEntry ? ssEntry.pokemon.dexNo : null;
  if (ssEntry) {
    const ssElem = ssEntry.pokemon.fiveElement && ssEntry.pokemon.fiveElement.main;
    elemCount.set(ssElem, (elemCount.get(ssElem) || 0) + 1);
    ssEntry.scoreDetail.slotSelectionReason = ssDiversityNote;
    sceneSupport = buildSlotResult(ssEntry, context, locale, 'sceneSupport');
  }

  // ── balanceSupport（補 secondaryNeed，多樣性）
  const bsPoolBase = pool.filter(s =>
    s.pokemon.dexNo !== mgDexNo && s.pokemon.dexNo !== ssDexNo
  );

  // 嘗試優先補 secondaryNeed
  const mgHasSecondary  = mgEntry  && mgEntry.pokemon.fiveElement && mgEntry.pokemon.fiveElement.main === elementNeeds.secondaryNeed;
  const ssHasSecondary  = ssEntry  && ssEntry.pokemon.fiveElement && ssEntry.pokemon.fiveElement.main === elementNeeds.secondaryNeed;
  const secondaryCovered = mgHasSecondary || ssHasSecondary;

  let bsPreferElem = secondaryCovered ? null : elementNeeds.secondaryNeed;

  // 若 secondaryNeed 已覆蓋，找尚未被覆蓋的 quizTag / scene tag 最高命中
  const { entry: bsEntry, diversityNote: bsDiversityNote } = pickWithDiversity(
    bsPoolBase.sort((a, b) => {
      // 優先 secondaryNeed，再按 totalScore
      const aIsSecondary = a.pokemon.fiveElement && a.pokemon.fiveElement.main === bsPreferElem;
      const bIsSecondary = b.pokemon.fiveElement && b.pokemon.fiveElement.main === bsPreferElem;
      if (aIsSecondary !== bIsSecondary) return bIsSecondary ? 1 : -1;
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      return a.pokemon.dexNo - b.pokemon.dexNo;
    }),
    elemCount,
    quizTags,
    bsPreferElem
  );

  let balanceSupport = null;
  if (bsEntry) {
    const bsElem = bsEntry.pokemon.fiveElement && bsEntry.pokemon.fiveElement.main;
    elemCount.set(bsElem, (elemCount.get(bsElem) || 0) + 1);
    bsEntry.scoreDetail.slotSelectionReason = bsDiversityNote +
      (secondaryCovered ? `（secondaryNeed ${elementNeeds.secondaryNeed} 已被前序槽位覆蓋，補位其他需求）` : '');
    balanceSupport = buildSlotResult(bsEntry, context, locale, 'balanceSupport');
  }

  // topCandidates（前 10，含 fp 若在前 10）
  const topCandidates = scored.slice(0, 10).map((s, i) => ({
    rank: i + 1,
    dexNo: s.pokemon.dexNo, id: s.pokemon.id,
    name: s.pokemon.name, fiveElement: s.pokemon.fiveElement,
    popularityScore: s.pokemon.popularityScore,
    officialLink: s.pokemon.official30th ? s.pokemon.official30th.link : '',
    totalScore: s.totalScore,
    scoreDetail: s.scoreDetail,
    reason: buildRecommendationReason(s.pokemon, s.scoreDetail, context, locale, 'topCandidate'),
  }));

  return {
    inputSummary: {
      locale, sceneId, quizTags,
      birthInput: input.birth || null,
      favoritePokemon: input.favoritePokemon || null,
    },
    birthElementProfile,
    elementNeeds,
    effectiveSceneElements,
    resultSlots: { favoritePartner, mainGuardian, sceneSupport, balanceSupport },
    topCandidates,
    slotElemDistribution: {
      mainGuardian:   mainGuardian   ? mainGuardian.fiveElement   && mainGuardian.fiveElement.main   : null,
      sceneSupport:   sceneSupport   ? sceneSupport.fiveElement   && sceneSupport.fiveElement.main   : null,
      balanceSupport: balanceSupport ? balanceSupport.fiveElement && balanceSupport.fiveElement.main : null,
    },
    debug: {
      scoringVersion: SCORING_VERSION,
      totalPokemonScored: pokemonData.length,
      dynamicSceneMode: !!(sceneRule.dynamicElementMode),
      notes: [],
    },
  };
}

// ── 輔助：組裝槽位結果物件 ────────────────────────────────────────────────────
function buildSlotResult(entry, context, locale, slotRole) {
  const { pokemon, totalScore, scoreDetail } = entry;
  return {
    dexNo: pokemon.dexNo, id: pokemon.id, name: pokemon.name,
    types: pokemon.types,
    fiveElement: pokemon.fiveElement, popularityScore: pokemon.popularityScore,
    officialLink: pokemon.official30th ? pokemon.official30th.link : '',
    totalScore,
    scoreDetail,
    reason: buildRecommendationReason(pokemon, scoreDetail, context, locale, slotRole),
    slotSelectionReason: scoreDetail.slotSelectionReason || '',
  };
}

// ── exports ───────────────────────────────────────────────────────────────────
module.exports = {
  loadJsonFile,
  calculateBirthElementProfile,
  deriveElementNeeds,
  collectQuizTags,
  getSceneRule,
  deriveDynamicSceneElements,
  scorePokemon,
  recommendPokemon,
  buildRecommendationReason,
};
