---
name: ax-article
description: AX 아티클(블로그, 아티클, 유튜브 등)을 분석하여 Discord 전송 및 DB 저장 + HTML 시각화 생성
allowed-tools: Read, Write, Bash, Grep, Glob, WebFetch, Agent
---

# AX 아티클 분석

사용자가 제공한 콘텐츠를 분석하고 두 파일을 저장합니다:
1. `output/ax-article-result.json` — 분석 데이터 (Watcher → DB + Discord)
2. `output/ax-article-visual.html` — 시각화 인포그래픽 (Watcher → Discord 링크)

## 입력

`$ARGUMENTS`

- URL → WebFetch로 가져옴
- 텍스트 → 그대로 사용
- 파일 경로 → Read로 읽음

## Step 1: 콘텐츠 수집

URL이면 WebFetch로 본문을 가져옵니다. 유튜브면 제목/설명/자막을 수집합니다.

## Step 2: 카테고리 분류

| ID | 이름 | 설명 |
|----|------|------|
| `ai-research` | AI 연구 | 논문, 모델, 알고리즘 |
| `ai-product` | AI 제품/서비스 | AI 도구, 서비스, 플랫폼 |
| `ai-industry` | AI 산업 동향 | 투자, M&A, 규제 |
| `dev-tool` | 개발 도구 | 프레임워크, 라이브러리 |
| `crypto-web3` | 크립토/Web3 | 블록체인, DeFi |
| `startup` | 스타트업 | 창업, 펀딩 |
| `design` | 디자인 | UI/UX, 디자인 시스템 |
| `general` | 일반 | 기타 |

## Step 3: JSON 저장

**Write 도구로 `/Users/song/Desktop/geun1/ax_research/ax-lab/output/ax-article-result.json` 에 저장:**

```json
{
  "title": "원본 제목",
  "source_type": "blog | article | youtube | paper | tweet | other",
  "source_url": "https://원본URL",
  "author": "저자/채널명",
  "published_date": "YYYY-MM-DD 또는 unknown",
  "category": "카테고리ID",
  "tags": ["tag1", "tag2"],
  "importance": 4,
  "analyzed_date": "YYYY-MM-DD (오늘)",
  "summary": "1-2문장 핵심 요약",
  "key_points": ["핵심1", "핵심2", "핵심3"],
  "detailed_analysis": "3-5문단 상세 분석",
  "ax_relevance": "AX Research 관련성",
  "action_items": ["액션1", "액션2"]
}
```

## Step 4: HTML 시각화 저장 (필수 — 건너뛰지 마세요)

JSON 저장 직후, 아래 HTML 템플릿에 분석 데이터를 채워서 **Write 도구로 `/Users/song/Desktop/geun1/ax_research/ax-lab/output/ax-article-visual.html` 에 저장**합니다.

**카테고리별 accent 색상** (theme-dark와 theme-light 모두 적용):
- ai-research: `--accent: #3b82f6; --accent-secondary: #2563eb;`
- ai-product: `--accent: #8b5cf6; --accent-secondary: #7c3aed;`
- ai-industry: `--accent: #f59e0b; --accent-secondary: #d97706;`
- dev-tool: `--accent: #10b981; --accent-secondary: #059669;`
- crypto-web3: `--accent: #f43f5e; --accent-secondary: #e11d48;`
- startup: `--accent: #f97316; --accent-secondary: #ea580c;`
- design: `--accent: #ec4899; --accent-secondary: #db2777;`
- general: `--accent: #6b7280; --accent-secondary: #4b5563;`

아래 HTML 템플릿의 **PLACEHOLDER**를 분석 결과로 교체하세요:

