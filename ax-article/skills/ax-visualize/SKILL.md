---
name: ax-visualize
description: AX 아티클 분석 결과를 아름다운 HTML 인포그래픽으로 시각화합니다. /ax-article:ax-visualize 로 호출하거나, ax-article 분석 후 자동 실행됩니다.
allowed-tools: Read, Write, Bash, Glob
---

# AX 아티클 시각화

아티클 분석 결과 JSON을 읽어 **단일 HTML 인포그래픽 파일**로 시각화합니다.
생성된 HTML은 `output/` 디렉토리에 저장되며, Watcher가 자동으로 Discord에 전송합니다.

## 입력

`$ARGUMENTS`

입력이 없으면 `output/ax-article-result.json` 을 읽습니다.
파일 경로가 주어지면 해당 JSON을 읽습니다.

## 절차

1. **Read** 도구로 `/Users/song/Desktop/geun1/ax_research/ax-lab/output/ax-article-result.json` 읽기
2. JSON 데이터를 기반으로 아래 HTML 템플릿에 콘텐츠를 채워 인포그래픽 생성
3. **Write** 도구로 `/Users/song/Desktop/geun1/ax_research/ax-lab/output/ax-article-visual.html` 에 저장
4. **Bash** 도구로 `open /Users/song/Desktop/geun1/ax_research/ax-lab/output/ax-article-visual.html` 실행

## HTML 템플릿 — 반드시 이 구조를 따르세요

