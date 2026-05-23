/**
 * recommendation.browser.js
 * Pokémon Guardian Game — 推薦引擎（瀏覽器版）
 *
 * 本檔案為 lib/recommendation.js 的瀏覽器相容版本。
 * 移除 require / module.exports，以 IIFE 暴露 window.RecommendationEngine。
 * 不修改原始 lib/recommendation.js，不影響 Node.js 測試。
 *
 * 使用限制（同 lib/recommendation.js）：
 *   - 不嵌入 official30th.link 圖片
 *   - 推薦理由文案使用「五行上的 X 感」而非「X 系能量」
 *   - 不否定使用者的本命夥伴
 */

(function (global) {
  'use strict';

  // ── 常數 ───────────────────────────────────────────────────────────────────
  const ELEMENTS         = ['木', '火', '土', '金', '水'];
  const SCORING_VERSION  = 'v2';
  const PRIMARY_PRIORITY = ['木', '土', '水', '金', '火'];

  const ELEM_QUALITY = {
    木: '五行上的木感成長力',
    火: '五行上的暖火感',
    土: '五行上的穩土感',
    金: '五行上的清金感',
    水: '五行上的柔水感',
  };

  const DIVERSITY_SCORE_THRESHOLD = 12;
  const TIE_SCORE_RANGE = 3;

  // ── 1. calculateBirthElementProfile ────────────────────────────────────────
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

  // ── 2. deriveElementNeeds ──────────────────────────────────────────────────
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

  // ── 3. collectQuizTags ─────────────────────────────────────────────────────
  function collectQuizTags(input) {
    return Array.isArray(input.quizTags) ? [...input.quizTags] : [];
  }

  // ── 4. getSceneRule ────────────────────────────────────────────────────────
  function getSceneRule(sceneId, rules) {
    return rules.sceneRules[sceneId] || null;
  }

  // ── 5. deriveDynamicSceneElements ─────────────────────────────────────────
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

  // ── 6. scorePokemon ────────────────────────────────────────────────────────
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

    // (1) 直接補缺
    if (pElem) {
      if (pElem === elementNeeds.primaryNeed)   detail.directElementScore += 10;
      else if (pElem === elementNeeds.secondaryNeed) detail.directElementScore += 6;
    }

    // (2) 相生間接補位
    if (pElem && rel.generates) {
      if (rel.generates[pElem] === elementNeeds.primaryNeed) {
        detail.generatingElementScore += 4;
        detail.elementRelationNotes.push(`${pElem}生${elementNeeds.primaryNeed}，間接補位 (+4)`);
      } else if (rel.generates[pElem] === elementNeeds.secondaryNeed) {
        detail.generatingElementScore += 2;
        detail.elementRelationNotes.push(`${pElem}生${elementNeeds.secondaryNeed}，間接補位 (+2)`);
      }
    }

    // (3) 相剋調節過旺（+2）
    if (pElem && rel.controls && elementNeeds.strongest.length > 0) {
      for (const strongElem of elementNeeds.strongest) {
        if (rel.controls[pElem] === strongElem) {
          detail.balancingElementScore += 2;
          detail.elementRelationNotes.push(`${pElem}可平衡偏旺的${strongElem} (+2)`);
          break;
        }
      }
    }

    // (4) 場景五行 +6
    if (pElem && effectiveSceneElements.includes(pElem)) detail.sceneElementScore = 6;

    // (5) 場景陰陽 +4
    const suitableYY = (sceneRule && sceneRule.suitableYinYang) || [];
    if (pYY && suitableYY.includes(pYY)) detail.yinYangScore = 4;

    const sceneTags = [
      ...((sceneRule && sceneRule.boostTags)  || []),
      ...((sceneRule && sceneRule.bonusTags)  || []),
    ];
    const avoidTags = (sceneRule && sceneRule.avoidTags) || [];

    // (6-7) quiz 標籤命中 +3
    for (const k of kw) { if (quizTags.includes(k)) detail.quizTagScore += 3; }
    for (const p of ps) { if (quizTags.includes(p)) detail.quizTagScore += 3; }

    // (8-9) 場景標籤命中 +3
    for (const k of kw) { if (sceneTags.includes(k)) detail.sceneTagScore += 3; }
    for (const p of ps) { if (sceneTags.includes(p)) detail.sceneTagScore += 3; }

    // (10) 人氣加分
    const pop = pokemon.popularityScore;
    if (typeof pop === 'number' && pop >= 1 && pop <= 5) detail.popularityScore = pop;

    // (11) 扣分
    let penalty = 0;
    for (const k of kw) { if (avoidTags.includes(k)) penalty -= 5; }
    for (const p of ps) { if (avoidTags.includes(p)) penalty -= 5; }
    if (elementNeeds.strongest.includes('火') && pRaw === '陽火') penalty -= 5;
    if (elementNeeds.strongest.includes('水') && pRaw === '陰水' && sceneId !== 'bedroom') penalty -= 3;
    if (sceneId === 'bedroom' && pRaw === '陽火') penalty -= 3;
    detail.penaltyScore = penalty;

    const baseScore =
      detail.directElementScore + detail.generatingElementScore +
      detail.balancingElementScore + detail.sceneElementScore +
      detail.yinYangScore + detail.quizTagScore + detail.sceneTagScore +
      detail.popularityScore + detail.penaltyScore;

    return { baseScore, totalScore: baseScore, scoreDetail: detail };
  }

  // ── 輔助 ────────────────────────────────────────────────────────────────────
  function quizHitCount(pokemon, quizTags) {
    const kw = pokemon.keywords    || [];
    const ps = pokemon.psychStates || [];
    let count = 0;
    for (const k of kw) { if (quizTags.includes(k)) count++; }
    for (const p of ps) { if (quizTags.includes(p)) count++; }
    return count;
  }

  function calcSceneScore(sd) {
    return (sd.sceneElementScore || 0) + (sd.yinYangScore || 0) +
           (sd.sceneTagScore || 0) + (sd.penaltyScore || 0);
  }

  // ── 7. buildRecommendationReason ───────────────────────────────────────────
  function buildRecommendationReason(pokemon, scoreDetail, context, locale) {
    const { elementNeeds, quizTags, sceneId } = context;
    const name = (pokemon.name && (pokemon.name.zh_tw || pokemon.name.en)) || `#${pokemon.id}`;
    const elem = pokemon.fiveElement && pokemon.fiveElement.main;
    const pop  = pokemon.popularityScore;
    const parts = [];

    const quality = elem ? ELEM_QUALITY[elem] : null;

    if (scoreDetail.directElementScore >= 10) {
      const desc = {
        木: '適合正在開展新事物、學習或需要重新出發的時刻',
        火: '在需要啟動、推進或提振幹勁的時候帶來助力',
        土: '在需要落地、休息或讓自己安定下來的時刻帶來踏實感',
        金: '有助於整理思緒、提升專注力與效率',
        水: '適合需要修復、放鬆、或慢慢整理狀態的時刻',
      };
      parts.push(`${name}帶有${quality || '獨特的五行氣質'}，${desc[elem] || ''}`);
    } else if (scoreDetail.directElementScore >= 6) {
      parts.push(`${name}帶有${quality || '輔助的五行氣質'}，在今日配置中作為補位夥伴`);
    } else if (scoreDetail.generatingElementScore > 0) {
      const note = scoreDetail.elementRelationNotes && scoreDetail.elementRelationNotes[0];
      parts.push(`${name}帶有${quality || '的五行氣質'}，透過相生關係間接支援今日的狀態需求`);
      if (note) parts.push(`（${note.replace(/\(\+\d+\)/g, '')}）`);
    } else if (scoreDetail.balancingElementScore > 0) {
      parts.push(`${name}帶有${quality || '的五行氣質'}，有助於平衡與降溫當前偏旺的狀態`);
    } else {
      parts.push(`${name}在今日的配置中擔任場景支援角色`);
    }

    const hitKw  = (pokemon.keywords    || []).filter(k => quizTags.includes(k));
    const hitPs  = (pokemon.psychStates || []).filter(p => quizTags.includes(p));
    const hitAll = [...new Set([...hitKw, ...hitPs])];
    if (hitAll.length > 0) {
      parts.push(`與你目前「${hitAll.slice(0, 3).join('、')}」的狀態相呼應`);
    }

    const sceneNameMap = {
      entrance: '玄關', bedroom: '臥室', desk: '書桌',
      office: '辦公室', watch: '手錶桌面', bag: '隨身包包',
    };
    const sceneName = sceneNameMap[sceneId] || sceneId;

    if (scoreDetail.sceneElementScore > 0 || scoreDetail.yinYangScore > 0 || scoreDetail.sceneTagScore > 0) {
      parts.push(`放在${sceneName}時特別合適`);
    }

    return parts.filter(Boolean).join('。').replace(/。。/g, '。').replace(/）。/g, '）') + '。';
  }

  // ── 8. pickWithDiversity ───────────────────────────────────────────────────
  function pickWithDiversity(pool, elemCount, quizTags, preferElem) {
    const MAX_SAME_ELEM = 2;
    const primary = pool[0];
    if (!primary) return { entry: null, diversityNote: '無候選' };

    const primaryElem  = primary.pokemon.fiveElement && primary.pokemon.fiveElement.main;
    const primaryCount = (primaryElem && elemCount.get(primaryElem)) || 0;

    if (primaryCount < MAX_SAME_ELEM) {
      const reason = preferElem && primaryElem === preferElem
        ? `優先補位 ${preferElem}，選最高分候選`
        : `最高分候選（五行 ${primaryElem} 出現次數 ${primaryCount} 在限制內）`;
      return { entry: primary, diversityNote: reason };
    }

    const alt = pool.find(s => {
      const e = s.pokemon.fiveElement && s.pokemon.fiveElement.main;
      return (elemCount.get(e) || 0) < MAX_SAME_ELEM;
    });

    if (!alt) {
      return { entry: primary, diversityNote: `找不到符合多樣性限制的替代候選，保留最高分（五行 ${primaryElem}）` };
    }
    if (primary.totalScore - alt.totalScore > DIVERSITY_SCORE_THRESHOLD) {
      return { entry: primary, diversityNote: `替代候選分差超過 ${DIVERSITY_SCORE_THRESHOLD}，保留原候選` };
    }
    return {
      entry: alt,
      diversityNote: `五行 ${primaryElem} 已達上限，改選 ${alt.pokemon.fiveElement && alt.pokemon.fiveElement.main}`,
    };
  }

  // ── 9. buildSlotResult ────────────────────────────────────────────────────
  function buildSlotResult(entry, context, locale) {
    const { pokemon, totalScore, scoreDetail } = entry;
    return {
      dexNo: pokemon.dexNo, id: pokemon.id, name: pokemon.name,
      fiveElement: pokemon.fiveElement, popularityScore: pokemon.popularityScore,
      officialLink: pokemon.official30th ? pokemon.official30th.link : '',
      types: pokemon.types || null,
      totalScore, scoreDetail,
      reason: buildRecommendationReason(pokemon, scoreDetail, context, locale),
      slotSelectionReason: scoreDetail.slotSelectionReason || '',
    };
  }

  // ── 10. recommendPokemon ──────────────────────────────────────────────────
  function recommendPokemon(input, pokemonData, rules) {
    const locale  = input.locale  || 'zh_tw';
    const sceneId = input.sceneId || 'bedroom';

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

    const scored = pokemonData.map(pokemon => {
      const { baseScore, totalScore, scoreDetail } = scorePokemon(pokemon, context, rules);
      return { pokemon, baseScore, totalScore, scoreDetail };
    });

    scored.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      const popDiff = (b.pokemon.popularityScore || 0) - (a.pokemon.popularityScore || 0);
      if (popDiff !== 0) return popDiff;
      const hitDiff = quizHitCount(b.pokemon, quizTags) - quizHitCount(a.pokemon, quizTags);
      if (hitDiff !== 0) return hitDiff;
      return a.pokemon.dexNo - b.pokemon.dexNo;
    });

    // favoritePartner
    let favoritePartner = null;
    const fpDexNo = input.favoritePokemon ? (input.favoritePokemon.dexNo || null) : null;

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
          ? buildRecommendationReason(found, fpEntry.scoreDetail, context, locale)
          : '這是你長期喜歡與認同的夥伴，今日配置由其他寶可夢協助不同場景。';
        favoritePartner = {
          dexNo: found.dexNo, id: found.id, name: found.name,
          fiveElement: found.fiveElement, popularityScore: found.popularityScore,
          officialLink: found.official30th ? found.official30th.link : '',
          types: found.types || null,
          totalScore: fpEntry ? fpEntry.totalScore : null,
          scoreDetail: fpEntry ? fpEntry.scoreDetail : null,
          rank: fpRank, synced, reason,
          syncedNote: synced ? null : '這隻寶可夢仍是你的本命夥伴。今天的配置由其他寶可夢協助不同場景。',
          slotSelectionReason: '由使用者指定，永遠保留，不受多樣性限制影響。',
        };
      }
    }

    const pool = fpDexNo ? scored.filter(s => s.pokemon.dexNo !== fpDexNo) : scored;
    const elemCount = new Map(ELEMENTS.map(e => [e, 0]));

    // mainGuardian
    const mgEntry = pool[0];
    let mainGuardian = null;
    if (mgEntry) {
      const mgElem = mgEntry.pokemon.fiveElement && mgEntry.pokemon.fiveElement.main;
      elemCount.set(mgElem, (elemCount.get(mgElem) || 0) + 1);
      mgEntry.scoreDetail.slotSelectionReason = '全量排序第一名，綜合分最高。';
      mainGuardian = buildSlotResult(mgEntry, context, locale);
    }
    const mgDexNo = mainGuardian ? mainGuardian.dexNo : null;

    // sceneSupport
    const mgElem = mgEntry && mgEntry.pokemon.fiveElement && mgEntry.pokemon.fiveElement.main;
    const ssPool = pool
      .filter(s => s.pokemon.dexNo !== mgDexNo)
      .map(s => ({ ...s, sceneScore: calcSceneScore(s.scoreDetail) }))
      .sort((a, b) => {
        if (b.sceneScore !== a.sceneScore) return b.sceneScore - a.sceneScore;
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        return a.pokemon.dexNo - b.pokemon.dexNo;
      });

    let ssEntry, ssDiversityNote;
    const ssTop = ssPool[0];
    if (ssTop) {
      const ssTopElem = ssTop.pokemon.fiveElement && ssTop.pokemon.fiveElement.main;
      if (ssTopElem === mgElem) {
        const altSs = ssPool.find(s => (s.pokemon.fiveElement && s.pokemon.fiveElement.main) !== mgElem);
        if (altSs && ssTop.sceneScore - altSs.sceneScore <= 8) {
          ssEntry = altSs;
          ssDiversityNote = `場景分最高候選與 mainGuardian 同五行，改選不同五行（${altSs.pokemon.fiveElement && altSs.pokemon.fiveElement.main}）`;
        } else {
          ssEntry = altSs || ssTop;
          ssDiversityNote = altSs ? `改選不同五行（${altSs.pokemon.fiveElement && altSs.pokemon.fiveElement.main}）` : `無其他五行候選`;
        }
      } else {
        ssEntry = ssTop;
        ssDiversityNote = `場景分最高，五行（${ssTopElem}）與 mainGuardian 不同。`;
      }
    }

    let sceneSupport = null;
    const ssDexNo = ssEntry ? ssEntry.pokemon.dexNo : null;
    if (ssEntry) {
      const ssElem = ssEntry.pokemon.fiveElement && ssEntry.pokemon.fiveElement.main;
      elemCount.set(ssElem, (elemCount.get(ssElem) || 0) + 1);
      ssEntry.scoreDetail.slotSelectionReason = ssDiversityNote;
      sceneSupport = buildSlotResult(ssEntry, context, locale);
    }

    // balanceSupport
    const bsPoolBase = pool.filter(s => s.pokemon.dexNo !== mgDexNo && s.pokemon.dexNo !== ssDexNo);
    const mgHasSecondary = mgEntry && mgEntry.pokemon.fiveElement && mgEntry.pokemon.fiveElement.main === elementNeeds.secondaryNeed;
    const ssHasSecondary = ssEntry && ssEntry.pokemon.fiveElement && ssEntry.pokemon.fiveElement.main === elementNeeds.secondaryNeed;
    const bsPreferElem   = (mgHasSecondary || ssHasSecondary) ? null : elementNeeds.secondaryNeed;

    const { entry: bsEntry, diversityNote: bsDiversityNote } = pickWithDiversity(
      bsPoolBase.sort((a, b) => {
        const aIsSec = a.pokemon.fiveElement && a.pokemon.fiveElement.main === bsPreferElem;
        const bIsSec = b.pokemon.fiveElement && b.pokemon.fiveElement.main === bsPreferElem;
        if (aIsSec !== bIsSec) return bIsSec ? 1 : -1;
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        return a.pokemon.dexNo - b.pokemon.dexNo;
      }),
      elemCount, quizTags, bsPreferElem
    );

    let balanceSupport = null;
    if (bsEntry) {
      const bsElem = bsEntry.pokemon.fiveElement && bsEntry.pokemon.fiveElement.main;
      elemCount.set(bsElem, (elemCount.get(bsElem) || 0) + 1);
      bsEntry.scoreDetail.slotSelectionReason = bsDiversityNote;
      balanceSupport = buildSlotResult(bsEntry, context, locale);
    }

    const topCandidates = scored.slice(0, 10).map((s, i) => ({
      rank: i + 1,
      dexNo: s.pokemon.dexNo, id: s.pokemon.id,
      name: s.pokemon.name, fiveElement: s.pokemon.fiveElement,
      popularityScore: s.pokemon.popularityScore,
      officialLink: s.pokemon.official30th ? s.pokemon.official30th.link : '',
      types: s.pokemon.types || null,
      totalScore: s.totalScore, scoreDetail: s.scoreDetail,
      reason: buildRecommendationReason(s.pokemon, s.scoreDetail, context, locale),
    }));

    return {
      inputSummary: { locale, sceneId, quizTags, birthInput: input.birth || null, favoritePokemon: input.favoritePokemon || null },
      birthElementProfile, elementNeeds, effectiveSceneElements,
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

  // ── 暴露 API ───────────────────────────────────────────────────────────────
  global.RecommendationEngine = {
    calculateBirthElementProfile,
    deriveElementNeeds,
    collectQuizTags,
    getSceneRule,
    deriveDynamicSceneElements,
    scorePokemon,
    recommendPokemon,
    buildRecommendationReason,
  };

})(window);
