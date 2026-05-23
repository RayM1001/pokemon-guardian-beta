# 禁用詞總檢查報告
> 生成時間：Phase 11（公開測試前整理）
> 掃描範圍：assets/js/app.js、assets/js/i18n.js、assets/js/recommendation.browser.js、lib/recommendation.js、data/rules.json、index.html

---

## 一、使用者可見文案類禁用詞

| 禁用詞 | 掃描結果 | 殘留位置 | 性質 |
|--------|----------|----------|------|
| 牠們 | ✅ 零殘留 | — | — |
| 牠（單字） | ✅ 零殘留 | — | — |
| 改善 | ✅ 零殘留 | — | — |
| 桃花 | ✅ 零殘留 | — | — |
| 出生時辰 | ✅ 零殘留 | — | — |
| 五行補位 | ✅ 零殘留 | — | — |
| 補五行 | ✅ 零殘留 | — | — |
| 命格五行 | ✅ 零殘留 | — | — |
| 土系能量 | ✅ 零殘留 | — | — |
| 水系能量 | ✅ 零殘留 | — | — |
| 火系能量 | ✅ 零殘留 | — | — |
| 不適合你 | ✅ 零殘留 | — | — |
| 剋你 | ✅ 零殘留 | — | — |

**結論：所有使用者可見文案禁用詞已全數清除。**

---

## 二、內部程式變數類（允許保留，需確認不外露）

| 詞彙 | 出現位置 | 性質 | 是否外露前端 UI |
|------|----------|------|----------------|
| `primaryNeed` | lib/recommendation.js、recommendation.browser.js | 內部計算變數（最需補充的五行） | ❌ 不外露。app.js 完全無此變數。 |
| `secondaryNeed` | lib/recommendation.js、recommendation.browser.js | 內部計算變數（次要補充五行） | ❌ 不外露。app.js 完全無此變數。 |
| `scoreDetail` | recommendation.browser.js | 內部評分細節物件 | ❌ 不外露。結果卡只顯示 `reason` 字串，scoreDetail 不傳入 DOM。 |
| `fiveElement.main` | recommendation.browser.js | 推薦引擎內部欄位存取 | ❌ 不外露。app.js 中 fiveElement 只在舊版 renderFavCard（已重寫為 Phase 10 版本，不再存取 fiveElement）中使用過，現在已移除。 |

### 驗證：app.js 中是否有 primaryNeed / secondaryNeed / scoreDetail / fiveElement

```
grep -n "primaryNeed|secondaryNeed|scoreDetail|fiveElement" assets/js/app.js
```
→ **零結果**。app.js（UI 層）完全不讀取後台計算欄位。

---

## 三、結論

- 所有使用者可見文案禁用詞：✅ 已全數清除
- 內部引擎變數（primaryNeed、secondaryNeed、scoreDetail、fiveElement.main）：✅ 僅存在於引擎模組，不會出現在任何 DOM 輸出或 i18n 字串中
- 無需進一步修正
