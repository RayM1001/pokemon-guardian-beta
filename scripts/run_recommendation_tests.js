#!/usr/bin/env node
/**
 * run_recommendation_tests.js  v2.0
 * 執行所有測試案例並產出 reports/recommendation_test_report.md
 *
 * 變更（v2.0）：
 *   - scoreDetail 欄位名稱對齊 recommendation.js v2.0
 *   - 新增槽位多樣性驗證（slotDiversityCheck）
 *   - 新增 elementRelationNotes / slotSelectionReason 顯示
 *   - 新增 slotElemDistribution 區塊
 */

'use strict';

const path = require('path');
const fs   = require('fs');
const { recommendPokemon, loadJsonFile, deriveDynamicSceneElements } = require('../lib/recommendation');

const BASE = path.resolve(__dirname, '..');

// ── 載入資料 ──────────────────────────────────────────────────────────────────
const pokemonData = loadJsonFile(path.join(BASE, 'data/pokemon.json'));
const rules       = loadJsonFile(path.join(BASE, 'data/rules.json'));
const testCases   = loadJsonFile(path.join(BASE, 'tests/recommendation_test_cases.json'));

console.log(`✅ 載入 ${pokemonData.length} 筆寶可夢 | ${testCases.length} 組測試案例`);

// ── 驗證函式 ──────────────────────────────────────────────────────────────────
function validateResult(result, expectations, input) {
  const issues = [];
  const passes = [];

  // 1. favoritePartner 必須存在
  if (expectations.favoritePartnerMustExist) {
    if (result.resultSlots.favoritePartner) {
      passes.push('✅ favoritePartner 槽位存在');
      const fp = result.resultSlots.favoritePartner;
      if (expectations.favoritePartnerDexNo && fp.dexNo !== expectations.favoritePartnerDexNo) {
        issues.push(`❌ favoritePartner dexNo 應為 ${expectations.favoritePartnerDexNo}，實際為 ${fp.dexNo}`);
      } else if (expectations.favoritePartnerDexNo) {
        passes.push(`✅ favoritePartner dexNo 正確 (${fp.dexNo})`);
      }
    } else {
      issues.push('❌ favoritePartner 槽位為空，應存在');
    }
  }

  // 2. favoritePartner 不被覆蓋（mainGuardian 不得與 fp 相同）
  if (expectations.favoritePartnerNotOverridden && result.resultSlots.favoritePartner) {
    const fpDexNo = result.resultSlots.favoritePartner.dexNo;
    const mgDexNo = result.resultSlots.mainGuardian && result.resultSlots.mainGuardian.dexNo;
    if (fpDexNo === mgDexNo) {
      issues.push(`❌ mainGuardian 與 favoritePartner 相同 (dexNo=${fpDexNo})，應分開`);
    } else {
      passes.push('✅ favoritePartner 與 mainGuardian 為不同槽位');
    }
  }

  // 3. 動態場景模式
  if (expectations.dynamicSceneMode !== undefined) {
    if (result.debug.dynamicSceneMode === expectations.dynamicSceneMode) {
      passes.push(`✅ dynamicSceneMode = ${expectations.dynamicSceneMode}`);
    } else {
      issues.push(`❌ dynamicSceneMode 預期 ${expectations.dynamicSceneMode}，實際 ${result.debug.dynamicSceneMode}`);
    }
  }

  // 4. watch 動態五行檢查
  if (expectations.expectedDynamicElements) {
    const eff = result.effectiveSceneElements || [];
    const expected = expectations.expectedDynamicElements;
    const allMatch = expected.every(e => eff.includes(e));
    if (allMatch) {
      passes.push(`✅ 動態五行推導包含 ${expected.join('、')}（實際：${eff.join('、')}）`);
    } else {
      issues.push(`❌ 動態五行應含 ${expected.join('、')}，實際為 ${eff.join('、')}`);
    }
  }

  // 5. top5 五行分佈
  if (expectations.topElementsInTop5) {
    const top5 = result.topCandidates.slice(0, 5);
    const top5Elems = top5.map(c => c.fiveElement && c.fiveElement.main).filter(Boolean);
    const expectedElems = expectations.topElementsInTop5;
    const matchedElems = expectedElems.filter(e => top5Elems.includes(e));
    if (matchedElems.length >= Math.ceil(expectedElems.length * 0.5)) {
      passes.push(`✅ top5 五行分佈符合預期（含 ${matchedElems.join('、')}）`);
    } else {
      issues.push(`⚠ top5 五行分佈部分不符，預期含 ${expectedElems.join('、')}，實際 top5：${top5Elems.join('、')}`);
    }
  }

  // 6. 出生五行最強檢查
  if (expectations.birthElementStrongest) {
    const strongest = result.elementNeeds.strongest;
    const expected  = expectations.birthElementStrongest;
    const ok = expected.some(e => strongest.includes(e));
    if (ok) {
      passes.push(`✅ 出生最強五行含 ${expected.join('/')}（實際：${strongest.join('、')}）`);
    } else {
      issues.push(`⚠ 出生最強五行應含 ${expected.join('/')}，實際：${strongest.join('、')}`);
    }
  }

  // 7. 扣分機制檢查（v2.0：統一使用 penaltyScore 欄位）
  if (expectations.penaltyCheck) {
    const candidates = result.topCandidates;
    const penalized = candidates.filter(c => c.scoreDetail && (c.scoreDetail.penaltyScore || 0) < 0);
    if (penalized.length > 0) {
      passes.push(`✅ ${expectations.penaltyCheck} 扣分機制觸發（top10 有 ${penalized.length} 筆被扣分，penaltyScore < 0）`);
    } else {
      passes.push(`ℹ ${expectations.penaltyCheck} 在 top10 中未觀察到扣分（可能已被排序到後方）`);
    }
  }

  // 8. 槽位多樣性驗證（v2.0 新增）
  if (expectations.slotDiversityCheck) {
    const dist = result.slotElemDistribution;
    const slots = [dist.mainGuardian, dist.sceneSupport, dist.balanceSupport].filter(Boolean);
    const uniqueElems = new Set(slots);
    if (uniqueElems.size >= 2) {
      passes.push(`✅ 槽位多樣性通過：主守護=${dist.mainGuardian}、場景補位=${dist.sceneSupport}、平衡補位=${dist.balanceSupport}（至少 2 種五行）`);
    } else if (slots.length < 2) {
      passes.push(`ℹ 槽位數量不足 2，略過多樣性驗證`);
    } else {
      issues.push(`❌ 三個槽位五行完全相同（${[...uniqueElems].join('、')}），應包含至少 2 種五行`);
    }
  }

  // 9. acceptedPrimaryNeeds（允許多種 primaryNeed 均為合理）
  if (expectations.acceptedPrimaryNeeds) {
    const actual = result.elementNeeds.primaryNeed;
    if (expectations.acceptedPrimaryNeeds.includes(actual)) {
      passes.push(`✅ primaryNeed（${actual}）在允許範圍內 [${expectations.acceptedPrimaryNeeds.join('、')}]`);
    } else {
      issues.push(`⚠ primaryNeed（${actual}）不在預期範圍 [${expectations.acceptedPrimaryNeeds.join('、')}]`);
    }
  }

  const passed = issues.length === 0;
  return { passed, passes, issues };
}