```html
<!DOCTYPE html>
<html lang="ko" class="theme-dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AX Research — ARTICLE_TITLE</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js"></script>
  <style>
    /* ===== THEME VARIABLES (이름 변경 금지) ===== */
    html.theme-dark {
      --bg: #0A0A0A;
      --surface: #141414;
      --surface-hover: #1C1C1C;
      --border: rgba(255,255,255,0.06);
      --text: #EDEDED;
      --text-secondary: #888;
      --accent: #3b82f6;
      --accent-secondary: #8b5cf6;
      --positive: #10b981;
      --negative: #f43f5e;
      --warning: #f59e0b;
    }
    html.theme-light {
      --bg: #FAFAFA;
      --surface: #FFFFFF;
      --surface-hover: #F5F5F5;
      --border: rgba(0,0,0,0.06);
      --text: #0f172a;
      --text-secondary: #64748b;
      --accent: #2563eb;
      --accent-secondary: #7c3aed;
      --positive: #059669;
      --negative: #e11d48;
      --warning: #d97706;
    }

    /* ===== RESET & BASE ===== */
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Noto Sans KR', 'Inter', system-ui, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.7;
      -webkit-font-smoothing: antialiased;
    }

    /* ===== LAYOUT ===== */
    .container { max-width: 960px; margin: 0 auto; padding: 48px 24px 64px; }

    /* ===== HERO ===== */
    .hero {
      text-align: center;
      padding: 64px 0 48px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 48px;
    }
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 16px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 999px;
      font-size: 13px;
      color: var(--text-secondary);
      margin-bottom: 24px;
    }
    .hero-badge .dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: var(--accent);
    }
    .hero h1 {
      font-family: 'Inter', sans-serif;
      font-size: clamp(28px, 5vw, 42px);
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.2;
      margin-bottom: 16px;
    }
    .hero .summary {
      font-size: 17px;
      color: var(--text-secondary);
      max-width: 640px;
      margin: 0 auto;
      line-height: 1.8;
    }

    /* ===== META BAR ===== */
    .meta-bar {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 24px;
      margin-top: 32px;
    }
    .meta-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: var(--text-secondary);
    }
    .meta-item strong { color: var(--text); font-weight: 600; }

    /* ===== IMPORTANCE INDICATOR ===== */
    .importance {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 12px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
    }
    .importance-5 { background: rgba(244,63,94,0.12); color: var(--negative); }
    .importance-4 { background: rgba(245,158,11,0.12); color: var(--warning); }
    .importance-3 { background: rgba(59,130,246,0.12); color: var(--accent); }
    .importance-2 { background: rgba(16,185,129,0.12); color: var(--positive); }
    .importance-1 { background: var(--surface); color: var(--text-secondary); }

    /* ===== TAGS ===== */
    .tags { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 20px; }
    .tag {
      padding: 4px 12px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 6px;
      font-size: 13px;
      font-family: 'Inter', monospace;
      color: var(--accent);
    }

    /* ===== SECTION ===== */
    .section { margin-bottom: 48px; }
    .section-title {
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--accent);
      margin-bottom: 24px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border);
    }

    /* ===== KEY POINTS ===== */
    .key-points { display: flex; flex-direction: column; gap: 16px; }
    .key-point {
      display: flex;
      gap: 16px;
      padding: 20px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      transition: box-shadow 0.2s ease;
    }
    .key-point:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .key-point-num {
      flex-shrink: 0;
      width: 32px; height: 32px;
      display: flex; align-items: center; justify-content: center;
      background: var(--accent);
      color: #fff;
      border-radius: 8px;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      font-weight: 700;
    }
    .key-point-text { font-size: 15px; line-height: 1.7; }

    /* ===== ANALYSIS ===== */
    .analysis {
      font-size: 15px;
      line-height: 1.9;
      color: var(--text-secondary);
    }
    .analysis p { margin-bottom: 16px; }

    /* ===== AX RELEVANCE ===== */
    .ax-relevance {
      padding: 24px;
      background: linear-gradient(135deg, rgba(59,130,246,0.06), rgba(139,92,246,0.06));
      border: 1px solid var(--border);
      border-radius: 12px;
      font-size: 15px;
      line-height: 1.8;
    }
    .ax-relevance::before {
      content: 'AX';
      display: inline-block;
      padding: 2px 8px;
      background: var(--accent);
      color: #fff;
      border-radius: 4px;
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
    }

    /* ===== ACTION ITEMS ===== */
    .action-items { display: flex; flex-direction: column; gap: 12px; }
    .action-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      font-size: 14px;
    }
    .action-check {
      flex-shrink: 0;
      width: 20px; height: 20px;
      border: 2px solid var(--border);
      border-radius: 4px;
      margin-top: 1px;
    }

    /* ===== FOOTER ===== */
    .footer {
      text-align: center;
      padding: 32px 0;
      margin-top: 48px;
      border-top: 1px solid var(--border);
      font-size: 13px;
      color: var(--text-secondary);
    }

    /* ===== MENU ===== */
    .viz-menu { position: fixed; top: 16px; right: 16px; z-index: 1000; }
    .viz-menu-toggle {
      width: 40px; height: 40px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      color: var(--text);
      font-size: 18px;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
    }
    .viz-menu-dropdown {
      display: none;
      position: absolute;
      top: 48px; right: 0;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 8px;
      min-width: 180px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }
    .viz-menu-dropdown.open { display: block; }
    .viz-menu-dropdown button {
      display: flex; align-items: center; gap: 10px;
      width: 100%;
      padding: 10px 12px;
      background: none;
      border: none;
      border-radius: 8px;
      color: var(--text);
      font-size: 14px;
      cursor: pointer;
    }
    .viz-menu-dropdown button:hover { background: var(--surface-hover); }

    /* ===== ANIMATIONS ===== */
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
    .reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
    .reveal.visible { opacity: 1; transform: translateY(0); }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 768px) {
      .container { padding: 32px 16px 48px; }
      .hero { padding: 40px 0 32px; }
      .meta-bar { gap: 16px; }
      .key-point { padding: 16px; }
    }

    /* ===== PRINT ===== */
    @media print {
      body { background: white !important; color: black !important; }
      .viz-menu { display: none !important; }
      .key-point, .action-item, .ax-relevance { break-inside: avoid; border: 1px solid #ddd; box-shadow: none; }
      * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <!-- MENU -->
  <div class="viz-menu">
    <button class="viz-menu-toggle" onclick="toggleMenu()">☰</button>
    <div class="viz-menu-dropdown" id="vizMenuDropdown">
      <button onclick="cycleTheme()"><span>🌓</span><span id="themeLabel">테마 전환</span></button>
      <button onclick="downloadImage()"><span>📥</span><span>PNG 다운로드</span></button>
      <button onclick="window.print()"><span>🖨️</span><span>인쇄 / PDF</span></button>
    </div>
  </div>

  <div class="container">
    <!-- HERO -->
    <div class="hero reveal">
      <div class="hero-badge"><span class="dot"></span> CATEGORY_LABEL • SOURCE_TYPE_LABEL</div>
      <h1>ARTICLE_TITLE</h1>
      <p class="summary">ARTICLE_SUMMARY</p>
      <div class="meta-bar">
        <div class="meta-item">✍️ <strong>AUTHOR</strong></div>
        <div class="meta-item">📅 <strong>PUBLISHED_DATE</strong></div>
        <div class="meta-item"><span class="importance importance-N">⭐ 중요도 N/5</span></div>
      </div>
      <div class="tags">
        <!-- TAG badges here -->
      </div>
    </div>

    <!-- KEY POINTS -->
    <div class="section reveal">
      <div class="section-title">핵심 내용</div>
      <div class="key-points">
        <!-- Repeat for each key_point:
        <div class="key-point">
          <div class="key-point-num">1</div>
          <div class="key-point-text">KEY_POINT_TEXT</div>
        </div>
        -->
      </div>
    </div>

    <!-- DETAILED ANALYSIS -->
    <div class="section reveal">
      <div class="section-title">상세 분석</div>
      <div class="analysis">
        <!-- Split detailed_analysis into <p> paragraphs -->
      </div>
    </div>

    <!-- AX RELEVANCE -->
    <div class="section reveal">
      <div class="section-title">AX 관련성</div>
      <div class="ax-relevance">
        AX_RELEVANCE_TEXT
      </div>
    </div>

    <!-- ACTION ITEMS -->
    <div class="section reveal">
      <div class="section-title">액션 아이템</div>
      <div class="action-items">
        <!-- Repeat for each action_item:
        <div class="action-item">
          <div class="action-check"></div>
          <span>ACTION_ITEM_TEXT</span>
        </div>
        -->
      </div>
    </div>

    <!-- FOOTER -->
    <div class="footer">
      AX Research • 분석일: ANALYZED_DATE • SOURCE_URL
    </div>
  </div>

  <script>
    // Theme
    var savedTheme = localStorage.getItem('viz-theme');
    var currentTheme = savedTheme || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    function applyTheme(t) {
      document.documentElement.className = 'theme-' + t;
      localStorage.setItem('viz-theme', t);
      currentTheme = t;
    }
    function cycleTheme() { applyTheme(currentTheme === 'dark' ? 'light' : 'dark'); }
    applyTheme(currentTheme);

    // Menu
    function toggleMenu() {
      document.getElementById('vizMenuDropdown').classList.toggle('open');
    }
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.viz-menu')) document.getElementById('vizMenuDropdown').classList.remove('open');
    });

    // PNG Download
    async function downloadImage() {
      var menu = document.querySelector('.viz-menu');
      menu.style.display = 'none';
      try {
        var url = await htmlToImage.toPng(document.body, { quality: 1, pixelRatio: 2, filter: function(n) { return !n.classList || !n.classList.contains('viz-menu'); } });
        var a = document.createElement('a');
        a.href = url;
        a.download = document.title.replace(/\s+/g, '-').toLowerCase() + '.png';
        a.click();
      } catch(e) { console.error(e); }
      menu.style.display = '';
    }

    // Scroll reveal
    var revealObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(en) {
        if (en.isIntersecting) { en.target.classList.add('visible'); revealObserver.unobserve(en.target); }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('.reveal').forEach(function(el) { revealObserver.observe(el); });
  </script>
</body>
</html>
```

## 규칙

- JSON의 모든 값을 HTML 템플릿의 해당 위치에 채워넣습니다
- **CSS Custom Property 이름은 절대 변경하지 마세요** (--bg, --surface, --text 등)
- `class="theme-dark"` 기반 테마만 사용 (`@media (prefers-color-scheme)` 금지)
- 모든 CSS/JS는 인라인 (외부 파일 없음, CDN 폰트/라이브러리만 예외)
- `var` 키워드만 사용 (let/const 금지 — TDZ 에러 방지)
- hover 시 shadow만 사용 (translateY, scale 금지)
- 카테고리별 accent 색상: ai-research=#3b82f6, ai-product=#8b5cf6, ai-industry=#f59e0b, dev-tool=#10b981, crypto-web3=#f43f5e, startup=#f97316, design=#ec4899, general=#6b7280
- detailed_analysis는 `\n\n`으로 문단 분리하여 `<p>` 태그로 감쌈
- 파일명은 반드시 `ax-article-visual.html`
