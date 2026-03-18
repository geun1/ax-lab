---
name: ax-visualize
description: AX 아티클 분석 결과를 아름다운 HTML 인포그래픽으로 시각화합니다. /ax-article:ax-visualize 로 호출하거나, ax-article 분석 후 자동 실행됩니다.
allowed-tools: Read, Write, Bash, Glob
---

# AX 아티클 시각화

아티클 분석 결과 JSON을 읽어 **visualize 플러그인과 동일한 품질의 HTML 인포그래픽**을 생성합니다.

## 입력

`$ARGUMENTS`

입력이 없으면 `output/ax-article-result.json`을 읽습니다.

## 절차

1. **Read**로 `/Users/song/Desktop/geun1/ax_research/ax-lab/output/ax-article-result.json` 읽기
2. **Read**로 이 스킬 디렉토리의 `skeleton.md` 읽기 — **반드시 이 skeleton을 기반으로 시작**
3. JSON 데이터를 skeleton에 채워 인포그래픽 HTML 생성
4. **Write**로 `/Users/song/Desktop/geun1/ax_research/ax-lab/output/ax-article-visual.html` 저장

## 핵심 규칙 (visualize 플러그인과 동일)

### 반드시 skeleton.md에서 시작
```
Read: /Users/song/Desktop/geun1/ax_research/ax-lab/ax-article/skills/ax-visualize/skeleton.md
```
skeleton의 전체 HTML을 복사한 뒤 콘텐츠를 추가합니다. **절대 처음부터 새로 작성하지 마세요.**

### CSS Custom Properties (이름 변경 금지)
`--bg, --surface, --surface-hover, --border, --text, --text-secondary, --accent, --accent-secondary, --positive, --negative, --warning`

### class 기반 테마만 사용
`html.theme-dark` / `html.theme-light` — `@media (prefers-color-scheme)` 절대 금지

### 한국어 폰트
```html
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```
`font-family: 'Noto Sans KR', 'Inter', sans-serif;`
`<html lang="ko">`

### JS는 var만 사용 (let/const 금지 — TDZ 방지)

### hover는 shadow만 (translateY, scale 금지)

### 아이콘은 inline SVG (이모지 금지)

### 인포그래픽 구조 — 아티클 분석 결과용

skeleton의 `<main>` 안에 아래 구조로 콘텐츠를 배치합니다:

#### 1. Hero 섹션
- 카테고리 뱃지 (pill shape, accent 배경)
- 아티클 제목 (h1, `letter-spacing: -0.03em`, `font-weight: 700`)
- 한줄 요약 (text-secondary)
- 메타 정보 바: 저자 · 발행일 · 소스타입

#### 2. Stats 바 (4칸 그리드)
- 중요도 (⭐ data-count 사용)
- 핵심 포인트 수
- 액션 아이템 수
- 카테고리

#### 3. Key Points 섹션
- 각 포인트를 카드로 표시 (`.card` 클래스 사용)
- 왼쪽에 번호 accent 원형 뱃지
- `data-reveal` 속성으로 스크롤 애니메이션

#### 4. 상세 분석 섹션
- 문단별 `<p>` 태그
- `data-reveal`

#### 5. AX 관련성 섹션
- accent 그라데이션 배경 카드
- AX 로고/뱃지

#### 6. 액션 아이템 섹션
- 체크박스 스타일 리스트

#### 7. 태그 + 소스 링크 푸터

### 디자인 시스템 참고
더 상세한 디자인 가이드가 필요하면:
```
Read: /Users/song/Desktop/geun1/ax_research/ax-lab/ax-article/skills/ax-visualize/design-system.md
```

### Typography
- Hero h1: `clamp(2.5rem, 6vw, 3.5rem)`, `font-weight: 700`, `letter-spacing: -0.03em`
- Section titles: `font-size: 0.6875rem`, `text-transform: uppercase`, `letter-spacing: 0.1em`, `font-weight: 500`, `color: var(--text-secondary)`
- Body: `font-size: 1rem`, `line-height: 1.7`

### Spacing (8px 그리드)
4, 8, 12, 16, 24, 32, 48, 64, 96px

### 배경
```css
body::before {
  content: ''; position: fixed; inset: 0; z-index: -1;
  background: radial-gradient(ellipse 80% 50% at 50% 20%,
    color-mix(in srgb, var(--accent), transparent 92%), transparent);
}
```

### Stats 그리드 (ai-timeline 예시 참고)
```css
.stats {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 1px; background: var(--border);
  border-radius: 12px; overflow: hidden;
  border: 1px solid rgba(255,255,255,0.08);
}
.stat { background: var(--surface); padding: 32px 24px; text-align: center; }
.stat-number { font-size: 2.5rem; font-weight: 700; letter-spacing: -0.04em; color: var(--accent); }
.stat-label { font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-secondary); font-weight: 500; }
```

### 카테고리별 accent 색상
```
ai-research: --accent: #3b82f6;  --accent-secondary: #2563eb;
ai-product:  --accent: #8b5cf6;  --accent-secondary: #7c3aed;
ai-industry: --accent: #f59e0b;  --accent-secondary: #d97706;
dev-tool:    --accent: #10b981;  --accent-secondary: #059669;
crypto-web3: --accent: #f43f5e;  --accent-secondary: #e11d48;
startup:     --accent: #f97316;  --accent-secondary: #ea580c;
design:      --accent: #ec4899;  --accent-secondary: #db2777;
general:     --accent: #6b7280;  --accent-secondary: #4b5563;
```
JSON의 `category`에 따라 `html.theme-dark`와 `html.theme-light`의 `--accent`, `--accent-secondary` 값을 변경하세요.

### 반응형
```css
@media (max-width: 640px) {
  .stats { grid-template-columns: repeat(2, 1fr); }
}
```

### 파일명
반드시 `ax-article-visual.html`

### 파일 저장 후
```bash
open /Users/song/Desktop/geun1/ax_research/ax-lab/output/ax-article-visual.html
```
