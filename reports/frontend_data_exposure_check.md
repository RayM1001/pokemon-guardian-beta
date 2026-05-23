# 前端 UI 資料露出檢查報告
> 生成時間：Phase 11（公開測試前整理）

---

## 一、Step 1 本命夥伴選擇區

### 搜尋結果卡 (`renderSearchResults`)
| 顯示欄位 | 狀態 |
|----------|------|
| 圖鑑編號 | ✅ 顯示 |
| 寶可夢名稱（依語系） | ✅ 顯示 |
| 五行氣質 / 陰陽 | ✅ 不顯示 |
| 後台分數 / 聯想詞 / 心理狀態 | ✅ 不顯示 |

### 選定後確認卡 (`renderFavCard`)
| 顯示欄位 | 狀態 |
|----------|------|
| 已選擇狀態標題（favSelectedTitle） | ✅ 顯示 |
| 圖鑑編號 | ✅ 顯示 |
| 寶可夢名稱（依語系） | ✅ 顯示 |
| 官方屬性 badge（依語系、屬性色） | ✅ 顯示 |
| 說明文案（favSelectedNote） | ✅ 顯示 |
| 五行氣質 / 陰陽 / elemClass | ✅ 不顯示（Phase 10 已移除） |
| primaryNeed / secondaryNeed | ✅ 不顯示 |
| scoreDetail / fiveElement | ✅ 不顯示 |
| 聯想詞語 / 心理狀態 | ✅ 不顯示 |

---

## 二、Step 2 出生資料區 (`renderStep2`)

| 顯示欄位 | 狀態 |
|----------|------|
| 出生年月日輸入 | ✅ 顯示（使用者輸入，非後台資料） |
| 出生時段（時辰）下拉 | ✅ 顯示（時段文字，非地支五行標籤） |
| 五行推算結果 | ✅ 不顯示 |
| 陰陽 | ✅ 不顯示 |
| 命格五行 / 出生時辰術語 | ✅ 不顯示 |

---

## 三、Step 3 心理測驗區 (`renderStep3`)

| 顯示欄位 | 狀態 |
|----------|------|
| 題目文字（依語系） | ✅ 顯示 |
| 選項文字（依語系） | ✅ 顯示 |
| 題目背後的 quizTags / elementScore | ✅ 不顯示（選項僅顯示 label） |
| 五行推算標籤 | ✅ 不顯示 |

---

## 四、Step 4 場景選擇區 (`renderStep4`)

| 顯示欄位 | 狀態 |
|----------|------|
| 場景名稱（依語系） | ✅ 顯示 |
| 場景語氣描述（依語系） | ✅ 顯示 |
| 場景的 fiveElement / sceneId | ✅ 不顯示（僅顯示文字，不顯示後台屬性） |

---

## 五、Step 5 結果頁 (`renderStep5` / `buildResultCard`)

| 顯示欄位 | 狀態 |
|----------|------|
| 寶可夢編號 | ✅ 顯示 |
| 寶可夢名稱（依語系） | ✅ 顯示 |
| 官方屬性 badge（依語系） | ✅ 顯示 |
| 槽位名稱（本命夥伴、今日主守護、場景、平衡） | ✅ 顯示 |
| 推薦理由（自然語言，無術語） | ✅ 顯示 |
| 官方 30 週年外部連結按鈕 | ✅ 顯示（`<a href>` 只） |
| 今日能量分析總結（energySummary） | ✅ 顯示 |
| 五行氣質標籤 | ✅ 不顯示（Phase 8 已移除） |
| 陰陽 | ✅ 不顯示 |
| totalScore / scoreDetail | ✅ 不顯示 |
| primaryNeed / secondaryNeed | ✅ 不顯示 |
| directElementScore / generatingElementScore / balancingElementScore | ✅ 不顯示 |
| fiveElement.main | ✅ 不顯示 |
| psychStates / keywords | ✅ 不顯示 |
| 五行補位 / 補五行 等術語 | ✅ 不顯示 |

### 推薦理由文案範例確認

`buildRecommendationReason()` 輸出的 `reason` 字串使用自然語言，例如：

- 「能量平衡，守護今日的穩定節奏」
- 「適合這個場景的氣息，帶來輕盈感」

不包含「primaryNeed」「directElementScore」「五行補位」等後台術語。

---

## 六、今日能量分析總結區 (`renderEnergySummary`)

| 顯示欄位 | 狀態 |
|----------|------|
| 元素能量佔比（成長/活力/穩定/清晰/修復） | ✅ 顯示（以 I18N.elemLabelText() 轉換，非五行術語） |
| 元素百分比數字 | ✅ 顯示 |
| 五行術語（木/火/土/金/水 標籤） | ✅ 不直接顯示（僅顯示中性標籤） |
| 後台推算細節 | ✅ 不顯示 |

---

## 七、結論

前端 UI 完全不暴露以下後台欄位：

- 五行氣質、陰陽
- primaryNeed、secondaryNeed
- scoreDetail、totalScore
- directElementScore、generatingElementScore、balancingElementScore
- fiveElement.main
- psychStates、keywords
- 五行補位、補五行、命格五行等術語

使用者可見的資料均為：編號、名稱、屬性、槽位名稱、推薦理由、能量標籤（已中性化）、說明文案。
