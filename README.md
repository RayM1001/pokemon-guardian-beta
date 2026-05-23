# 你的寶可夢守護位

非官方粉絲向互動測驗。根據出生日期、目前狀態與生活場景，推薦適合今日配置的寶可夢守護位。

> 本專案為非官方粉絲創作，與任何官方寶可夢授權無關。  
> 官方 30 週年圖案需前往官方網站查看，並依官方利用規約使用。

---

## 啟動方式

### 本機開發

```bash
cd pokemon-guardian-game
python3 -m http.server 8000
```

打開瀏覽器，前往 `http://localhost:8000`

（Node.js 版本）
```bash
npx serve .
```

> **注意**：不要直接以 `file://` 開啟 `index.html`，瀏覽器的 CORS 限制會造成 JSON 載入失敗。

---

## 部署到 GitHub Pages

### 步驟

1. **建立 GitHub Repository**：前往 [github.com/new](https://github.com/new)，建立新的 public repository（例如 `pokemon-guardian-game`）

2. **推送專案到 repository**：
   ```bash
   cd pokemon-guardian-game
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<你的帳號>/<repo名稱>.git
   git push -u origin main
   ```

3. **開啟 GitHub Pages 設定**：
   - 前往 repository → **Settings** → **Pages**
   - **Source**：選擇 `Deploy from a branch`
   - **Branch**：選擇 `main`
   - **Folder**：選擇 `/ (root)`
   - 點擊 **Save**

4. **等待部署完成**：約 1～3 分鐘後，頁面頂部會顯示網址（格式為 `https://<帳號>.github.io/<repo名稱>/`）

5. **測試部署結果**：
   - 開啟生成的網址
   - 確認首頁正常載入
   - 走一次完整測驗流程（Step 1 → Step 5）
   - 確認分享圖片可下載
   - 確認回饋表單可開啟

### 常見問題

> **JSON 載入失敗**（Error 畫面或 Console 出現 404）  
> 優先檢查 `assets/js/app.js` 中的 fetch 路徑是否為 `data/pokemon.json`（相對路徑）。  
> 若誤寫成 `/data/pokemon.json`（根目錄絕對路徑），在 `username.github.io/repo-name/` 的子路徑部署下會找不到檔案。

> **HTTPS 與剪貼簿**  
> GitHub Pages 自動提供 HTTPS，`navigator.clipboard.writeText()` 在 HTTPS 環境下可正常運作。

> **.nojekyll 已設定**  
> 根目錄的 `.nojekyll` 檔案已建立，避免 GitHub Pages 的 Jekyll 處理干擾靜態資源。

---

## 測驗流程

1. **Step 1**：選出你最喜歡的本命夥伴（可略過）
2. **Step 2**：輸入出生日期與時段
3. **Step 3**：回答四道心理狀態題
4. **Step 4**：選擇今天想配置的生活場景
5. **Step 5**：查看今日寶可夢守護位配置結果，並可分享文字或圖片

---

## 檔案結構

```
pokemon-guardian-game/
├── index.html                         # 主頁面
├── data/
│   ├── pokemon.json                   # 1025 筆寶可夢資料（唯讀）
│   └── rules.json                     # 測驗規則與五行對照表
├── lib/
│   └── recommendation.js              # 推薦引擎（Node.js 版，供測試使用）
├── assets/
│   ├── js/
│   │   ├── app.js                     # 主前端邏輯（UI 流程、Canvas 分享圖）
│   │   ├── i18n.js                    # 三語系文字（繁中 / English / 日本語）
│   │   └── recommendation.browser.js  # 推薦引擎（瀏覽器 IIFE 版）
│   └── css/
│       └── styles.css                 # 全站樣式
├── scripts/
│   └── run_recommendation_tests.js    # Node.js 推薦引擎測試（10 個案例）
└── reports/                           # 公開測試前整理文件
    ├── forbidden_terms_check.md
    ├── official_asset_usage_check.md
    ├── frontend_data_exposure_check.md
    ├── public_beta_checklist.md
    └── beta_feedback_questions.md
```

---

## Beta 測試回饋

### 如何設定 FEEDBACK_FORM_URL

在 `assets/js/app.js` 頂部找到：

```javascript
const FEEDBACK_FORM_URL = '';
```

將 Google 表單（或其他回饋表單）的分享連結填入引號內，例如：

```javascript
const FEEDBACK_FORM_URL = 'https://forms.gle/xxxxxxxxxxxx';
```

設定後，首頁與結果頁的「回報測試感受」按鈕會直接以新分頁開啟表單。  
若保持空字串，按鈕仍顯示，點擊時提示「回饋表單尚未設定。」

### 如何邀請測試者

1. 以 `python3 -m http.server 8000` 啟動本機版本（限本機測試）
2. 或將專案部署至靜態托管服務（GitHub Pages、Netlify、Vercel 等），取得公開網址
3. 將網址傳給測試者，測試者**不需要登入**任何帳號
4. 測試者可直接在瀏覽器開啟，無需安裝任何程式

### 測試者隱私說明

- 測試者的出生日期與測驗選擇只儲存在**本機 localStorage**，不上傳至任何伺服器
- 本專案不包含任何追蹤碼（GA、Pixel 等）
- 關閉瀏覽器分頁即停止所有資料存取

---

## 官方素材使用說明

- 本專案**不直接展示**官方 30 週年圖片
- 結果頁提供「前往官方頁面」外部連結按鈕（`<a href>` 形式），讓使用者自行前往官方網站
- 所有視覺元素（圓形佔位符、屬性配色、分享圖片）均以 CSS、Canvas API、官方屬性色重新實作，不載入任何官方圖片

---

## 隱私說明

- 出生日期、測驗選擇與本命夥伴均**只儲存在本機 localStorage**
- 不上傳任何資料至伺服器
- 重新整理後可從 localStorage 還原上次進度
- 清除瀏覽器快取或以無痕模式開啟，即可完全重置

---

## 已知限制

- 本測驗為簡化互動設計，不是精確命理排盤或占卜工具
- 出生日期與時段僅作為能量分析參考，結果為娛樂性配置建議
- 推薦結果為粉絲向娛樂與空間配置靈感，不代表任何官方或心理學依據
- 官方 30 週年圖案需前往官方寶可夢網站查看，並依官方利用規約使用
- 寶可夢名稱資料來源為公開圖鑑資訊，不使用官方商標圖像

---

## 語系支援

| 語系 | 代碼 | 完整程度 |
|------|------|----------|
| 繁體中文 | `zh_tw` | 完整 |
| English | `en` | 完整 |
| 日本語 | `ja` | 完整 |

---

## 測試方式

### Node.js 推薦引擎測試

```bash
node scripts/run_recommendation_tests.js
```

預期輸出：`📊 通過率：10 / 10`

測試涵蓋 10 個案例：

- 不同場景（臥室、辦公室、書桌、玄關、隨身包）
- 不同五行偏重的使用者
- 本命夥伴不被排除（耿鬼案例）
- 元素多樣性約束（MAX_SAME_ELEM=2）

### 本機瀏覽器測試流程

1. `python3 -m http.server 8000` 啟動本機伺服器
2. 開啟 `http://localhost:8000`
3. 完整走過 Step 1 → 5，確認推薦結果正常
4. 切換三語系，確認文案同步更新
5. 重新整理頁面，確認 localStorage 還原
6. 開啟 DevTools → Console，確認無錯誤
7. 開啟 DevTools → Network，確認未載入外部圖片

### 手機與平板測試建議

- iOS Safari：確認分享按鈕可複製文字
- Android Chrome：確認 Canvas 分享圖片可長按儲存
- iPad（768px 以上）：確認版面正常，不過度拉伸
- 小螢幕（375px）：確認步驟卡片、結果卡片皆可正常捲動

---

## 版本紀錄

| Phase | 內容 |
|-------|------|
| Phase 8 | 結果頁 UI 修正（單欄卡片、移除五行標籤、Canvas 修正、能量總結） |
| Phase 8.5 | 全站禁用詞清理（牠們/牠、改善、桃花、出生時辰、五行補位 等） |
| Phase 9 | 官方屬性配色系統（18 種屬性色、WCAG 文字對比、分享圖片同步） |
| Phase 10 | Step 1 本命夥伴確認卡重寫（移除五行/陰陽/后台標籤，加入屬性色與說明文案） |
| Phase 11 | 公開測試前整理（禁用詞報告、官方素材報告、UI 露出報告、README、Beta 清單） |
