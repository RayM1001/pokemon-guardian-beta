# 寶可夢資料轉換品質報告

> 產生時間：2026-05-23 07:11:39  
> 來源：`source/pokemon_table.md`

---

## 1. 解析筆數

| 項目 | 數值 |
|---|---|
| 成功解析筆數 | **1025** |
| 目標筆數 | 1025 |
| 是否達標 | ✅ 是 |

---

## 2. 重複編號

✅ 無重複編號

---

## 3. 缺少編號的列

✅ 1–1025 編號完整

---

## 4. 缺少中文名稱

✅ 無問題

---

## 5. 缺少日文名稱

✅ 無問題

---

## 6. 缺少英文名稱

✅ 無問題

---

## 7. 圖片連結缺失或解析失敗

✅ 無問題

---

## 8. 屬性解析失敗

✅ 無問題

---

## 9. 特性解析失敗

✅ 無問題

---

## 10. 五行主行解析失敗

✅ 無問題

---

## 11. 陰陽解析失敗

✅ 無問題

---

## 12. 人氣評分異常（不在 1-5）

✅ 無問題

---

## 13. 欄位數不一致的 Markdown 列

✅ 無欄位數不一致的列

---

## 14. 所有問題清單（共 0 條）

✅ 無任何問題

---

## 15. 前 5 筆轉換後 JSON 範例

