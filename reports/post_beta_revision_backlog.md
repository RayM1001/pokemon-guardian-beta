# Post-Beta Revision Backlog

> 本文件記錄 Phase 15A 視覺升級後，後續可繼續優化的項目清單。
> 優先順序為建議值，可依實際測試回饋調整。

---

## B-01｜分享圖片字體嵌入（高優先）

**現況**：Canvas `font` 使用系統 `sans-serif`，不同裝置/OS 渲染結果不一致（Windows 黑體、macOS 蘋方、Android Noto 各異）。  
**建議**：使用 `FontFace` API 在 `generateShareCanvas` 前預載一款 Google Fonts 字體（如 Noto Sans TC），確保 CJK 跨平台一致性。  
**風險**：需要網路請求，離線環境下需 fallback。

---

## B-02｜PWA / 離線支援（中優先）

**現況**：純靜態網頁，無 Service Worker。重整頁面需重新載入 `data/pokemon.json`。  
**建議**：新增 `manifest.json` 與基本 Service Worker，快取 JSON 與靜態資源，提供「加到主畫面」體驗。  
**風險**：Cache 版本管理需配合未來資料更新。

---

## B-03｜結果頁「重新測驗」動畫（低優先）

**現況**：點擊「重新測驗」直接切換回首頁，無過渡動畫。  
**建議**：加入 fade-out → fade-in 頁面切換動畫（約 200ms），提升流暢感。  
**限制**：需確認 `prefers-reduced-motion` 時完全跳過。

---

## B-04｜本命夥伴確認卡 UI 精修（中優先）

**現況**：Step 2 確認卡排版為純文字列表，與 Phase 15A 新卡片風格落差較大。  
**建議**：重製確認卡為收藏卡樣式（同結果頁 result-pair），加入屬性配色 accent 條與圓形 placeholder。  
**依賴**：不得影響 `slotFavorite` 推薦邏輯。

---

## B-05｜多語系 OG / Twitter Card meta（低優先）

**現況**：`index.html` 只有基本 `<meta name="description">`，無 Open Graph 標籤。  
**建議**：新增 `og:title`、`og:description`、`og:image`（可用自製 1200×630 靜態預覽圖）。  
**注意**：OG image 不得使用任何官方圖片素材。

---

## B-06｜無障礙強化（中優先）

**現況**：場景選擇卡 `aria-label` 僅有場景名稱，動畫未完全配合 `prefers-reduced-motion` 在所有瀏覽器版本中生效。  
**建議**：
- 為所有互動元素補齊 `aria-label` / `role`
- 確認 Tab 鍵順序符合閱讀流程
- 驗證 WCAG 2.1 AA 對比度（特別是屬性色 chip 文字）

---

## B-07｜推薦引擎擴充：新寶可夢資料（依需求）

**現況**：`data/pokemon.json` 收錄寶可夢數量為 Phase 1 版本，部分新世代未收錄。  
**建議**：待社群測試回饋確認現有推薦品質後，再擴充 JSON 資料集。  
**限制**：修改 `data/pokemon.json` 需同步更新測試案例，確保 Node 測試仍 10/10。

---

*最後更新：Phase 15A 完成時（2026-05-24）*
