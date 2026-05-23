#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
convert_markdown_table_to_json.py
----------------------------------
將 source/pokemon_table.md 的 Markdown 大型表格轉換成 JSON。
輸出：
  data/pokemon.json
  data/pokemon_schema.json
  reports/pokemon_data_check_report.md
"""

import json
import re
import os
import sys
from datetime import datetime
from pathlib import Path

# ── 路徑設定 ────────────────────────────────────────────────────────────────
BASE_DIR   = Path(__file__).resolve().parent.parent
SOURCE_MD  = BASE_DIR / "source" / "pokemon_table.md"
OUT_JSON   = BASE_DIR / "data"    / "pokemon.json"
OUT_SCHEMA = BASE_DIR / "data"    / "pokemon_schema.json"
OUT_REPORT = BASE_DIR / "reports" / "pokemon_data_check_report.md"

USAGE_NOTE = "公開版結果頁僅提供外部連結，不直接嵌入或重新散布官方圖片。"

# 必要的輸出目錄
for d in [BASE_DIR / "data", BASE_DIR / "reports"]:
    d.mkdir(parents=True, exist_ok=True)

# ── 輔助函式 ────────────────────────────────────────────────────────────────

# 表頭欄位（以中文為主，依序對應）
EXPECTED_HEADERS = [
    "編號", "圖片連結", "名稱", "日文名稱", "英文名稱",
    "屬性", "日文屬性", "英文屬性",
    "特性", "日文特性", "英文特性",
    "主要顏色", "日文顏色", "英文顏色",
    "聯想詞語", "心理狀態", "五行屬性", "人氣評分"
]

FIVE_ELEMENTS_MAIN  = {"木", "火", "土", "金", "水"}
FIVE_ELEMENTS_YY    = {"陰", "陽", "中性"}


def make_slug(en_name: str) -> str:
    """英文名稱 → URL-safe slug"""
    s = en_name.strip()
    s = s.replace("♀", "-f").replace("♂", "-m")
    s = s.replace(" ", "-").replace("'", "").replace(".", "").replace(":", "")
    s = re.sub(r"[^a-zA-Z0-9\-]", "", s)
    s = s.lower()
    s = re.sub(r"-+", "-", s)
    return s.strip("-")


def parse_image_cell(cell: str):
    """
    解析圖片連結欄位，回傳 (fileName, link)
    支援：
      [0001.png](https://...)  → Markdown link
      ![[0001.png]]            → Obsidian embed
      0001.png                 → 純文字
    """
    cell = cell.strip()
    # Markdown link: [filename](url)
    m = re.match(r'\[([^\]]+)\]\(([^)]*)\)', cell)
    if m:
        return m.group(1).strip(), m.group(2).strip()
    # Obsidian embed: ![[filename]]
    m = re.match(r'!\[\[([^\]]+)\]\]', cell)
    if m:
        return m.group(1).strip(), ""
    # 純文字
    if cell:
        return cell, ""
    return "", ""


def split_array_field(text: str) -> list:
    """
    以「、」「,」「/」「／」或換行分割，並清理每個元素。
    同時移除「隱藏：」「隠れ：」「Hidden:」等前綴，以及「Hidden: 」。
    """
    # 正規化分隔符
    text = text.replace("、", "/").replace("，", "/").replace("／", "/")
    text = text.replace("\n", "/").replace("，", "/")
    parts = [p.strip() for p in re.split(r'[,/]', text) if p.strip()]
    cleaned = []
    for p in parts:
        # 移除括號補充說明（如「(隱藏)」）
        p = re.sub(r'（.*?）', '', p).strip()
        p = re.sub(r'\(.*?\)', '', p).strip()
        # 移除隱藏特性前綴
        p = re.sub(r'^隱藏[:：]\s*', '', p)
        p = re.sub(r'^隠れ[:：]\s*', '', p)
        p = re.sub(r'^Hidden[:：]\s*', '', p, flags=re.IGNORECASE)
        p = p.strip()
        if p:
            cleaned.append(p)
    return cleaned


def parse_five_element(raw: str):
    """
    解析五行欄位，回傳 dict {raw, yinYang, main}
    例如：陰木 → {raw:"陰木", yinYang:"陰", main:"木"}
          中性土 → {raw:"中性土", yinYang:"中性", main:"土"}
    """
    raw = raw.strip()
    result = {"raw": raw, "yinYang": None, "main": None}
    if not raw:
        return result
    # 中性（兩個字前綴）
    if raw.startswith("中性"):
        result["yinYang"] = "中性"
        main = raw[2:]
        result["main"] = main if main in FIVE_ELEMENTS_MAIN else None
    elif raw[0] in ("陰", "陽"):
        result["yinYang"] = raw[0]
        main = raw[1:]
        result["main"] = main if main in FIVE_ELEMENTS_MAIN else None
    return result


def parse_row(cells: list, row_index: int, issues: list) -> dict:
    """將一列 cell 轉換成寶可夢 dict，並將問題寫入 issues。"""
    # cells 應有 18 個欄位
    def g(i):
        return cells[i].strip() if i < len(cells) else ""

    # ── 編號
    raw_id = g(0).lstrip("0") or "0"
    try:
        dex_no = int(g(0))
        id_str = f"{dex_no:04d}"
    except ValueError:
        dex_no = None
        id_str = g(0)
        issues.append(f"row {row_index}: 編號無法解析為整數 → `{g(0)}`")

    # ── 圖片連結
    file_name, link = parse_image_cell(g(1))
    if not file_name:
        issues.append(f"row {row_index} ({id_str}): 圖片連結缺失或解析失敗 → `{g(1)}`")

    # ── 名稱
    zh_name = g(2)
    ja_name = g(3)
    en_name = g(4)
    if not zh_name:
        issues.append(f"row {row_index} ({id_str}): 缺少中文名稱")
    if not ja_name:
        issues.append(f"row {row_index} ({id_str}): 缺少日文名稱")
    if not en_name:
        issues.append(f"row {row_index} ({id_str}): 缺少英文名稱")

    # ── slug
    slug = make_slug(en_name) if en_name else ""

    # ── 屬性
    types_zh = split_array_field(g(5))
    types_ja = split_array_field(g(6))
    types_en = split_array_field(g(7))
    if not types_zh:
        issues.append(f"row {row_index} ({id_str}): 屬性解析失敗 → `{g(5)}`")

    # ── 特性
    ab_zh = split_array_field(g(8))
    ab_ja = split_array_field(g(9))
    ab_en = split_array_field(g(10))
    if not ab_zh:
        issues.append(f"row {row_index} ({id_str}): 特性解析失敗 → `{g(8)}`")

    # ── 顏色
    color_zh = g(11)
    color_ja = g(12)
    color_en = g(13)

    # ── 聯想詞語 & 心理狀態
    keywords   = split_array_field(g(14))
    psy_states = split_array_field(g(15))

    # ── 五行屬性
    five_raw    = g(16)
    five_parsed = parse_five_element(five_raw)
    if five_raw and five_parsed["main"] is None:
        issues.append(f"row {row_index} ({id_str}): 五行主行解析失敗 → `{five_raw}`")
    if five_raw and five_parsed["yinYang"] is None:
        issues.append(f"row {row_index} ({id_str}): 陰陽解析失敗 → `{five_raw}`")

    # ── 人氣評分
    pop_raw = g(17)
    try:
        pop = int(pop_raw)
        if not (1 <= pop <= 5):
            issues.append(f"row {row_index} ({id_str}): 人氣評分不在 1-5 範圍 → `{pop_raw}`")
    except ValueError:
        pop = None
        issues.append(f"row {row_index} ({id_str}): 人氣評分無法解析 → `{pop_raw}`")

    return {
        "id": id_str,
        "dexNo": dex_no,
        "slug": slug,
        "official30th": {
            "fileName": file_name,
            "link": link,
            "previewAllowed": False,
            "usageNote": USAGE_NOTE
        },
        "name": {
            "zh_tw": zh_name,
            "ja":    ja_name,
            "en":    en_name
        },
        "types": {
            "zh_tw": types_zh,
            "ja":    types_ja,
            "en":    types_en
        },
        "abilities": {
            "zh_tw": ab_zh,
            "ja":    ab_ja,
            "en":    ab_en
        },
        "color": {
            "zh_tw": color_zh,
            "ja":    color_ja,
            "en":    color_en
        },
        "keywords":    keywords,
        "psychStates": psy_states,
        "fiveElement": five_parsed,
        "popularityScore": pop,
        "sourceRow": row_index
    }


def is_header_row(cells: list) -> bool:
    """判斷是否為表頭列（包含「編號」欄位）"""
    return any("編號" in c for c in cells)


def is_separator_row(cells: list) -> bool:
    """判斷是否為分隔列（---）"""
    return all(re.match(r'^[-: ]+$', c.strip()) for c in cells if c.strip())


def split_table_row(line: str) -> list:
    """
    將 Markdown 表格列切成 cells。
    為避免連結中的括號造成問題，先處理連結再切割。
    策略：以 | 為分隔，不跨越 [] 或 () 對。
    """
    # 去掉開頭結尾的 |
    line = line.strip()
    if line.startswith("|"):
        line = line[1:]
    if line.endswith("|"):
        line = line[:-1]

    cells = []
    current = []
    depth_bracket = 0
    depth_paren   = 0
    i = 0
    while i < len(line):
        c = line[i]
        if c == "[":
            depth_bracket += 1
            current.append(c)
        elif c == "]":
            depth_bracket -= 1
            current.append(c)
        elif c == "(" and depth_bracket == 0:
            depth_paren += 1
            current.append(c)
        elif c == ")" and depth_paren > 0:
            depth_paren -= 1
            current.append(c)
        elif c == "|" and depth_bracket == 0 and depth_paren == 0:
            cells.append("".join(current).strip())
            current = []
        else:
            current.append(c)
        i += 1
    cells.append("".join(current).strip())
    return cells


# ── 主程式 ───────────────────────────────────────────────────────────────────

def main():
    # ── 讀取來源
    if not SOURCE_MD.exists():
        # 嘗試從 uploads 目錄讀取（cowork 上傳路徑）
        upload_candidates = list(Path("/").glob("**/uploads/pokemon_table.md"))
        if upload_candidates:
            src = upload_candidates[0]
            print(f"⚠ source/pokemon_table.md 不存在，改用 {src}")
        else:
            print(f"❌ 找不到 {SOURCE_MD}，請先將 pokemon_table.md 放入 source/ 目錄。")
            sys.exit(1)
    else:
        src = SOURCE_MD

    with open(src, encoding="utf-8") as f:
        lines = f.readlines()

    print(f"✅ 讀取 {src}，共 {len(lines)} 行")

    # ── 解析表格
    pokemons    = []
    issues      = []          # 格式問題清單
    bad_rows    = []          # 欄位數不一致的列
    row_index   = 0           # 表格資料列的全域計數

    in_table    = False
    header_cols = 0

    for lineno, line in enumerate(lines, 1):
        raw = line.rstrip("\n")

        # 偵測表格列
        if not raw.strip().startswith("|"):
            in_table = False
            continue

        cells = split_table_row(raw)

        if is_separator_row(cells):
            continue

        if is_header_row(cells):
            header_cols = len(cells)
            in_table = True
            continue

        if not in_table:
            continue

        # 資料列
        row_index += 1

        # 欄位數檢查
        if len(cells) != header_cols:
            bad_rows.append((lineno, len(cells), header_cols, raw[:80]))
            issues.append(
                f"row {row_index} (line {lineno}): 欄位數 {len(cells)} ≠ 表頭 {header_cols} → `{raw[:60]}...`"
            )
            # 仍嘗試解析

        # 跳過空白列
        if all(not c for c in cells):
            continue

        try:
            poke = parse_row(cells, row_index, issues)
            pokemons.append(poke)
        except Exception as e:
            issues.append(f"row {row_index} (line {lineno}): 解析例外 → {e}")

    print(f"✅ 解析完成：{len(pokemons)} 筆")

    # ── 寫出 pokemon.json
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(pokemons, f, ensure_ascii=False, indent=2)
    print(f"✅ 寫出 {OUT_JSON}")

    # ── 寫出 pokemon_schema.json
    schema = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "Pokémon",
        "description": "單一寶可夢資料結構，由 source/pokemon_table.md 轉換而來",
        "type": "object",
        "required": ["id", "dexNo", "slug", "official30th", "name", "types",
                     "abilities", "color", "keywords", "psychStates",
                     "fiveElement", "popularityScore", "sourceRow"],
        "properties": {
            "id": {
                "type": "string",
                "description": "四位數字字串的全國圖鑑編號，例如 0001、0025、1025",
                "required": True,
                "example": "0001"
            },
            "dexNo": {
                "type": ["integer", "null"],
                "description": "整數形式的全國圖鑑編號",
                "required": True,
                "example": 1
            },
            "slug": {
                "type": "string",
                "description": "由英文名稱生成的 URL-safe 識別碼，全小寫，空白轉連字號",
                "required": True,
                "example": "bulbasaur"
            },
            "official30th": {
                "type": "object",
                "description": "Pokémon 30 週年官方圖示連結資訊",
                "required": True,
                "properties": {
                    "fileName": {
                        "type": "string",
                        "description": "圖片檔名，例如 0001.png"
                    },
                    "link": {
                        "type": "string",
                        "description": "官方圖片或頁面的外部連結 URL；若無法取得則為空字串"
                    },
                    "previewAllowed": {
                        "type": "boolean",
                        "description": "固定為 false，不直接嵌入官方圖片",
                        "const": False
                    },
                    "usageNote": {
                        "type": "string",
                        "description": "使用說明，提示公開版僅提供外部連結"
                    }
                }
            },
            "name": {
                "type": "object",
                "description": "寶可夢名稱（三語）",
                "required": True,
                "properties": {
                    "zh_tw": {"type": "string", "description": "繁體中文名稱"},
                    "ja":    {"type": "string", "description": "日文名稱"},
                    "en":    {"type": "string", "description": "英文名稱"}
                }
            },
            "types": {
                "type": "object",
                "description": "屬性陣列（三語）",
                "required": True,
                "properties": {
                    "zh_tw": {"type": "array", "items": {"type": "string"}, "description": "中文屬性列表"},
                    "ja":    {"type": "array", "items": {"type": "string"}, "description": "日文屬性列表"},
                    "en":    {"type": "array", "items": {"type": "string"}, "description": "英文屬性列表"}
                }
            },
            "abilities": {
                "type": "object",
                "description": "特性陣列（三語），已移除「隱藏：」前綴",
                "required": True,
                "properties": {
                    "zh_tw": {"type": "array", "items": {"type": "string"}},
                    "ja":    {"type": "array", "items": {"type": "string"}},
                    "en":    {"type": "array", "items": {"type": "string"}}
                }
            },
            "color": {
                "type": "object",
                "description": "物種主要顏色（三語）",
                "required": True,
                "properties": {
                    "zh_tw": {"type": "string"},
                    "ja":    {"type": "string"},
                    "en":    {"type": "string"}
                }
            },
            "keywords": {
                "type": "array",
                "items": {"type": "string"},
                "description": "聯想詞語，每隻寶可夢通常 5 個",
                "required": True
            },
            "psychStates": {
                "type": "array",
                "items": {"type": "string"},
                "description": "心理狀態，每隻寶可夢通常 5 個",
                "required": True
            },
            "fiveElement": {
                "type": "object",
                "description": "五行屬性，依核心意象推導，非官方分類",
                "required": True,
                "properties": {
                    "raw":     {"type": "string", "description": "原始文字，例如 陰木、中性土"},
                    "yinYang": {"type": ["string", "null"], "enum": ["陰", "陽", "中性", None],
                                "description": "陰陽分類"},
                    "main":    {"type": ["string", "null"], "enum": ["木", "火", "土", "金", "水", None],
                                "description": "五行主行"}
                }
            },
            "popularityScore": {
                "type": ["integer", "null"],
                "minimum": 1,
                "maximum": 5,
                "description": "人氣評分 1-5，綜合多項公開問卷與對戰使用率，非官方總榜",
                "required": True
            },
            "sourceRow": {
                "type": "integer",
                "description": "對應來源 Markdown 表格的資料列序號（從 1 開始）",
                "required": True
            }
        }
    }
    with open(OUT_SCHEMA, "w", encoding="utf-8") as f:
        json.dump(schema, f, ensure_ascii=False, indent=2)
    print(f"✅ 寫出 {OUT_SCHEMA}")

    # ── 資料檢查
    total       = len(pokemons)
    target      = 1025
    dex_nos     = [p["dexNo"] for p in pokemons if p["dexNo"] is not None]
    dex_set     = set(dex_nos)
    dup_ids     = sorted(set(d for d in dex_nos if dex_nos.count(d) > 1))
    all_expected = set(range(1, target + 1))
    missing_ids  = sorted(all_expected - dex_set)

    no_zh  = [p for p in pokemons if not p["name"]["zh_tw"]]
    no_ja  = [p for p in pokemons if not p["name"]["ja"]]
    no_en  = [p for p in pokemons if not p["name"]["en"]]
    no_img = [p for p in pokemons if not p["official30th"]["fileName"]]
    no_type= [p for p in pokemons if not p["types"]["zh_tw"]]
    no_ab  = [p for p in pokemons if not p["abilities"]["zh_tw"]]
    bad_fe_main = [p for p in pokemons if p["fiveElement"]["raw"] and p["fiveElement"]["main"] is None]
    bad_fe_yy   = [p for p in pokemons if p["fiveElement"]["raw"] and p["fiveElement"]["yinYang"] is None]
    bad_pop= [p for p in pokemons if p["popularityScore"] is None or
              not (1 <= (p["popularityScore"] or 0) <= 5)]

    # 前 5 筆範例
    sample_5 = json.dumps(pokemons[:5], ensure_ascii=False, indent=2)

    # 建議修正清單
    fix_suggestions = []
    for p in no_zh:
        fix_suggestions.append(f"- 編號 {p['id']}：缺少中文名稱")
    for p in no_ja:
        fix_suggestions.append(f"- 編號 {p['id']}：缺少日文名稱")
    for p in no_en:
        fix_suggestions.append(f"- 編號 {p['id']}：缺少英文名稱")
    for p in no_img:
        fix_suggestions.append(f"- 編號 {p['id']}：圖片連結缺失")
    for p in no_type:
        fix_suggestions.append(f"- 編號 {p['id']}：屬性無法解析")
    for p in no_ab:
        fix_suggestions.append(f"- 編號 {p['id']}：特性無法解析")
    for p in bad_fe_main:
        fix_suggestions.append(f"- 編號 {p['id']}：五行主行無法解析 → `{p['fiveElement']['raw']}`")
    for p in bad_pop:
        fix_suggestions.append(f"- 編號 {p['id']}：人氣評分異常 → `{p['popularityScore']}`")

    for lineno, got, expected, preview in bad_rows:
        fix_suggestions.append(f"- 第 {lineno} 行：欄位數 {got} ≠ {expected} → `{preview}`")

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    report_lines = [
        f"# 寶可夢資料轉換品質報告",
        f"",
        f"> 產生時間：{now}  ",
        f"> 來源：`source/pokemon_table.md`",
        f"",
        f"---",
        f"",
        f"## 1. 解析筆數",
        f"",
        f"| 項目 | 數值 |",
        f"|---|---|",
        f"| 成功解析筆數 | **{total}** |",
        f"| 目標筆數 | 1025 |",
        f"| 是否達標 | {'✅ 是' if total == target else f'❌ 否（差 {target - total} 筆）'} |",
        f"",
        f"---",
        f"",
        f"## 2. 重複編號",
        f"",
    ]
    if dup_ids:
        report_lines += [f"⚠ 發現 {len(dup_ids)} 個重複編號：", ""]
        for d in dup_ids:
            report_lines.append(f"- {d:04d}")
    else:
        report_lines.append("✅ 無重複編號")

    report_lines += [
        f"",
        f"---",
        f"",
        f"## 3. 缺少編號的列",
        f"",
    ]
    if missing_ids:
        report_lines += [f"⚠ 缺少 {len(missing_ids)} 個編號：", ""]
        for mid in missing_ids[:50]:
            report_lines.append(f"- {mid:04d}")
        if len(missing_ids) > 50:
            report_lines.append(f"- …（共 {len(missing_ids)} 個）")
    else:
        report_lines.append("✅ 1–1025 編號完整")

    def check_section(title, items, no_issue_msg="✅ 無問題"):
        lines = [f"", f"---", f"", f"## {title}", f""]
        if items:
            lines.append(f"⚠ 共 {len(items)} 筆有問題：")
            lines.append("")
            for p in items[:20]:
                lines.append(f"- {p['id']} {p['name'].get('zh_tw','') or p['name'].get('en','')}")
            if len(items) > 20:
                lines.append(f"- …（共 {len(items)} 筆）")
        else:
            lines.append(no_issue_msg)
        return lines

    report_lines += check_section("4. 缺少中文名稱", no_zh)
    report_lines += check_section("5. 缺少日文名稱", no_ja)
    report_lines += check_section("6. 缺少英文名稱", no_en)
    report_lines += check_section("7. 圖片連結缺失或解析失敗", no_img)
    report_lines += check_section("8. 屬性解析失敗", no_type)
    report_lines += check_section("9. 特性解析失敗", no_ab)
    report_lines += check_section("10. 五行主行解析失敗", bad_fe_main)
    report_lines += check_section("11. 陰陽解析失敗", bad_fe_yy)
    report_lines += check_section("12. 人氣評分異常（不在 1-5）", bad_pop)

    report_lines += [
        f"",
        f"---",
        f"",
        f"## 13. 欄位數不一致的 Markdown 列",
        f"",
    ]
    if bad_rows:
        report_lines.append(f"⚠ 共 {len(bad_rows)} 列欄位數不一致：")
        report_lines.append("")
        for lineno, got, expected, preview in bad_rows[:20]:
            report_lines.append(f"- 第 {lineno} 行：欄位數 {got}，預期 {expected} → `{preview}`")
    else:
        report_lines.append("✅ 無欄位數不一致的列")

    report_lines += [
        f"",
        f"---",
        f"",
        f"## 14. 所有問題清單（共 {len(issues)} 條）",
        f"",
    ]
    if issues:
        for iss in issues[:100]:
            report_lines.append(f"- {iss}")
        if len(issues) > 100:
            report_lines.append(f"- …（共 {len(issues)} 條，僅顯示前 100 條）")
    else:
        report_lines.append("✅ 無任何問題")

    report_lines += [
        f"",
        f"---",
        f"",
        f"## 15. 前 5 筆轉換後 JSON 範例",
        f"",
        f"```json",
        sample_5,
        f"```",
        f"",
        f"---",
        f"",
        f"## 16. 建議回 source/pokemon_table.md 修正的欄位清單",
        f"",
    ]
    if fix_suggestions:
        report_lines += fix_suggestions
    else:
        report_lines.append("✅ 無需修正")

    report_lines += [
        f"",
        f"---",
        f"",
        f"*本報告由 `scripts/convert_markdown_table_to_json.py` 自動產生。*"
    ]

    with open(OUT_REPORT, "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines))
    print(f"✅ 寫出 {OUT_REPORT}")

    # ── 終端摘要
    print(f"\n{'='*60}")
    print(f"  解析筆數：{total} / {target} {'✅' if total == target else '❌'}")
    print(f"  重複編號：{len(dup_ids)} 個")
    print(f"  缺少編號：{len(missing_ids)} 個")
    print(f"  欄位數不一致列：{len(bad_rows)} 列")
    print(f"  解析問題總數：{len(issues)} 條")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
