/**
 * app.js — Pokémon Guardian Game 主程式
 *
 * 流程：首頁 → Step1 本命夥伴 → Step2 出生資料 → Step3 心理測驗 →
 *        Step4 場景選擇 → Step5 結果
 *
 * 使用限制（前端強制遵守）：
 *   - 不以 img src / background-image 使用 official30th.link
 *   - 結果卡片只顯示編號、名稱、屬性、推薦理由
 *   - 官方圖案僅提供外部連結按鈕
 *   - 分享圖片不使用任何官方圖片、Logo 或官方 30 週年圖案
 *   - 稱呼寶可夢時使用「這隻寶可夢」「這些寶可夢」「這份配置」等中性表述
 */

(function () {
  'use strict';

  // ── 全域資料 ─────────────────────────────────────────────────────────────
  let pokemonData = null;
  let rules       = null;

  // ── App 狀態 ─────────────────────────────────────────────────────────────
  const state = {
    screen:          'home',
    step:            1,
    quizSubStep:     0,
    favoritePokemon: null,
    birth:           null,
    quizAnswers:     [],
    quizTags:        [],
    sceneId:         null,
    result:          null,
  };

  // 場景圖示 — inline SVG（不使用 emoji，不依賴外部圖片）
  const SCENE_SVGS = {
    entrance: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M36 44H12V16Q24 5 36 16Z" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linejoin="round"/>
      <circle cx="14.5" cy="30" r="2.5" fill="currentColor"/>
      <line x1="5" y1="44" x2="43" y2="44" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>
    </svg>`,
    bedroom: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M34 10 Q43 23 38 33 Q28 24 19 28 Q24 15 34 10Z" fill="currentColor" opacity="0.82"/>
      <circle cx="27" cy="16" r="2.4" fill="currentColor" opacity="0.35"/>
      <circle cx="17" cy="23" r="1.7" fill="currentColor" opacity="0.25"/>
      <circle cx="39" cy="13" r="1.5" fill="currentColor" opacity="0.28"/>
    </svg>`,
    desk: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="5" y="35" width="38" height="4.5" rx="2.2" fill="currentColor"/>
      <path d="M34 9 L39 26 M34 9 L29.5 13.5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="7"  y1="22" x2="27" y2="22" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" opacity="0.65"/>
      <line x1="7"  y1="29" x2="21" y2="29" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" opacity="0.42"/>
    </svg>`,
    office: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="6"  y="9"  width="15" height="21" rx="2.5" stroke="currentColor" stroke-width="2.5" fill="none"/>
      <rect x="25" y="9"  width="17" height="11" rx="2.5" stroke="currentColor" stroke-width="2.5" fill="none"/>
      <line x1="6"  y1="36" x2="42" y2="36" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="6"  y1="42" x2="32" y2="42" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" opacity="0.42"/>
    </svg>`,
    watch: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="17" y="3"  width="14" height="7"  rx="3.5" fill="currentColor" opacity="0.44"/>
      <rect x="17" y="38" width="14" height="7"  rx="3.5" fill="currentColor" opacity="0.44"/>
      <circle cx="24" cy="24" r="14" stroke="currentColor" stroke-width="2.6" fill="none"/>
      <line x1="24" y1="24" x2="24" y2="13" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>
      <line x1="24" y1="24" x2="32" y2="24" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>
      <circle cx="24" cy="24" r="2" fill="currentColor"/>
    </svg>`,
    bag: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M17 20 Q17 10 24 10 Q31 10 31 20" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" fill="none"/>
      <rect x="7" y="20" width="34" height="23" rx="7" stroke="currentColor" stroke-width="2.6" fill="none"/>
      <line x1="7" y1="31" x2="41" y2="31" stroke="currentColor" stroke-width="1.5" opacity="0.32"/>
    </svg>`,
  };

  // ── Beta 回饋設定 ─────────────────────────────────────────────────────────
  // 設定後將以 target="_blank" 開啟；空字串時顯示提示文字。
  const FEEDBACK_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSeFY4LNsuaogesjZkrES5LpMwYpujAV94NesHBMj7O4bmiLSA/viewform?usp=publish-editor';

  // 五行對應 CSS class
  function elemClass(main) {
    const map = { 木: 'elem-木', 火: 'elem-火', 土: 'elem-土', 金: 'elem-金', 水: 'elem-水' };
    return map[main] || 'elem-中性';
  }

  // 五行色（Canvas 用）
  const ELEM_HEX = { 木: '#5a9a5a', 火: '#d9604a', 土: '#c0913a', 金: '#8a8a9a', 水: '#4a7ab5' };

  // ── 官方屬性色表 ──────────────────────────────────────────────────────────
  const TYPE_COLORS = {
    Normal:   '#A8A77A', Fire:     '#EE8130', Water:    '#6390F0',
    Grass:    '#7AC74C', Electric: '#F7D02C', Ice:      '#96D9D6',
    Fighting: '#C22E28', Poison:   '#A33EA1', Ground:   '#E2BF65',
    Flying:   '#A98FF3', Psychic:  '#F95587', Bug:      '#A6B91A',
    Rock:     '#B6A136', Ghost:    '#735797', Dragon:   '#6F35FC',
    Dark:     '#705746', Steel:    '#B7B7CE', Fairy:    '#D685AD',
  };

  // 各語系屬性名稱 → 英文 key（跨語系映射）
  const TYPE_NAME_TO_KEY = {
    // zh_tw
    '一般':'Normal','火':'Fire','水':'Water','草':'Grass','電':'Electric',
    '冰':'Ice','格鬥':'Fighting','毒':'Poison','地面':'Ground','飛行':'Flying',
    '超能力':'Psychic','蟲':'Bug','岩石':'Rock','幽靈':'Ghost','龍':'Dragon',
    '惡':'Dark','鋼':'Steel','妖精':'Fairy',
    // ja
    'ノーマル':'Normal','ほのお':'Fire','みず':'Water','くさ':'Grass',
    'でんき':'Electric','こおり':'Ice','かくとう':'Fighting','どく':'Poison',
    'じめん':'Ground','ひこう':'Flying','エスパー':'Psychic','むし':'Bug',
    'いわ':'Rock','ゴースト':'Ghost','ドラゴン':'Dragon','あく':'Dark',
    'はがね':'Steel','フェアリー':'Fairy',
    // en (direct)
    Normal:'Normal',Fire:'Fire',Water:'Water',Grass:'Grass',Electric:'Electric',
    Ice:'Ice',Fighting:'Fighting',Poison:'Poison',Ground:'Ground',Flying:'Flying',
    Psychic:'Psychic',Bug:'Bug',Rock:'Rock',Ghost:'Ghost',Dragon:'Dragon',
    Dark:'Dark',Steel:'Steel',Fairy:'Fairy',
  };

  // 相對亮度（WCAG 2.1）
  function hexLuminance(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const toL = c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    return 0.2126 * toL(r) + 0.7152 * toL(g) + 0.0722 * toL(b);
  }

  // 根據亮度選擇文字色（WCAG 4.5:1 閾值）
  function typeTextColor(hex) {
    return hexLuminance(hex) > 0.179 ? '#2a2520' : '#ffffff';
  }

  // 屬性名稱 → 十六進位色碼（兼容三語系）
  function typeColor(typeName) {
    if (!typeName) return '#A8A77A';
    const key = TYPE_NAME_TO_KEY[typeName] || typeName;
    return TYPE_COLORS[key] || '#A8A77A';
  }

  // 將色碼往白色方向混合（amount 0=原色, 1=白色）
  function lightenColor(hex, amount) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const lr = Math.round(r + (255 - r) * amount);
    const lg = Math.round(g + (255 - g) * amount);
    const lb = Math.round(b + (255 - b) * amount);
    return '#' + [lr, lg, lb].map(v => v.toString(16).padStart(2, '0')).join('');
  }

  // ── localStorage 持久化 ──────────────────────────────────────────────────
  function saveState() {
    try {
      localStorage.setItem('pgState', JSON.stringify({
        step:            state.step,
        quizSubStep:     state.quizSubStep,
        favoritePokemon: state.favoritePokemon,
        birth:           state.birth,
        quizAnswers:     state.quizAnswers,
        quizTags:        state.quizTags,
        sceneId:         state.sceneId,
      }));
      if (state.result) localStorage.setItem('pgLastResult', JSON.stringify(state.result));
    } catch (e) { /* ignore quota errors */ }
  }

  function restoreState() {
    try {
      const saved = localStorage.getItem('pgState');
      if (saved) {
        const s = JSON.parse(saved);
        Object.assign(state, {
          step:            s.step            || 1,
          quizSubStep:     s.quizSubStep     || 0,
          favoritePokemon: s.favoritePokemon || null,
          birth:           s.birth           || null,
          quizAnswers:     s.quizAnswers     || [],
          quizTags:        s.quizTags        || [],
          sceneId:         s.sceneId         || null,
        });
      }
      const savedResult = localStorage.getItem('pgLastResult');
      if (savedResult) state.result = JSON.parse(savedResult);
    } catch (e) { /* ignore */ }
  }

  function clearState() {
    localStorage.removeItem('pgState');
    localStorage.removeItem('pgLastResult');
    Object.assign(state, {
      screen: 'home', step: 1, quizSubStep: 0,
      favoritePokemon: null, birth: null,
      quizAnswers: [], quizTags: [], sceneId: null, result: null,
    });
    renderHome();
  }

  // ── 資料載入 ─────────────────────────────────────────────────────────────
  async function loadData() {
    const app = document.getElementById('app');
    app.innerHTML = `<div class="pg-main"><div class="loading-screen"><div class="spinner"></div><p>Loading data…</p></div></div>`;
    try {
      const [pkRes, rulesRes] = await Promise.all([
        fetch('data/pokemon.json'),
        fetch('data/rules.json'),
      ]);
      if (!pkRes.ok || !rulesRes.ok) throw new Error('fetch failed');
      pokemonData = await pkRes.json();
      rules       = await rulesRes.json();
      console.log(`✅ Loaded ${pokemonData.length} Pokémon, rules v${rules._meta && rules._meta.version}`);
    } catch (e) {
      app.innerHTML = `<div class="pg-main"><div class="error-screen">
        <h2>資料載入失敗</h2>
        <p>無法載入遊戲資料。請確認網路連線正常，或稍後重新整理頁面。<br>
        本機開發請使用靜態伺服器（例如 <code>python3 -m http.server 8000</code>）開啟，不要直接以 file:// 開啟 HTML。</p>
      </div></div>`;
      throw e;
    }
  }

  // ── Init ─────────────────────────────────────────────────────────────────
  async function init() {
    const locale = I18N.detectLocale();
    I18N.setLocale(locale);

    await loadData();
    restoreState();

    if (state.result) {
      state.screen = 'quiz';
      state.step   = 5;
    }
    renderApp();
  }

  // ── 語系切換 ─────────────────────────────────────────────────────────────
  function setLocaleAndRender(locale) {
    I18N.setLocale(locale);
    renderApp();
  }

  // ── 主渲染 ───────────────────────────────────────────────────────────────
  function renderApp() {
    const app = document.getElementById('app');
    app.innerHTML = '';

    const header = buildHeader();
    app.appendChild(header);

    const main = document.createElement('div');
    main.className = 'pg-main';

    if (state.screen === 'home') {
      renderHome(main);
    } else {
      switch (state.step) {
        case 1: renderStep1(main); break;
        case 2: renderStep2(main); break;
        case 3: renderStep3(main); break;
        case 4: renderStep4(main); break;
        case 5: renderStep5(main); break;
        default: renderHome(main);
      }
    }

    app.appendChild(main);
  }

  function buildHeader() {
    const loc = I18N.getLocale();
    const header = document.createElement('header');
    header.className = 'pg-header';
    header.innerHTML = `
      <div class="pg-logo"><span class="pg-logo-dot"></span>日常<span>搭檔</span></div>
      <div class="lang-switcher">
        <button class="lang-btn ${loc==='zh_tw'?'active':''}" data-locale="zh_tw">${I18N.t('lang_zh_tw')}</button>
        <button class="lang-btn ${loc==='en'?'active':''}"    data-locale="en">${I18N.t('lang_en')}</button>
        <button class="lang-btn ${loc==='ja'?'active':''}"    data-locale="ja">${I18N.t('lang_ja')}</button>
      </div>`;
    header.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => setLocaleAndRender(btn.dataset.locale));
    });
    return header;
  }

  // 進度列
  function buildProgress(currentStep, container) {
    const steps = I18N.t('steps');
    const total  = steps.length;
    const wrap   = document.createElement('div');
    wrap.className = 'progress-wrap';
    wrap.innerHTML = `
      <div class="progress-label">
        <span>${I18N.t('stepLabel', currentStep, total)} ${steps[currentStep - 1] || ''}</span>
      </div>
      <div class="progress-bar-track">
        <div class="progress-bar-fill" style="width:${(currentStep / total) * 100}%"></div>
      </div>`;
    container.appendChild(wrap);
  }

  // ── 首頁 ─────────────────────────────────────────────────────────────────
  function renderHome(container) {
    if (!container) { renderApp(); return; }
    state.screen = 'home';

    // 漂浮屬性標籤（裝飾用，aria-hidden）
    const loc = I18N.getLocale();
    const decoChipLabels = {
      zh_tw: ['水', '草', '妖精', '幽靈', '電', '冰'],
      en:    ['Water', 'Grass', 'Fairy', 'Ghost', 'Electric', 'Ice'],
      ja:    ['みず', 'くさ', 'フェアリー', 'ゴースト', 'でんき', 'こおり'],
    };
    const chipLabels  = decoChipLabels[loc] || decoChipLabels.zh_tw;
    const chipClasses = ['water', 'grass', 'fairy', 'ghost', 'electric', 'ice'];
    const decoHTML = chipLabels.map((lbl, i) =>
      `<span class="deco-chip deco-chip--${chipClasses[i]}" aria-hidden="true">${lbl}</span>`
    ).join('');

    container.innerHTML = `
      <div class="home-wrap">
        <div class="home-deco" aria-hidden="true">${decoHTML}</div>
        <div class="home-hero fade-in">
          <div class="home-hero-eyebrow">Fan Quiz</div>
          <div class="home-hero-card">
            <h1 class="home-title">${I18N.t('homeTitle')}</h1>
            <p class="home-tagline">${I18N.t('homeTagline')}</p>
            <p class="home-subtitle">${I18N.t('homeSubtitle')}</p>
            <div class="home-start-btn-wrap">
              <button class="btn btn-primary btn-hero-cta" id="startBtn">${I18N.t('startBtn')}</button>
            </div>
          </div>
        </div>
        <div class="home-features fade-in-d1">
          <div class="home-feature">
            <div class="home-feature-icon-wrap home-feature-icon-wrap--green" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                <circle cx="12" cy="12" r="3.5" fill="currentColor"/>
                <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5.64 5.64l1.42 1.42M16.95 16.95l1.41 1.41M5.64 18.36l1.42-1.41M16.95 7.05l1.41-1.41" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
            </div>
            <span class="home-feature-text">${I18N.t('homeFeature1')}</span>
          </div>
          <div class="home-feature">
            <div class="home-feature-icon-wrap home-feature-icon-wrap--blue" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" opacity="0.85"/>
              </svg>
            </div>
            <span class="home-feature-text">${I18N.t('homeFeature2')}</span>
          </div>
          <div class="home-feature">
            <div class="home-feature-icon-wrap home-feature-icon-wrap--pink" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17.1l-6.2 4.2 2.4-7.4L2 9.4h7.6z" opacity="0.85"/>
              </svg>
            </div>
            <span class="home-feature-text">${I18N.t('homeFeature3')}</span>
          </div>
        </div>
        <div class="beta-notice fade-in-d2">
          <span class="beta-badge">BETA</span>
          <span>${I18N.t('betaNotice')}</span>
        </div>
        ${buildDisclaimerHTML()}
      </div>`;

    container.querySelector('#startBtn').addEventListener('click', () => {
      state.screen = 'quiz';
      state.step   = 1;
      renderApp();
    });
  }

  // ── Step 1：本命夥伴 ─────────────────────────────────────────────────────
  function renderStep1(container) {
    buildProgress(1, container);
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-title">${I18N.t('s1Title')}</div>
      <div class="card-desc">${I18N.t('s1Desc')}</div>
      <div class="search-input-wrap">
        <input id="searchInput" class="search-input" type="search"
               placeholder="${I18N.t('s1SearchPlaceholder')}" autocomplete="off">
        <span class="search-icon" aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
            <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" stroke-width="1.8"/>
            <line x1="13" y1="13" x2="18" y2="18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </span>
      </div>
      <div id="searchResults"></div>
      <div id="favCard"></div>`;
    container.appendChild(card);

    if (state.favoritePokemon) renderFavCard(container.querySelector('#favCard'), state.favoritePokemon);

    const searchInput = card.querySelector('#searchInput');
    const resultsDiv  = card.querySelector('#searchResults');

    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim();
      if (q.length < 1) { resultsDiv.innerHTML = ''; return; }
      const matches = searchPokemon(q).slice(0, 30);
      renderSearchResults(resultsDiv, matches, (p) => {
        state.favoritePokemon = { dexNo: p.dexNo, name: I18N.pokemonName(p) };
        searchInput.value = '';
        resultsDiv.innerHTML = '';
        renderFavCard(card.querySelector('#favCard'), state.favoritePokemon);
        saveState();
      });
    });

    const btnRow = document.createElement('div');
    btnRow.className = 'btn-row mt-20';
    btnRow.innerHTML = `<button class="btn btn-primary" id="s1Next">${I18N.t('nextBtn')}</button>`;
    container.appendChild(btnRow);

    const skipLink = document.createElement('span');
    skipLink.className = 'skip-link';
    skipLink.textContent = I18N.t('s1SkipText');
    skipLink.addEventListener('click', () => {
      state.favoritePokemon = null;
      state.step = 2;
      saveState();
      renderApp();
    });
    container.appendChild(skipLink);

    container.querySelector('#s1Next').addEventListener('click', () => {
      state.step = 2;
      saveState();
      renderApp();
    });
  }

  // 選定本命夥伴後的確認卡 — 只顯示編號、名稱、屬性、說明，不暴露五行/陰陽/分數
  function renderFavCard(container, fp) {
    const p = pokemonData.find(pk => pk.dexNo === fp.dexNo);
    if (!p) { container.innerHTML = ''; return; }

    const loc  = I18N.getLocale();
    const name = I18N.pokemonName(p);
    const dexStr = '#' + String(p.dexNo).padStart(4, '0');
    const firstChar = name.charAt(0) || '?';

    // 取得當前語系的屬性陣列
    const types = p.types ? (p.types[loc] || p.types.zh_tw || p.types.en || []) : [];

    // 以第一屬性色決定圓形佔位符
    const c1 = types[0] ? typeColor(types[0]) : '#A8A77A';
    const c2 = types[1] ? typeColor(types[1]) : null;
    const circleStyle = c2
      ? `background: linear-gradient(135deg, ${c1} 0%, ${c2} 100%);`
      : `background: ${c1};`;
    const circleTextColor = typeTextColor(c1);

    // 屬性 badge HTML
    const badgesHTML = types.map(t => {
      const tc  = typeColor(t);
      const txt = typeTextColor(tc);
      return `<span class="tag tag-type" style="background:${tc};color:${txt};font-size:0.72rem;padding:2px 8px;">${t}</span>`;
    }).join('');

    container.innerHTML = `
      <div class="fav-card-wrap">
        <div class="fav-selected-title">✓ ${I18N.t('favSelectedTitle')}</div>
        <div class="fav-card">
          <div class="fav-placeholder" style="${circleStyle}color:${circleTextColor};">
            <span class="p-num">${dexStr}</span>
            <span class="p-char">${firstChar}</span>
          </div>
          <div class="fav-info">
            <div class="fav-num">${dexStr}</div>
            <div class="fav-name">${name}</div>
            <div class="fav-types">${badgesHTML}</div>
          </div>
          <button class="btn btn-sm btn-ghost" id="changeBtn">${I18N.t('s1ChangeBtn')}</button>
        </div>
        <div class="fav-selected-note">${I18N.t('favSelectedNote')}</div>
      </div>`;

    container.querySelector('#changeBtn').addEventListener('click', () => {
      state.favoritePokemon = null;
      container.innerHTML = '';
      saveState();
    });
  }

  // 搜尋
  function searchPokemon(query) {
    if (!pokemonData) return [];
    const q = query.toLowerCase().trim();
    const num = parseInt(q, 10);
    return pokemonData.filter(p => {
      if (!isNaN(num) && p.dexNo === num) return true;
      const names = [p.name.zh_tw || '', p.name.en || '', p.name.ja || ''];
      return names.some(n => n.toLowerCase().includes(q));
    });
  }

  function renderSearchResults(container, matches, onSelect) {
    if (matches.length === 0) {
      container.innerHTML = `<div class="search-results"><div class="search-no-result">${I18N.t('s1NoResult')}</div></div>`;
      return;
    }
    const ul = document.createElement('div');
    ul.className = 'search-results';
    matches.forEach(p => {
      const item = document.createElement('div');
      item.className = 'search-result-item';
      item.innerHTML = `<span class="search-result-num">#${String(p.dexNo).padStart(4,'0')}</span><span>${I18N.pokemonName(p)}</span>`;
      item.addEventListener('click', () => onSelect(p));
      ul.appendChild(item);
    });
    container.innerHTML = '';
    container.appendChild(ul);
  }

  // ── Step 2：出生資料 ─────────────────────────────────────────────────────

  // 真實日曆驗證（含閏年）
  function isValidDate(year, month, day) {
    if (!year || !month || !day) return false;
    const maxDay = new Date(year, month, 0).getDate();
    return day >= 1 && day <= maxDay;
  }

  function renderStep2(container) {
    buildProgress(2, container);
    const hourOpts = I18N.t('s2HourOptions');
    const saved = state.birth || {};
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-title">${I18N.t('s2Title')}</div>
      <div class="card-desc">${I18N.t('s2Desc')}</div>
      <div class="form-row">
        <div class="form-group" style="grid-column:span 2">
          <label class="form-label">${I18N.t('s2Year')}</label>
          <input id="fYear" class="form-input" type="number" min="1900" max="2099"
            placeholder="1990" value="${saved.year || ''}">
          <div class="form-error" id="errYear"></div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">${I18N.t('s2Month')}</label>
          <select id="fMonth" class="form-select">
            <option value="">—</option>
            ${Array.from({length:12},(_,i)=>`<option value="${i+1}" ${saved.month===i+1?'selected':''}>${i+1}</option>`).join('')}
          </select>
          <div class="form-error" id="errMonth"></div>
        </div>
        <div class="form-group">
          <label class="form-label">${I18N.t('s2Day')}</label>
          <input id="fDay" class="form-input" type="number" min="1" max="31"
            placeholder="1" value="${saved.day || ''}">
          <div class="form-error" id="errDay"></div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">${I18N.t('s2Hour')}</label>
        <select id="fHour" class="form-select">
          <option value="unknown">${I18N.t('s2HourUnknown')}</option>
          ${hourOpts.map(h => `<option value="${h.value}" ${saved.hourBranch===h.value?'selected':''}>${h.label}</option>`).join('')}
        </select>
      </div>`;
    container.appendChild(card);

    const btnRow = document.createElement('div');
    btnRow.className = 'btn-row';
    btnRow.innerHTML = `
      <button class="btn btn-secondary" id="s2Back">${I18N.t('backBtn')}</button>
      <button class="btn btn-primary"   id="s2Next">${I18N.t('nextBtn')}</button>`;
    container.appendChild(btnRow);

    container.querySelector('#s2Back').addEventListener('click', () => {
      state.step = 1; renderApp();
    });

    container.querySelector('#s2Next').addEventListener('click', () => {
      const year       = parseInt(card.querySelector('#fYear').value, 10);
      const month      = parseInt(card.querySelector('#fMonth').value, 10);
      const day        = parseInt(card.querySelector('#fDay').value, 10);
      const hourBranch = card.querySelector('#fHour').value;

      let valid = true;
      const showErrMsg = (id, msg) => {
        const el = card.querySelector('#' + id);
        if (!el) return; el.textContent = msg; el.classList.add('show');
      };
      const hideErr = (id) => {
        const el = card.querySelector('#' + id); if (el) el.classList.remove('show');
      };

      if (!year || year < 1900 || year > 2099) {
        showErrMsg('errYear', I18N.t('s2ErrYear')); valid = false;
      } else { hideErr('errYear'); }

      if (!month || month < 1 || month > 12) {
        showErrMsg('errMonth', I18N.t('s2ErrMonth')); valid = false;
      } else { hideErr('errMonth'); }

      if (!day || isNaN(day) || day < 1 || day > 31) {
        showErrMsg('errDay', I18N.t('s2ErrDay')); valid = false;
      } else if (!isNaN(month) && month >= 1 && month <= 12 && !isNaN(year) && !isValidDate(year, month, day)) {
        showErrMsg('errDay', I18N.t('s2ErrDate')); valid = false;
      } else { hideErr('errDay'); }

      if (!valid) return;

      state.birth = { year, month, day, hourBranch };
      state.step  = 3;
      state.quizSubStep = 0;
      saveState();
      renderApp();
    });
  }

  // ── Step 3：心理測驗 ─────────────────────────────────────────────────────

  // 偵測場景題（所有選項都有 sceneId）
  function isSceneQuestion(q) {
    const opts = (q.zh_tw || {}).options || [];
    return opts.length > 0 && opts.every(o => !!o.sceneId);
  }

  function renderStep3(container) {
    buildProgress(3, container);

    // 過濾掉場景題，只顯示心理狀態題
    const allQuestions     = rules.quizQuestions || [];
    const displayQuestions = allQuestions.filter(q => !isSceneQuestion(q));
    const qi               = state.quizSubStep;
    const qObj             = displayQuestions[qi];

    if (!qObj) {
      state.step = 4; renderApp(); return;
    }

    const totalQ   = displayQuestions.length;
    const question = I18N.quizLocQuestion(qObj);
    const options  = I18N.quizLocOptions(qObj);
    const savedAns = state.quizAnswers[qi];

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="quiz-q-num">${I18N.t('s3Progress', qi + 1, totalQ)}</div>
      <div class="quiz-question">${question}</div>
      <div class="quiz-options" id="quizOptions">
        ${options.map(opt => `
          <button class="quiz-option ${savedAns && savedAns.id === opt.id ? 'selected' : ''}"
                  data-optid="${opt.id}">
            <span class="quiz-option-label">${opt.label}</span>
            <span>${opt.text}</span>
          </button>`).join('')}
      </div>`;
    container.appendChild(card);

    const btnRow = document.createElement('div');
    btnRow.className = 'btn-row';
    btnRow.innerHTML = `
      <button class="btn btn-secondary" id="q3Back">${I18N.t('backBtn')}</button>
      <button class="btn btn-primary" id="q3Next" ${savedAns ? '' : 'disabled'} style="${savedAns?'':'opacity:0.5;cursor:not-allowed'}">${I18N.t('nextBtn')}</button>`;
    container.appendChild(btnRow);

    card.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', () => {
        card.querySelectorAll('.quiz-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        const zhOptions = (qObj.zh_tw || {}).options || [];
        const optId = btn.dataset.optid;
        const zhOpt = zhOptions.find(o => o.id === optId) || {};
        state.quizAnswers[qi] = { id: optId, tags: zhOpt.tags || [], sceneId: zhOpt.sceneId || null };
        const nextBtn = container.querySelector('#q3Next');
        nextBtn.removeAttribute('disabled');
        nextBtn.style.opacity = '1';
        nextBtn.style.cursor  = 'pointer';
        saveState();
      });
    });

    container.querySelector('#q3Back').addEventListener('click', () => {
      if (qi > 0) {
        state.quizSubStep = qi - 1; renderApp();
      } else {
        state.step = 2; renderApp();
      }
    });

    container.querySelector('#q3Next').addEventListener('click', () => {
      if (!state.quizAnswers[qi]) return;
      if (qi + 1 < totalQ) {
        state.quizSubStep = qi + 1;
        saveState(); renderApp();
      } else {
        state.quizTags = [];
        state.quizAnswers.forEach(ans => {
          if (ans && ans.tags) ans.tags.forEach(tag => {
            if (!state.quizTags.includes(tag)) state.quizTags.push(tag);
          });
        });
        state.step = 4;
        saveState(); renderApp();
      }
    });
  }

  // ── Step 4：場景選擇 ─────────────────────────────────────────────────────
  function renderStep4(container) {
    buildProgress(4, container);
    const sceneRules = rules.sceneRules || {};
    const sceneIds   = ['entrance', 'bedroom', 'desk', 'office', 'watch', 'bag'];

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-title">${I18N.t('s4Title')}</div>
      <div class="card-desc">${I18N.t('s4Desc')}</div>
      <div class="scene-grid" id="sceneGrid">
        ${sceneIds.map(id => {
          const sc   = sceneRules[id] || {};
          const name = I18N.sceneLocName(sc) || id;
          const tone = I18N.sceneLocTone(sc) || '';
          const svg = SCENE_SVGS[id] || '';
          return `<button class="scene-card ${state.sceneId === id ? 'selected' : ''}" data-sceneid="${id}">
            <span class="scene-icon-wrap">${svg}</span>
            <span class="scene-name">${name}</span>
            <span class="scene-tone">${tone}</span>
          </button>`;
        }).join('')}
      </div>`;
    container.appendChild(card);

    card.querySelectorAll('.scene-card').forEach(btn => {
      btn.addEventListener('click', () => {
        card.querySelectorAll('.scene-card').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        state.sceneId = btn.dataset.sceneid;
        saveState();
        container.querySelector('#s4Next').removeAttribute('disabled');
        container.querySelector('#s4Next').style.opacity = '1';
      });
    });

    const hasScene = !!state.sceneId;
    const btnRow = document.createElement('div');
    btnRow.className = 'btn-row';
    btnRow.innerHTML = `
      <button class="btn btn-secondary" id="s4Back">${I18N.t('backBtn')}</button>
      <button class="btn btn-primary" id="s4Next"
        ${hasScene ? '' : 'disabled'}
        style="${hasScene ? '' : 'opacity:0.5;cursor:not-allowed'}"
      >${I18N.t('nextBtn')}</button>`;
    container.appendChild(btnRow);

    container.querySelector('#s4Back').addEventListener('click', () => {
      const allQ     = rules.quizQuestions || [];
      const displayQ = allQ.filter(q => !isSceneQuestion(q));
      state.step        = 3;
      state.quizSubStep = displayQ.length - 1;
      renderApp();
    });
    container.querySelector('#s4Next').addEventListener('click', () => {
      if (!state.sceneId) return;
      computeResult();
      state.step = 5;
      saveState(); renderApp();
    });
  }

  // ── 計算結果 ─────────────────────────────────────────────────────────────
  function computeResult() {
    const input = {
      locale:          I18N.getLocale(),
      birth:           state.birth || { year: 1990, month: 1, day: 1, hourBranch: 'unknown' },
      favoritePokemon: state.favoritePokemon,
      quizTags:        state.quizTags,
      sceneId:         state.sceneId || 'bedroom',
    };
    state.result = RecommendationEngine.recommendPokemon(input, pokemonData, rules);
  }

  // ── 今日能量分析 ──────────────────────────────────────────────────────────
  // 從 slotElemDistribution 中取出元素，轉換成使用者友善標籤
  function buildEnergySummaryHTML(dist) {
    const elems = [dist.mainGuardian, dist.sceneSupport, dist.balanceSupport]
      .filter(Boolean);
    const unique = [...new Set(elems)];
    if (unique.length === 0) return '';

    const labels = unique.map(e => I18N.elemLabelText(e));
    const tagsHTML = labels.map(l => `<span class="energy-tag">${l}</span>`).join('');

    return `
      <div class="energy-summary">
        <div class="energy-summary-title">✦ ${I18N.t('energySummaryTitle')}</div>
        <div class="energy-summary-body">
          ${I18N.t('energySummaryPrefix')}${tagsHTML}
        </div>
      </div>`;
  }

  // ── Step 5：結果 ─────────────────────────────────────────────────────────
  function renderStep5(container) {
    buildProgress(5, container);

    // locale 切換或 localStorage 還原後重新產生推薦理由
    const currentLocale = I18N.getLocale();
    if (!state.result ||
        (state.result.inputSummary && state.result.inputSummary.locale !== currentLocale)) {
      computeResult();
    }
    const res   = state.result;
    const slots = res.resultSlots;
    const loc   = I18N.getLocale();

    const titleEl = document.createElement('h2');
    titleEl.style.cssText = 'font-size:1.15rem;font-weight:800;margin-bottom:16px;text-align:center';
    titleEl.textContent = I18N.t('s5Title');
    container.appendChild(titleEl);

    // 今日能量分析總結區（在結果卡片之前）
    const energyDiv = document.createElement('div');
    energyDiv.innerHTML = buildEnergySummaryHTML(res.slotElemDistribution || {});
    container.appendChild(energyDiv);

    // 結果卡片（單欄，由上到下）
    // slot icons: CSS-rendered colored dots (no emoji, no external images)
    const slotIconColors = {
      favoritePartner: '#D685AD',  // fairy-pink
      mainGuardian:    '#6390F0',  // water-blue
      sceneSupport:    '#7AC74C',  // grass-green
      balanceSupport:  '#96D9D6',  // ice-teal
    };
    function slotDot(key) {
      const c = slotIconColors[key] || '#A8A77A';
      return `<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${c};flex-shrink:0;"></span>`;
    }
    const slotDefs = [
      { key: 'favoritePartner', labelKey: 'slotFavorite' },
      { key: 'mainGuardian',    labelKey: 'slotMain'     },
      { key: 'sceneSupport',    labelKey: 'slotScene'    },
      { key: 'balanceSupport',  labelKey: 'slotBalance'  },
    ];

    const cardsGrid = document.createElement('div');
    cardsGrid.className = 'results-grid';

    const delayClasses = ['fade-in', 'fade-in-d1', 'fade-in-d2', 'fade-in-d3'];
    slotDefs.forEach(({ key, labelKey }, idx) => {
      const slotData = slots[key];
      if (!slotData) return;

      const pair = document.createElement('div');
      pair.className = `result-pair ${delayClasses[idx] || ''}`;

      const sec = document.createElement('div');
      sec.innerHTML = `<div class="result-section-title">${slotDot(key)} ${I18N.t(labelKey)}</div>`;
      pair.appendChild(sec);
      pair.appendChild(buildResultCard(slotData, key, loc));
      cardsGrid.appendChild(pair);
    });
    container.appendChild(cardsGrid);

    // 小提醒（只出現一次，不在每張卡片裡）
    const tipDiv = document.createElement('div');
    tipDiv.className = 'result-tip-note';
    tipDiv.textContent = I18N.t('tipNote');
    container.appendChild(tipDiv);

    // 分享按鈕列
    const actions = document.createElement('div');
    actions.className = 'result-actions mt-20';
    actions.innerHTML = `
      <div class="share-btns">
        <button class="btn btn-ghost" id="shareBtn">${I18N.t('shareBtn')}</button>
        <button class="btn btn-ghost" id="shareImgBtn">${I18N.t('shareImgBtn')}</button>
      </div>
      <button class="btn btn-primary" id="retakeBtn">${I18N.t('retakeBtn')}</button>`;
    container.appendChild(actions);

    const shareFeedback = document.createElement('div');
    shareFeedback.className = 'share-feedback';
    container.appendChild(shareFeedback);

    // 複製文字
    container.querySelector('#shareBtn').addEventListener('click', () => {
      const text = buildShareText(slots, res.slotElemDistribution, loc);
      navigator.clipboard.writeText(text).then(() => {
        shareFeedback.textContent = I18N.t('shareCopied');
        setTimeout(() => { shareFeedback.textContent = ''; }, 2500);
      }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta);
        ta.focus(); ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        shareFeedback.textContent = I18N.t('shareCopied');
        setTimeout(() => { shareFeedback.textContent = ''; }, 2500);
      });
    });

    // 下載分享圖片（以當前 locale 重新生成）
    container.querySelector('#shareImgBtn').addEventListener('click', () => {
      const canvas = generateShareCanvas(slots, res.slotElemDistribution, I18N.getLocale());
      showShareCardModal(canvas);
    });

    container.querySelector('#retakeBtn').addEventListener('click', () => {
      clearState();
    });

    // Beta 回饋按鈕
    const betaDiv = document.createElement('div');
    betaDiv.className = 'beta-feedback-wrap';
    betaDiv.innerHTML = `
      <div class="beta-notice beta-notice-sm">
        <span class="beta-badge">BETA</span>
        <span>${I18N.t('betaNotice')}</span>
      </div>
      <button class="btn btn-feedback" id="betaFeedbackBtn">${I18N.t('betaFeedbackBtn')}</button>`;
    container.appendChild(betaDiv);

    container.querySelector('#betaFeedbackBtn').addEventListener('click', () => {
      if (FEEDBACK_FORM_URL) {
        window.open(FEEDBACK_FORM_URL, '_blank', 'noopener,noreferrer');
      } else {
        shareFeedback.textContent = I18N.t('betaFormNotSet');
        setTimeout(() => { shareFeedback.textContent = ''; }, 3000);
      }
    });

    container.insertAdjacentHTML('beforeend', buildDisclaimerHTML());
  }

  // ── 結果卡片 ─────────────────────────────────────────────────────────────
  // 顯示：編號、名稱、官方屬性（依官方屬性配色）、推薦理由、外部連結
  // 不顯示：五行文字、陰陽、後台術語
  function buildResultCard(slotData, slotKey, loc) {
    const card = document.createElement('div');
    card.className = 'result-card';

    const name      = slotData.name ? (slotData.name[loc] || slotData.name.zh_tw || slotData.name.en || '') : '';
    const dexNoStr  = slotData.dexNo ? '#' + String(slotData.dexNo).padStart(4, '0') : '';
    const firstChar = name.charAt(0) || '?';
    // 官方屬性（types 由 recommendation engine 傳入）
    const types = slotData.types ? (slotData.types[loc] || slotData.types.zh_tw || slotData.types.en || []) : [];

    // ── 官方屬性配色 ──
    const c1 = types[0] ? typeColor(types[0]) : '#A8A77A';
    const c2 = types[1] ? typeColor(types[1]) : null;
    const l1 = lightenColor(c1, 0.82);
    const l2 = c2 ? lightenColor(c2, 0.82) : null;

    // 卡片背景：單屬性=淡化色，雙屬性=上下漸層
    const cardBg = c2
      ? `linear-gradient(180deg, ${l1} 0%, ${l1} 48%, ${l2} 52%, ${l2} 100%)`
      : l1;
    card.style.background = cardBg;
    card.style.borderLeft  = `5px solid ${c1}`;

    // Placeholder 圓圈：單屬性=主色，雙屬性=斜向漸層
    const placeholderBg  = c2 ? `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)` : c1;
    const placeholderText = typeTextColor(c1);

    // ── IMPORTANT: NEVER use official30th.link as img src ──
    const headerHTML = `
      <div class="result-card-header">
        <div class="poke-placeholder"
             style="background:${placeholderBg};color:${placeholderText};"
             aria-label="${name} placeholder">
          <span class="p-num">${dexNoStr}</span>
          <span class="p-char">${firstChar}</span>
        </div>
        <div class="result-poke-info">
          <div class="result-poke-num">${dexNoStr}</div>
          <div class="result-poke-name">${name}</div>
          <div class="result-poke-tags">
            ${types.map(t => {
              const tc  = typeColor(t);
              const txt = typeTextColor(tc);
              return `<span class="tag tag-type" style="background:${tc};color:${txt};">${t}</span>`;
            }).join('')}
          </div>
        </div>
      </div>`;

    const syncedNoteHTML = (slotKey === 'favoritePartner' && slotData.syncedNote)
      ? `<div class="result-synced-note">${I18N.t('syncedNote')}</div>`
      : '';

    const reason = slotData.reason || '';
    const officialLink = slotData.officialLink || '';
    const officialLinkHTML = officialLink
      ? `<a class="result-official-link"
             href="${officialLink}"
             target="_blank"
             rel="noopener noreferrer"
             aria-label="${I18N.t('officialLinkBtn')}">
           <span>🔗</span>
           <span>${I18N.t('officialLinkBtn')}</span>
         </a>`
      : '';

    card.innerHTML = `
      ${headerHTML}
      <div class="result-card-body">
        ${syncedNoteHTML}
        <div class="result-label">${I18N.t('labelReason')}</div>
        <div class="result-reason">${reason}</div>
        ${officialLinkHTML}
      </div>`;

    return card;
  }

  // ── 分享文字 ─────────────────────────────────────────────────────────────
  // 稱呼使用「這些寶可夢」「這份配置」；不放官方圖片連結
  function buildShareText(slots, dist, loc) {
    const getName = (slot) => slot
      ? (slot.name && (slot.name[loc] || slot.name.zh_tw || slot.name.en)) || '—'
      : '—';

    const slotLabels = {
      zh_tw: { fav: '本命夥伴', main: '今日主搭檔', scene: '場景搭檔', balance: '平衡搭檔' },
      en:    { fav: 'Fav Partner', main: "Today's Main Partner", scene: 'Space Partner', balance: 'Balance Partner' },
      ja:    { fav: '大切な相棒', main: '今日のメインパートナー', scene: '空間のパートナー', balance: 'バランスパートナー' },
    };
    const L   = slotLabels[loc] || slotLabels.zh_tw;
    const sep = loc === 'en' ? ': ' : '：';

    // 能量標籤
    const elemSet = [...new Set([
      dist && dist.mainGuardian,
      dist && dist.sceneSupport,
      dist && dist.balanceSupport,
    ].filter(Boolean))];
    const energyLabels = elemSet.map(e => I18N.elemLabelText(e)).join(loc === 'en' ? ', ' : '、');
    const energyLine   = I18N.t('shareEnergyLabel') + energyLabels;

    const siteUrl = window.location.href.split('?')[0];

    return [
      I18N.t('shareTitle'),
      `${L.fav}${sep}${getName(slots.favoritePartner)}`,
      `${L.main}${sep}${getName(slots.mainGuardian)}`,
      `${L.scene}${sep}${getName(slots.sceneSupport)}`,
      `${L.balance}${sep}${getName(slots.balanceSupport)}`,
      '',
      energyLine,
      '',
      I18N.t('shareFooter'),
      siteUrl,
    ].join('\n');
  }

  // ── Canvas 分享圖片 ───────────────────────────────────────────────────────
  // 嚴格遵守：不使用官方圖片、官方 Logo 或官方 30 週年圖案
  // 僅使用文字、色塊、自製 placeholder、五行色系
  // 語系依呼叫時當前 locale 即時生成

  function generateShareCanvas(slots, dist, loc) {
    const W = 1080, H = 1350;
    const canvas = document.createElement('canvas');
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // ── helpers ──
    function fillRR(x, y, w, h, r, color) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y,     x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x,     y + h, r);
      ctx.arcTo(x,     y + h, x,     y,     r);
      ctx.arcTo(x,     y,     x + w, y,     r);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }

    // CJK 文字換行
    function wrapText(text, maxW) {
      const lines = [];
      let cur = '';
      for (const ch of text) {
        if (ctx.measureText(cur + ch).width > maxW && cur) {
          lines.push(cur); cur = ch;
        } else { cur += ch; }
      }
      if (cur) lines.push(cur);
      return lines;
    }

    // ── Background ──
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#faf8f5');
    bgGrad.addColorStop(1, '#edf3f9');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // ── Title (textBaseline = top throughout) ──
    ctx.textBaseline = 'top';

    ctx.fillStyle = '#3a3328';
    ctx.font = 'bold 62px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(I18N.t('shareCardTitle'), W / 2, 50);

    ctx.fillStyle = '#6b8cae';
    ctx.font = '32px sans-serif';
    ctx.fillText(I18N.t('shareCardSubtitle'), W / 2, 126);

    // Divider
    ctx.strokeStyle = '#d8d2c9';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 172); ctx.lineTo(W - 80, 172);
    ctx.stroke();

    // ── drawCard helper（2-column layout shared renderer）──
    function drawCard(x, y, w, h, circR, sd, labelKey, nameSz, labelSz, dexSz, chipSz) {
      const name    = sd && sd.name
        ? (sd.name[loc] || sd.name.zh_tw || sd.name.en || '—')
        : '—';
      const dexNo   = sd && sd.dexNo ? '#' + String(sd.dexNo).padStart(4, '0') : '';
      const firstCh = name.charAt(0) || '?';

      // 官方屬性配色（優先用 en key 以確保跨語系解析穩定）
      const sdTypes = sd && sd.types
        ? (sd.types['en'] || sd.types['zh_tw'] || sd.types[loc] || [])
        : [];
      const sdC1 = typeColor(sdTypes[0] || '');
      const sdC2 = sdTypes[1] ? typeColor(sdTypes[1]) : null;
      const sdL1 = lightenColor(sdC1, 0.80);
      const sdL2 = sdC2 ? lightenColor(sdC2, 0.80) : null;

      // Shadow + white base
      ctx.save();
      ctx.shadowColor   = 'rgba(90,80,60,0.10)';
      ctx.shadowBlur    = 18;
      ctx.shadowOffsetY = 5;
      fillRR(x, y, w, h, 20, '#ffffff');
      ctx.restore();

      // Card background gradient
      if (sdC2) {
        const bgGr = ctx.createLinearGradient(0, y, 0, y + h);
        bgGr.addColorStop(0,    sdL1);
        bgGr.addColorStop(0.48, sdL1);
        bgGr.addColorStop(0.52, sdL2);
        bgGr.addColorStop(1,    sdL2);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x + 20, y);
        ctx.arcTo(x + w, y,     x + w, y + h, 20);
        ctx.arcTo(x + w, y + h, x,     y + h, 20);
        ctx.arcTo(x,     y + h, x,     y,     20);
        ctx.arcTo(x,     y,     x + w, y,     20);
        ctx.closePath();
        ctx.fillStyle = bgGr;
        ctx.fill();
        ctx.restore();
      } else {
        fillRR(x, y, w, h, 20, sdL1);
      }

      // White content overlay
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x + 28, y);
      ctx.lineTo(x + w - 20, y);
      ctx.arcTo(x + w, y,     x + w, y + h, 20);
      ctx.arcTo(x + w, y + h, x + 8, y + h, 20);
      ctx.lineTo(x + 8, y + h);
      ctx.lineTo(x + 8, y);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,255,255,0.62)';
      ctx.fill();
      ctx.restore();

      // Left accent bar
      if (sdC2) {
        const barGr = ctx.createLinearGradient(0, y + 20, 0, y + h - 20);
        barGr.addColorStop(0, sdC1);
        barGr.addColorStop(1, sdC2);
        ctx.fillStyle = barGr;
      } else {
        ctx.fillStyle = sdC1;
      }
      ctx.fillRect(x, y + 20, 8, h - 40);

      // Circle placeholder
      const circX = x + 8 + 16 + circR;
      const circY = y + h / 2;
      if (sdC2) {
        const circGr = ctx.createRadialGradient(
          circX - circR * 0.3, circY - circR * 0.3, 0,
          circX, circY, circR
        );
        circGr.addColorStop(0, sdC1);
        circGr.addColorStop(1, sdC2);
        ctx.fillStyle = circGr;
      } else {
        ctx.fillStyle = sdC1;
      }
      ctx.beginPath();
      ctx.arc(circX, circY, circR, 0, Math.PI * 2);
      ctx.fill();

      // First character in circle
      ctx.fillStyle    = typeTextColor(sdC1);
      ctx.font         = `bold ${Math.round(circR * 0.85)}px sans-serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(firstCh, circX, circY);
      ctx.textBaseline = 'top';

      // Text column
      const textX  = circX + circR + 16;
      const textW  = (x + w) - textX - 12;
      const labelY = y + Math.max(18, Math.round(h * 0.08));

      // Slot label
      ctx.fillStyle = '#8a7f72';
      ctx.font      = `${labelSz}px sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText(I18N.t(labelKey), textX, labelY);

      // Pokémon name (wrap if needed)
      ctx.fillStyle = '#3a3328';
      ctx.font      = `bold ${nameSz}px sans-serif`;
      const nameLines = wrapText(name, textW);
      const nameLH    = nameSz + 4;
      const nameY0    = labelY + labelSz + 8;
      nameLines.slice(0, 2).forEach((line, li) => {
        ctx.fillText(line, textX, nameY0 + li * nameLH);
      });

      // Dex number + type chips
      const dexY = nameY0 + Math.min(nameLines.length, 2) * nameLH + 8;
      ctx.fillStyle = '#8a7f72';
      ctx.font      = `${dexSz}px sans-serif`;
      ctx.fillText(dexNo, textX, dexY);

      const localTypes = sd && sd.types ? (sd.types[loc] || sd.types['zh_tw'] || []) : [];
      let chipX = textX + ctx.measureText(dexNo).width + 10;
      sdTypes.slice(0, 2).forEach((t, ti) => {
        const tc    = typeColor(t);
        const txt   = typeTextColor(tc);
        const lbl   = localTypes[ti] || t;
        ctx.font    = `bold ${chipSz}px sans-serif`;
        const chipW = ctx.measureText(lbl).width + 16;
        const chipH = chipSz + 8;
        ctx.save();
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(chipX, dexY, chipW, chipH, 5);
        } else {
          ctx.rect(chipX, dexY, chipW, chipH);
        }
        ctx.fillStyle = tc;
        ctx.fill();
        ctx.restore();
        ctx.fillStyle    = txt;
        ctx.textBaseline = 'middle';
        ctx.fillText(lbl, chipX + 8, dexY + chipH / 2);
        ctx.textBaseline = 'top';
        chipX += chipW + 6;
      });
    }

    // ── 2-column hierarchical layout ──
    // Large cards (top): 本命夥伴 + 今日主搭檔
    // Small cards (bottom): 場景搭檔 + 平衡搭檔
    const MARGIN  = 40;
    const COL_GAP = 20;
    const COL_W   = (W - MARGIN * 2 - COL_GAP) / 2;   // = 490
    const LEFT_X  = MARGIN;
    const RIGHT_X = MARGIN + COL_W + COL_GAP;           // = 550

    const LARGE_H = 510;
    const SMALL_H = 265;
    const ROW_GAP = 20;
    const ROW1_Y  = 192;
    const ROW2_Y  = ROW1_Y + LARGE_H + ROW_GAP;         // = 722

    // Large cards — circR 68, name 44px, label 28px, dex 24px, chip 18px
    drawCard(LEFT_X,  ROW1_Y, COL_W, LARGE_H, 68, slots.favoritePartner, 'slotFavorite', 44, 28, 24, 18);
    drawCard(RIGHT_X, ROW1_Y, COL_W, LARGE_H, 68, slots.mainGuardian,    'slotMain',     44, 28, 24, 18);

    // Small cards — circR 42, name 32px, label 22px, dex 20px, chip 15px
    drawCard(LEFT_X,  ROW2_Y, COL_W, SMALL_H, 42, slots.sceneSupport,   'slotScene',   32, 22, 20, 15);
    drawCard(RIGHT_X, ROW2_Y, COL_W, SMALL_H, 42, slots.balanceSupport, 'slotBalance', 32, 22, 20, 15);

    // ── Energy section ──
    const CARDS_BOTTOM = ROW2_Y + SMALL_H;   // = 987
    const ENERGY_Y     = CARDS_BOTTOM + 28;

    const elemSet = [...new Set([
      dist && dist.mainGuardian,
      dist && dist.sceneSupport,
      dist && dist.balanceSupport,
    ].filter(Boolean))];
    const energyLabels = elemSet.map(e => I18N.elemLabelText(e)).join('・');
    const energyPrefix = I18N.t('shareToday');
    const energyFull   = energyPrefix + energyLabels;

    ctx.fillStyle    = '#6b8cae';
    ctx.font         = '36px sans-serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(energyFull, W / 2, ENERGY_Y);

    // ── Disclaimer ──
    ctx.font      = '26px sans-serif';
    ctx.fillStyle = '#aaa098';
    const discText  = I18N.t('shareCardDisclaimer');
    const dLines    = wrapText(discText, W - 200);
    const dLineH    = 38;
    // Pin to bottom with margin
    const DISC_BOTTOM = H - 40;
    const DISC_START  = DISC_BOTTOM - (dLines.length - 1) * dLineH;
    dLines.forEach((line, i) => {
      ctx.fillText(line, W / 2, DISC_START + i * dLineH);
    });

    return canvas;
  }

  // 顯示分享圖片 Modal（預覽 + 下載）
  function showShareCardModal(canvas) {
    const existing = document.getElementById('shareModalOverlay');
    if (existing) document.body.removeChild(existing);

    const overlay = document.createElement('div');
    overlay.id        = 'shareModalOverlay';
    overlay.className = 'share-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'share-modal';
    modal.innerHTML = `
      <div class="share-modal-header">
        <span>${I18N.t('shareCardPreview')}</span>
        <button class="share-modal-close" id="modalClose">${I18N.t('shareModalClose')}</button>
      </div>
      <div class="share-modal-canvas-wrap" id="canvasWrap"></div>
      <div class="share-modal-actions">
        <button class="btn btn-primary" id="downloadBtn">${I18N.t('shareImgBtn')}</button>
      </div>`;

    // 縮小預覽：維持長寬比，最寬 428px
    const scale   = 0.40;
    const preview = document.createElement('canvas');
    preview.width  = Math.round(canvas.width  * scale);
    preview.height = Math.round(canvas.height * scale);
    const pCtx = preview.getContext('2d');
    pCtx.drawImage(canvas, 0, 0, preview.width, preview.height);
    preview.style.cssText = 'width:100%;height:auto;display:block;';
    modal.querySelector('#canvasWrap').appendChild(preview);

    // 下載原尺寸 1080×1350
    modal.querySelector('#downloadBtn').addEventListener('click', () => {
      const a = document.createElement('a');
      a.href     = canvas.toDataURL('image/png');
      a.download = 'pokemon-guardian-match.png';
      a.click();
    });

    modal.querySelector('#modalClose').addEventListener('click', () => {
      document.body.removeChild(overlay);
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) document.body.removeChild(overlay);
    });

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  // ── Disclaimer ───────────────────────────────────────────────────────────
  function buildDisclaimerHTML() {
    const text = rules && rules.disclaimer
      ? (rules.disclaimer[I18N.getLocale()] || rules.disclaimer.zh_tw || '')
      : '';
    return `<div class="disclaimer">
      <div class="disclaimer-title">${I18N.t('disclaimerTitle')}</div>
      <p>${text}</p>
    </div>`;
  }

  // ── Bootstrap ────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => { init().catch(console.error); });

})();