```html
<!DOCTYPE html>
<html lang="ko" class="theme-dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AX Research — TITLE_HERE</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Noto+Sans+KR:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js"></script>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html.theme-dark {
      --bg: #0A0A0A; --surface: #141414; --surface-hover: #1C1C1C;
      --border: rgba(255,255,255,0.04);
      --text: #EDEDED; --text-secondary: #888;
      --accent: ACCENT_COLOR; --accent-secondary: ACCENT2_COLOR;
      --positive: #10b981; --negative: #f43f5e; --warning: #f59e0b;
    }
    html.theme-light {
      --bg: #FAFAF9; --surface: #FFFFFF; --surface-hover: #F5F5F4;
      --border: rgba(0,0,0,0.06);
      --text: #0f172a; --text-secondary: #64748b;
      --accent: ACCENT_COLOR; --accent-secondary: ACCENT2_COLOR;
      --positive: #059669; --negative: #e11d48; --warning: #d97706;
    }
    body {
      font-family: 'Noto Sans KR', 'Inter', -apple-system, sans-serif;
      background: var(--bg); color: var(--text);
      line-height: 1.6; -webkit-font-smoothing: antialiased;
      letter-spacing: -0.01em; font-feature-settings: 'cv11', 'ss01';
      transition: background 0.3s, color 0.3s; scrollbar-gutter: stable;
    }
    body::before {
      content: ''; position: fixed; inset: 0; z-index: -1;
      background: radial-gradient(ellipse 80% 50% at 50% 20%, color-mix(in srgb, var(--accent), transparent 92%), transparent);
    }
    h1,h2,h3 { color: var(--text); letter-spacing: -0.03em; line-height: 1.08; text-wrap: balance; }
    h1 { font-weight: 700; } h2 { font-weight: 600; }
    .text-secondary { color: var(--text-secondary); }
    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }

    .container { max-width: 960px; margin: 0 auto; padding: 0 24px; }
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 24px; transition: box-shadow 0.2s ease; }
    .card:hover { box-shadow: 0 0 0 1px var(--border), 0 8px 16px rgba(0,0,0,0.08); }

    /* Hero */
    .hero { padding: 64px 0 40px; text-align: center; }
    .hero-badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 16px; background: color-mix(in srgb, var(--accent), transparent 88%); border: 1px solid color-mix(in srgb, var(--accent), transparent 70%); border-radius: 999px; font-size: 13px; color: var(--accent); font-weight: 600; margin-bottom: 24px; letter-spacing: 0.02em; }
    .hero h1 { font-size: clamp(2.2rem, 5vw, 3.2rem); margin-bottom: 16px; }
    .hero .summary { font-size: 1.1rem; color: var(--text-secondary); max-width: 640px; margin: 0 auto; line-height: 1.8; }
    .meta-bar { display: flex; flex-wrap: wrap; justify-content: center; gap: 24px; margin-top: 28px; font-size: 14px; color: var(--text-secondary); }
    .meta-bar strong { color: var(--text); font-weight: 600; }
    .tags { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 20px; }
    .tag { padding: 4px 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 6px; font-size: 13px; font-family: 'Inter', monospace; color: var(--accent); }

    /* Stats */
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--border); border-radius: 12px; overflow: hidden; margin: 40px 0; border: 1px solid rgba(255,255,255,0.08); }
    html.theme-light .stats { border-color: rgba(0,0,0,0.08); }
    .stat { background: var(--surface); padding: 28px 20px; text-align: center; }
    .stat-number { font-size: 2.2rem; font-weight: 700; letter-spacing: -0.04em; color: var(--accent); display: block; margin-bottom: 4px; line-height: 1; }
    .stat-label { font-size: 0.6875rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.1em; font-weight: 500; }

    /* Section */
    .section { margin-bottom: 48px; }
    .section-label { font-size: 0.6875rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-secondary); margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid var(--border); }

    /* Key Points */
    .kp-list { display: flex; flex-direction: column; gap: 12px; }
    .kp-item { display: flex; gap: 16px; padding: 20px; }
    .kp-num { flex-shrink: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: var(--accent); color: #fff; border-radius: 8px; font-family: 'Inter'; font-size: 14px; font-weight: 700; }
    .kp-text { font-size: 15px; line-height: 1.7; }

    /* Analysis */
    .analysis { font-size: 15px; line-height: 1.9; color: var(--text-secondary); }
    .analysis p { margin-bottom: 16px; }

    /* AX Relevance */
    .ax-card { padding: 24px; background: linear-gradient(135deg, color-mix(in srgb, var(--accent), transparent 94%), color-mix(in srgb, var(--accent-secondary), transparent 94%)); border: 1px solid var(--border); border-radius: 12px; font-size: 15px; line-height: 1.8; }
    .ax-badge { display: inline-block; padding: 2px 10px; background: var(--accent); color: #fff; border-radius: 4px; font-family: 'Inter'; font-size: 12px; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 12px; }

    /* Actions */
    .action-list { display: flex; flex-direction: column; gap: 10px; }
    .action-item { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; font-size: 14px; }
    .action-check { flex-shrink: 0; width: 18px; height: 18px; border: 2px solid var(--border); border-radius: 4px; margin-top: 2px; }

    /* Footer */
    .footer { text-align: center; padding: 32px 0; margin-top: 48px; border-top: 1px solid var(--border); font-size: 13px; color: var(--text-secondary); }

    /* Animations */
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
    .animate { animation: fadeInUp 0.6s ease-out both; }
    .animate.delay-1 { animation-delay: 0.1s; } .animate.delay-2 { animation-delay: 0.2s; }
    .animate.delay-3 { animation-delay: 0.3s; } .animate.delay-4 { animation-delay: 0.4s; }
    .reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
    .reveal.visible { opacity: 1; transform: translateY(0); }
    @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } .reveal { opacity: 1; transform: none; } }

    /* Menu */
    .viz-menu { position: fixed; top: 16px; right: 16px; z-index: 9999; }
    .viz-menu-toggle { width: 44px; height: 44px; border-radius: 12px; background: var(--surface); border: 1px solid var(--border); color: var(--text); cursor: pointer; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(12px); transition: all 0.2s; }
    .viz-menu-toggle:hover { background: var(--surface-hover); }
    .viz-menu-dropdown { position: absolute; top: 52px; right: 0; min-width: 200px; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 8px; opacity: 0; visibility: hidden; transform: translateY(-8px); transition: all 0.2s; backdrop-filter: blur(16px); }
    .viz-menu-dropdown.open { opacity: 1; visibility: visible; transform: translateY(0); }
    .viz-menu-dropdown button { width: 100%; padding: 10px 14px; border: none; border-radius: 8px; background: transparent; color: var(--text); font-size: 14px; font-family: inherit; cursor: pointer; text-align: left; display: flex; align-items: center; gap: 10px; transition: background 0.15s; }
    .viz-menu-dropdown button:hover { background: var(--surface-hover); }

    /* Print */
    @media print { body { background: #fff !important; color: #000 !important; } .viz-menu { display: none !important; } .reveal { opacity: 1 !important; transform: none !important; } .card { break-inside: avoid; border: 1px solid #ddd; box-shadow: none; } * { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }

    /* Responsive */
    @media (max-width: 640px) { .container { padding: 0 16px; } .stats { grid-template-columns: repeat(2, 1fr); } .hero { padding: 40px 0 28px; } .hero h1 { font-size: 1.8rem; } }
  </style>
</head>
<body>
  <div class="viz-menu">
    <button class="viz-menu-toggle" onclick="toggleMenu()" aria-label="Menu">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="5" x2="17" y2="5"/><line x1="3" y1="10" x2="17" y2="10"/><line x1="3" y1="15" x2="17" y2="15"/></svg>
    </button>
    <div class="viz-menu-dropdown" id="vizMenuDropdown">
      <button onclick="cycleTheme()"><span id="themeIcon">🌙</span><span id="themeLabel">Dark</span></button>
      <button onclick="downloadImage()"><span>📥</span><span>Download PNG</span></button>
      <button onclick="window.print()"><span>🖨️</span><span>Print / PDF</span></button>
    </div>
  </div>
  <main id="main-content">
    <div class="container">

      <!-- HERO: 제목, 요약, 메타 -->
      <header class="hero animate">
        <div class="hero-badge">CATEGORY_LABEL</div>
        <h1>TITLE_HERE</h1>
        <p class="summary">SUMMARY_HERE</p>
        <div class="meta-bar">
          <span>SOURCETYPE_ICON SOURCETYPE_LABEL</span>
          <span>by <strong>AUTHOR_HERE</strong></span>
          <span>PUBLISHED_DATE_HERE</span>
        </div>
        <div class="tags">
          <!-- <span class="tag">tag1</span> 반복 -->
        </div>
      </header>

      <!-- STATS: 4칸 -->
      <section class="stats animate delay-1" role="region">
        <div class="stat"><span class="stat-number" data-count="IMPORTANCE">IMPORTANCE</span><span class="stat-label">중요도</span></div>
        <div class="stat"><span class="stat-number" data-count="KP_COUNT">KP_COUNT</span><span class="stat-label">핵심 포인트</span></div>
        <div class="stat"><span class="stat-number" data-count="ACTION_COUNT">ACTION_COUNT</span><span class="stat-label">액션 아이템</span></div>
        <div class="stat"><span class="stat-number">CATEGORY_ID</span><span class="stat-label">카테고리</span></div>
      </section>

      <!-- KEY POINTS -->
      <section class="section" data-reveal>
        <div class="section-label">핵심 내용</div>
        <div class="kp-list">
          <!-- 각 key_point마다:
          <div class="card kp-item">
            <div class="kp-num">1</div>
            <div class="kp-text">KEY_POINT_TEXT</div>
          </div>
          -->
        </div>
      </section>

      <!-- DETAILED ANALYSIS -->
      <section class="section" data-reveal>
        <div class="section-label">상세 분석</div>
        <div class="analysis">
          <!-- detailed_analysis를 \n\n으로 분리하여 <p> 태그 -->
        </div>
      </section>

      <!-- AX RELEVANCE -->
      <section class="section" data-reveal>
        <div class="section-label">AX 관련성</div>
        <div class="ax-card">
          <div class="ax-badge">AX</div>
          <p>AX_RELEVANCE_HERE</p>
        </div>
      </section>

      <!-- ACTION ITEMS -->
      <section class="section" data-reveal>
        <div class="section-label">액션 아이템</div>
        <div class="action-list">
          <!-- 각 action_item마다:
          <div class="card action-item">
            <div class="action-check"></div>
            <span>ACTION_TEXT</span>
          </div>
          -->
        </div>
      </section>

      <!-- FOOTER -->
      <footer class="footer">
        AX Research · ANALYZED_DATE · <a href="SOURCE_URL">원문 보기</a>
      </footer>
    </div>
  </main>
  <script>
    function toggleMenu() { document.getElementById('vizMenuDropdown').classList.toggle('open'); }
    document.addEventListener('click', function(e) { if (!e.target.closest('.viz-menu')) document.getElementById('vizMenuDropdown').classList.remove('open'); });

    var savedTheme = localStorage.getItem('viz-theme');
    var currentTheme = savedTheme || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    function applyTheme(t) {
      document.documentElement.className = 'theme-' + t;
      document.getElementById('themeIcon').textContent = t === 'dark' ? '🌙' : '☀️';
      document.getElementById('themeLabel').textContent = t === 'dark' ? 'Dark' : 'Light';
      localStorage.setItem('viz-theme', t); currentTheme = t;
    }
    function cycleTheme() { applyTheme(currentTheme === 'dark' ? 'light' : 'dark'); }
    applyTheme(currentTheme);

    document.querySelectorAll('[data-reveal]').forEach(function(el) { el.classList.add('reveal'); });
    var ro = new IntersectionObserver(function(entries) { entries.forEach(function(e) { if (e.isIntersecting) { e.target.classList.add('visible'); ro.unobserve(e.target); } }); }, { threshold: 0.15 });
    document.querySelectorAll('.reveal').forEach(function(el) { ro.observe(el); });

    function animateCounters() {
      document.querySelectorAll('[data-count]').forEach(function(el) {
        if (el.dataset.counted) return; el.dataset.counted = '1';
        var target = parseFloat(el.dataset.count), suffix = el.dataset.suffix || '';
        var start = performance.now(), dur = 1000;
        (function tick(now) { var p = Math.min((now - start) / dur, 1), e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(target * e) + suffix; if (p < 1) requestAnimationFrame(tick); })(start);
      });
    }
    var ce = document.querySelector('[data-count]');
    if (ce) { var co = new IntersectionObserver(function(es) { es.forEach(function(e) { if (e.isIntersecting) { animateCounters(); co.disconnect(); } }); }, { threshold: 0.3 }); co.observe(ce); }

    async function downloadImage() {
      var m = document.querySelector('.viz-menu'); m.style.display = 'none';
      try { var url = await htmlToImage.toPng(document.body, { quality: 1, pixelRatio: 2, filter: function(n) { return !n.classList || !n.classList.contains('viz-menu'); } }); var a = document.createElement('a'); a.href = url; a.download = document.title.replace(/\s+/g, '-').toLowerCase() + '.png'; a.click(); } catch(e) { console.error(e); }
      m.style.display = '';
    }
  </script>
</body>
</html>
```