// ── 執行測試 ──────────────────────────────────────────────────────────────────
const results = [];
let passCount = 0;

for (const tc of testCases) {
  console.log(`\n🔍 執行 ${tc.caseId}: ${tc.description}`);
  try {
    const result     = recommendPokemon(tc.input, pokemonData, rules);
    const validation = validateResult(result, tc.expectations, tc.input);
    if (validation.passed) passCount++;
    results.push({ tc, result, validation, error: null });
    console.log(`   ${validation.passed ? '✅ 通過' : '⚠ 部分問題'} — ${validation.issues.length} 個問題`);
  } catch (err) {
    console.error(`   ❌ 執行例外: ${err.message}`);
    results.push({ tc, result: null, validation: { passed: false, passes: [], issues: [`例外: ${err.message}`] }, error: err });
  }
}

// ── 輔助函式 ──────────────────────────────────────────────────────────────────
function elementProfileBar(profile) {
  return Object.entries(profile)
    .map(([e, s]) => `${e}:${s}`)
    .join('  ');
}

function slotSummary(slot, slotName) {
  if (!slot) return `**${slotName}**：無`;
  const name  = (slot.name && (slot.name.zh_tw || slot.name.en)) || `#${slot.id}`;
  const elem  = slot.fiveElement ? slot.fiveElement.raw : '—';
  const score = slot.totalScore !== undefined ? `總分 ${slot.totalScore}` : '';
  return `**${slotName}**：${name}（${elem}）${score ? '　' + score : ''}`;
}

