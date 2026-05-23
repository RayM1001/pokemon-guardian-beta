# 官方素材使用總檢查報告
> 生成時間：Phase 11（公開測試前整理）

---

## 一、official30th.link 使用位置總覽

### 掃描指令
```
grep -rn "official30th" assets/ index.html
```

### 結果

| 位置 | 行號 | 用途 | 是否合規 |
|------|------|------|----------|
| `assets/js/recommendation.browser.js:10` | 程式碼頭部注釋 | 說明限制：不嵌入圖片 | ✅ 注釋，非實際使用 |
| `assets/js/recommendation.browser.js:304` | `officialLink: pokemon.official30th?.link` | 從資料層取出連結字串，傳入結果物件 | ✅ 僅取值，非 img src |
| `assets/js/recommendation.browser.js:366` | `officialLink: found.official30th?.link` | 同上（本命夥伴槽位） | ✅ 僅取值，非 img src |
| `assets/js/recommendation.browser.js:460` | `officialLink: s.pokemon.official30th?.link` | 同上（各槽位） | ✅ 僅取值，非 img src |
| `assets/js/app.js:8` | 程式碼頭部注釋 | 說明限制：不以 img src 使用 | ✅ 注釋 |
| `assets/js/app.js:840` | 程式碼注釋 | IMPORTANT 警告標記 | ✅ 注釋 |
| `assets/js/app.js:870` | `href="${officialLink}"` | 外部連結按鈕 `<a href>` | ✅ 合規：只用作 href |
| `index.html:16` | HTML 注釋 | 開頭版權聲明注釋 | ✅ 注釋 |
| `index.html:45` | HTML 注釋 | 使用限制說明 | ✅ 注釋 |

---

## 二、逐項確認

### 1. official30th.link 只作外部連結 href

✅ **確認**。`assets/js/app.js` 中的唯一實際使用：
```html
<a class="result-official-link"
   href="${officialLink}"
   target="_blank"
   rel="noopener noreferrer">
```
連結帶有 `target="_blank"` 與 `rel="noopener noreferrer"`，符合安全外部連結規範。

### 2. official30th.link 沒有出現在 img src

✅ **確認**。掃描指令：
```
grep -rn "src.*official30th|official30th.*src" assets/ index.html
```
→ 零結果（注釋行除外，注釋中已說明「不得用作 img src」）。

### 3. official30th.link 沒有出現在 CSS background-image

✅ **確認**。掃描指令：
```
grep -rn "background.*official30th|url.*official30th" assets/ index.html
```
→ 零結果。

### 4. 分享圖片沒有載入官方圖片

✅ **確認**。`generateShareCanvas()` 使用純 Canvas API 繪製：
- 圓形佔位符（typeColor 填色）
- 文字（寶可夢名稱、編號）
- 屬性標籤色塊
- 無任何 `Image` 物件載入、無任何外部 URL 請求。

### 5. 結果卡沒有載入官方圖片

✅ **確認**。`buildResultCard()` 只生成：
- 文字圓形佔位符（CSS + 屬性色 inline style）
- 名稱、編號、屬性 badge、推薦理由文字
- 官方連結按鈕（`<a href>`）
- 無任何 `<img>` 標籤。

### 6. 首頁沒有使用官方 Logo

✅ **確認**。`index.html` 無任何 `<img>` 標籤或 CSS background-image 載入官方素材。標題使用純文字「寶可夢守護位」。

### 7. 專案內沒有下載或快取官方 30 週年圖片

✅ **確認**。專案目錄內無 `.png`/`.jpg`/`.webp`/`.gif` 官方圖片檔案。所有視覺元素均以 CSS、Canvas、emoji 實現。

---

## 三、結論

所有官方素材使用規則均合規。`official30th.link` 僅作為 `<a href>` 外部連結，不作為任何圖片來源。