**PLACEHOLDER 교체 규칙:**
- `TITLE_HERE` → JSON title
- `SUMMARY_HERE` → JSON summary
- `ACCENT_COLOR` / `ACCENT2_COLOR` → 카테고리별 accent 색상 (위 목록 참고)
- `CATEGORY_LABEL` → 카테고리 한국어 이름 (예: "AI 연구", "개발 도구")
- `SOURCETYPE_ICON` → SVG 아이콘 (blog=연필, article=신문, youtube=재생, paper=문서, tweet=새, other=클립)
- `SOURCETYPE_LABEL` → 소스 한국어 (블로그, 아티클, 유튜브, 논문, 트윗, 기타)
- `AUTHOR_HERE` → JSON author
- `PUBLISHED_DATE_HERE` → JSON published_date
- `IMPORTANCE` → JSON importance 숫자
- `KP_COUNT` → key_points 배열 길이
- `ACTION_COUNT` → action_items 배열 길이
- `CATEGORY_ID` → JSON category
- key_points 배열 → `.kp-item` 반복
- detailed_analysis → `\n\n`으로 분리하여 `<p>` 태그
- `AX_RELEVANCE_HERE` → JSON ax_relevance
- action_items 배열 → `.action-item` 반복
- `ANALYZED_DATE` → JSON analyzed_date
- `SOURCE_URL` → JSON source_url
- 태그 배열 → `.tag` span 반복

**두 파일 모두 Write한 후** 사용자에게 요약을 보여줍니다.

## 규칙

- 한국어로 작성 (원문이 영어여도)
- importance: AX Research 관점 중요도 (1-5)
- tags: 소문자 영어, 최대 5개
- 카테고리: 위 표의 ID만 사용
- **Step 3 (JSON)과 Step 4 (HTML) 모두 필수 — 하나라도 빠지면 안 됨**
- HTML의 CSS variable 이름 변경 금지
- hover는 shadow만 (translateY, scale 금지)
- JS는 var만 (let/const 금지)