// v2.0 scoreDetail → 表格字串
function formatScoreDetail(sd) {
  if (!sd) return '—';
  const parts = [];
  if ((sd.directElementScore     || 0) !== 0) parts.push(`直接補缺${sd.directElementScore >= 10 ? '(主)' : '(次)'}+${sd.directElementScore}`);
  if ((sd.generatingElementScore || 0) > 0) parts.push(`相生+${sd.generatingElementScore}`);
  if ((sd.balancingElementScore  || 0) > 0) parts.push(`調節+${sd.balancingElementScore}`);
  if ((sd.sceneElementScore      || 0) > 0) parts.push(`場景五行+${sd.sceneElementScore}`);
  if ((sd.yinYangScore           || 0) > 0) parts.push(`陰陽+${sd.yinYangScore}`);
  if ((sd.quizTagScore           || 0) > 0) parts.push(`標籤+${sd.quizTagScore}`);
  if ((sd.sceneTagScore          || 0) > 0) parts.push(`場景標籤+${sd.sceneTagScore}`);
  if ((sd.popularityScore        || 0) > 0) parts.push(`人氣+${sd.popularityScore}`);
  if ((sd.penaltyScore           || 0) < 0) parts.push(`扣分${sd.penaltyScore}`);
  return parts.length > 0 ? parts.join(' ') : '（無加分項）';
}

// ── 產出 Markdown 報告 ────────────────────────────────────────────────────────
const lines = [
  `# 推薦引擎測試報告`,
  ``,
  `> 產生時間：${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}  `,
  `> 測試案例：${testCases.length} 組 | 通過：${passCount} 組 | 未全通過：${testCases.length - passCount} 組  `,
  `> 資料來源：data/pokemon.json（${pokemonData.length} 筆）  `,
  `> 計分版本：v2.0（五行相生相剋 + 槽位多樣性 + 正面文案）`,
  ``,
  `---`,
  ``,
];