```json
[
  {
    "id": "0001",
    "dexNo": 1,
    "slug": "bulbasaur",
    "official30th": {
      "fileName": "0001.png",
      "link": "https://www.pokemon.co.jp/ex/30th_logo/assets/img/download/0001.png",
      "previewAllowed": false,
      "usageNote": "公開版結果頁僅提供外部連結，不直接嵌入或重新散布官方圖片。"
    },
    "name": {
      "zh_tw": "妙蛙種子",
      "ja": "フシギダネ",
      "en": "Bulbasaur"
    },
    "types": {
      "zh_tw": [
        "草",
        "毒"
      ],
      "ja": [
        "くさ",
        "どく"
      ],
      "en": [
        "Grass",
        "Poison"
      ]
    },
    "abilities": {
      "zh_tw": [
        "茂盛",
        "葉綠素"
      ],
      "ja": [
        "しんりょく",
        "ようりょくそ"
      ],
      "en": [
        "Overgrow",
        "Chlorophyll"
      ]
    },
    "color": {
      "zh_tw": "綠色",
      "ja": "緑色",
      "en": "Green"
    },
    "keywords": [
      "成長",
      "修復",
      "安定",
      "效率",
      "守護"
    ],
    "psychStates": [
      "療癒",
      "成長",
      "茁壯",
      "警覺",
      "防衛"
    ],
    "fiveElement": {
      "raw": "陰木",
      "yinYang": "陰",
      "main": "木"
    },
    "popularityScore": 5,
    "sourceRow": 1
  },
  {
    "id": "0002",
    "dexNo": 2,
    "slug": "ivysaur",
    "official30th": {
      "fileName": "0002.png",
      "link": "https://www.pokemon.co.jp/ex/30th_logo/assets/img/download/0002.png",
      "previewAllowed": false,
      "usageNote": "公開版結果頁僅提供外部連結，不直接嵌入或重新散布官方圖片。"
    },
    "name": {
      "zh_tw": "妙蛙草",
      "ja": "フシギソウ",
      "en": "Ivysaur"
    },
    "types": {
      "zh_tw": [
        "草",
        "毒"
      ],
      "ja": [
        "くさ",
        "どく"
      ],
      "en": [
        "Grass",
        "Poison"
      ]
    },
    "abilities": {
      "zh_tw": [
        "茂盛",
        "葉綠素"
      ],
      "ja": [
        "しんりょく",
        "ようりょくそ"
      ],
      "en": [
        "Overgrow",
        "Chlorophyll"
      ]
    },
    "color": {
      "zh_tw": "綠色",
      "ja": "緑色",
      "en": "Green"
    },
    "keywords": [
      "成長",
      "修復",
      "安定",
      "效率",
      "守護"
    ],
    "psychStates": [
      "療癒",
      "成長",
      "茁壯",
      "警覺",
      "防衛"
    ],
    "fiveElement": {
      "raw": "陰木",
      "yinYang": "陰",
      "main": "木"
    },
    "popularityScore": 4,
    "sourceRow": 2
  },
  {
    "id": "0003",
    "dexNo": 3,
    "slug": "venusaur",
    "official30th": {
      "fileName": "0003.png",
      "link": "https://www.pokemon.co.jp/ex/30th_logo/assets/img/download/0003.png",
      "previewAllowed": false,
      "usageNote": "公開版結果頁僅提供外部連結，不直接嵌入或重新散布官方圖片。"
    },
    "name": {
      "zh_tw": "妙蛙花",
      "ja": "フシギバナ",
      "en": "Venusaur"
    },
    "types": {
      "zh_tw": [
        "草",
        "毒"
      ],
      "ja": [
        "くさ",
        "どく"
      ],
      "en": [
        "Grass",
        "Poison"
      ]
    },
    "abilities": {
      "zh_tw": [
        "茂盛",
        "葉綠素"
      ],
      "ja": [
        "しんりょく",
        "ようりょくそ"
      ],
      "en": [
        "Overgrow",
        "Chlorophyll"
      ]
    },
    "color": {
      "zh_tw": "綠色",
      "ja": "緑色",
      "en": "Green"
    },
    "keywords": [
      "成長",
      "修復",
      "安定",
      "效率",
      "守護"
    ],
    "psychStates": [
      "療癒",
      "成長",
      "茁壯",
      "警覺",
      "防衛"
    ],
    "fiveElement": {
      "raw": "陽木",
      "yinYang": "陽",
      "main": "木"
    },
    "popularityScore": 4,
    "sourceRow": 3
  },
  {
    "id": "0004",
    "dexNo": 4,
    "slug": "charmander",
    "official30th": {
      "fileName": "0004.png",
      "link": "https://www.pokemon.co.jp/ex/30th_logo/assets/img/download/0004.png",
      "previewAllowed": false,
      "usageNote": "公開版結果頁僅提供外部連結，不直接嵌入或重新散布官方圖片。"
    },
    "name": {
      "zh_tw": "小火龍",
      "ja": "ヒトカゲ",
      "en": "Charmander"
    },
    "types": {
      "zh_tw": [
        "火"
      ],
      "ja": [
        "ほのお"
      ],
      "en": [
        "Fire"
      ]
    },
    "abilities": {
      "zh_tw": [
        "猛火",
        "太陽之力"
      ],
      "ja": [
        "もうか",
        "サンパワー"
      ],
      "en": [
        "Blaze",
        "Solar Power"
      ]
    },
    "color": {
      "zh_tw": "紅色",
      "ja": "赤色",
      "en": "Red"
    },
    "keywords": [
      "行動",
      "推進",
      "效率",
      "迎接",
      "守護"
    ],
    "psychStates": [
      "熱情",
      "勇敢",
      "爆發力",
      "外放",
      "活力"
    ],
    "fiveElement": {
      "raw": "陽火",
      "yinYang": "陽",
      "main": "火"
    },
    "popularityScore": 5,
    "sourceRow": 4
  },
  {
    "id": "0005",
    "dexNo": 5,
    "slug": "charmeleon",
    "official30th": {
      "fileName": "0005.png",
      "link": "https://www.pokemon.co.jp/ex/30th_logo/assets/img/download/0005.png",
      "previewAllowed": false,
      "usageNote": "公開版結果頁僅提供外部連結，不直接嵌入或重新散布官方圖片。"
    },
    "name": {
      "zh_tw": "火恐龍",
      "ja": "リザード",
      "en": "Charmeleon"
    },
    "types": {
      "zh_tw": [
        "火"
      ],
      "ja": [
        "ほのお"
      ],
      "en": [
        "Fire"
      ]
    },
    "abilities": {
      "zh_tw": [
        "猛火",
        "太陽之力"
      ],
      "ja": [
        "もうか",
        "サンパワー"
      ],
      "en": [
        "Blaze",
        "Solar Power"
      ]
    },
    "color": {
      "zh_tw": "紅色",
      "ja": "赤色",
      "en": "Red"
    },
    "keywords": [
      "行動",
      "推進",
      "效率",
      "迎接",
      "守護"
    ],
    "psychStates": [
      "熱情",
      "勇敢",
      "爆發力",
      "外放",
      "活力"
    ],
    "fiveElement": {
      "raw": "陽火",
      "yinYang": "陽",
      "main": "火"
    },
    "popularityScore": 3,
    "sourceRow": 5
  }
]
```

---

## 16. 建議回 source/pokemon_table.md 修正的欄位清單

✅ 無需修正

---

*本報告由 `scripts/convert_markdown_table_to_json.py` 自動產生。*