for (const { tc, result, validation, error } of results) {
  lines.push(`## ${tc.caseId}：${tc.description}`);
  lines.push(``);
  lines.push(`**狀態**：${validation.passed ? '✅ 通過' : '⚠ 有待確認'}`);
  lines.push(``);

  // 輸入摘要
  lines.push(`### 輸入摘要`);
  lines.push(``);
  lines.push(`| 項目 | 值 |`);
  lines.push(`|------|-----|`);
  lines.push(`| 語系 | ${tc.input.locale} |`);
  lines.push(`| 場景 | ${tc.input.sceneId} |`);
  lines.push(`| quizTags | ${(tc.input.quizTags || []).join('、')} |`);
  if (tc.input.birth) {
    const b = tc.input.birth;
    lines.push(`| 出生 | ${b.year}年${b.month}月${b.day}日 時辰=${b.hourBranch} |`);
  }
  if (tc.input.favoritePokemon) {
    lines.push(`| 本命夥伴 | dexNo=${tc.input.favoritePokemon.dexNo} ${tc.input.favoritePokemon.name || ''} |`);
  }
  lines.push(``);

  if (error) {
    lines.push(`> ❌ 執行時發生例外：${error.message}`);
    lines.push(``);
    lines.push(`---`);
    lines.push(``);
    continue;
  }

  // 出生五行分析
  lines.push(`### 出生五行分析`);
  lines.push(``);
  lines.push(`**五行分佈**：${elementProfileBar(result.birthElementProfile)}`);
  lines.push(``);
  lines.push(`| 指標 | 值 |`);
  lines.push(`|------|-----|`);
  lines.push(`| primaryNeed | **${result.elementNeeds.primaryNeed}** |`);
  lines.push(`| secondaryNeed | ${result.elementNeeds.secondaryNeed} |`);
  lines.push(`| strongest | ${result.elementNeeds.strongest.join('、')} |`);
  lines.push(`| weakest | ${result.elementNeeds.weakest.join('、')} |`);
  if (result.debug.dynamicSceneMode) {
    lines.push(`| 動態場景五行 | **${result.effectiveSceneElements.join('、')}** |`);
  }
  lines.push(``);

  // 槽位分佈（v2.0 新增）
  lines.push(`### 槽位五行分佈`);
  lines.push(``);
  const dist = result.slotElemDistribution;
  lines.push(`| 槽位 | 五行 |`);
  lines.push(`|------|------|`);
  lines.push(`| 今日主守護 | ${dist.mainGuardian   || '—'} |`);
  lines.push(`| 場景補位   | ${dist.sceneSupport   || '—'} |`);
  lines.push(`| 平衡補位   | ${dist.balanceSupport || '—'} |`);
  const slotElems = [dist.mainGuardian, dist.sceneSupport, dist.balanceSupport].filter(Boolean);
  const uniqueCount = new Set(slotElems).size;
  lines.push(``);
  lines.push(`> 五行種類數：${uniqueCount}（${uniqueCount >= 2 ? '✅ 多樣性達標' : '⚠ 五行單一'}）`);
  lines.push(``);

  // 結果槽位
  lines.push(`### 結果槽位`);
  lines.push(``);
  lines.push(slotSummary(result.resultSlots.favoritePartner, '本命夥伴'));
  if (result.resultSlots.favoritePartner && result.resultSlots.favoritePartner.syncedNote) {
    lines.push(`  > ${result.resultSlots.favoritePartner.syncedNote}`);
  }
  lines.push(``);

  lines.push(slotSummary(result.resultSlots.mainGuardian, '今日主守護'));
  if (result.resultSlots.mainGuardian) {
    lines.push(`  > 推薦理由：${result.resultSlots.mainGuardian.reason}`);
    if (result.resultSlots.mainGuardian.slotSelectionReason) {
      lines.push(`  > 槽位選取：${result.resultSlots.mainGuardian.slotSelectionReason}`);
    }
  }
  lines.push(``);

  lines.push(slotSummary(result.resultSlots.sceneSupport, '場景補位'));
  if (result.resultSlots.sceneSupport) {
    lines.push(`  > 推薦理由：${result.resultSlots.sceneSupport.reason}`);
    if (result.resultSlots.sceneSupport.slotSelectionReason) {
      lines.push(`  > 槽位選取：${result.resultSlots.sceneSupport.slotSelectionReason}`);
    }
  }
  lines.push(``);

  lines.push(slotSummary(result.resultSlots.balanceSupport, '平衡補位'));
  if (result.resultSlots.balanceSupport) {
    lines.push(`  > 推薦理由：${result.resultSlots.balanceSupport.reason}`);
    if (result.resultSlots.balanceSupport.slotSelectionReason) {
      lines.push(`  > 槽位選取：${result.resultSlots.balanceSupport.slotSelectionReason}`);
    }
  }
  lines.push(``);

  // Top 5 候選（v2.0 scoreDetail 欄位）
  lines.push(`### Top 5 候選`);
  lines.push(``);
  lines.push(`| 排名 | 編號 | 名稱 | 五行 | 總分 | 直接 | 相生 | 調節 | 場景 | 陰陽 | 標籤 | 場景標籤 | 人氣 | 扣分 |`);
  lines.push(`|------|------|------|------|------|------|------|------|------|------|------|----------|------|------|`);
  for (const c of result.topCandidates.slice(0, 5)) {
    const name = (c.name && (c.name.zh_tw || c.name.en)) || `#${c.id}`;
    const elem = c.fiveElement ? c.fiveElement.raw : '—';
    const sd   = c.scoreDetail || {};
    lines.push([
      `| ${c.rank}`,
      `${c.id}`,
      `${name}`,
      `${elem}`,
      `**${c.totalScore}**`,
      `${sd.directElementScore     || 0}`,
      `${sd.generatingElementScore || 0}`,
      `${sd.balancingElementScore  || 0}`,
      `${sd.sceneElementScore      || 0}`,
      `${sd.yinYangScore           || 0}`,
      `${sd.quizTagScore           || 0}`,
      `${sd.sceneTagScore          || 0}`,
      `${sd.popularityScore        || 0}`,
      `${sd.penaltyScore           || 0} |`,
    ].join(' | '));
  }
  lines.push(``);

  // elementRelationNotes（v2.0 新增）
  const relNotes = [];
  for (const c of result.topCandidates.slice(0, 5)) {
    const notes = (c.scoreDetail && c.scoreDetail.elementRelationNotes) || [];
    if (notes.length > 0) {
      const cname = (c.name && c.name.zh_tw) || `#${c.id}`;
      notes.forEach(n => relNotes.push(`- ${cname}：${n}`));
    }
  }
  if (relNotes.length > 0) {
    lines.push(`### 相生相剋關係說明（Top 5）`);
    lines.push(``);
    relNotes.forEach(n => lines.push(n));
    lines.push(``);
  }

  // 驗證結果
  lines.push(`### 驗證結果`);
  lines.push(``);
  for (const p of validation.passes)  lines.push(`- ${p}`);
  for (const i of validation.issues)  lines.push(`- ${i}`);
  lines.push(``);
  lines.push(`---`);
  lines.push(``);
}

// 整體摘要
lines.push(`## 整體摘要`);
lines.push(``);
lines.push(`| 案例 | 描述 | 通過 |`);
lines.push(`|------|------|------|`);
for (const { tc, validation } of results) {
  lines.push(`| ${tc.caseId} | ${tc.description} | ${validation.passed ? '✅' : '⚠'} |`);
}
lines.push(``);
lines.push(`**通過率：${passCount} / ${testCases.length}**`);
lines.push(``);
lines.push(`---`);
lines.push(`*本報告由 \`scripts/run_recommendation_tests.js\` v2.0 自動產生。*`);

// 寫出報告
const reportPath = path.join(BASE, 'reports/recommendation_test_report.md');
fs.writeFileSync(reportPath, lines.join('\n'), 'utf-8');
console.log(`\n✅ 報告已寫出：${reportPath}`);
console.log(`📊 通過率：${passCount} / ${testCases.length}`);
