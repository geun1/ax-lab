---
name: ax-article
description: AX 아티클(블로그, 아티클, 유튜브 등)을 분석하여 Discord 전송 + DB 저장 + HTML 시각화 생성
allowed-tools: Read, Write, Bash, Grep, Glob, WebFetch, Agent
---

# AX 아티클 분석

콘텐츠 분석 후 **반드시 두 파일을 모두 Write** 합니다:
1. `output/ax-article-result.json` — Watcher → DB + Discord embed
2. `output/ax-article-visual.html` — Watcher → PNG 스크린샷 → Discord 이미지

## 입력

`$ARGUMENTS` (URL, 텍스트, 또는 파일 경로)

## Step 1: 콘텐츠 수집

URL → WebFetch. 유튜브 → 제목/설명/자막.

## Step 2: 카테고리 분류

`ai-research` `ai-product` `ai-industry` `dev-tool` `crypto-web3` `startup` `design` `general`

## Step 3: JSON 저장

Write → `/Users/song/Desktop/geun1/ax_research/ax-lab/output/ax-article-result.json`

```json
{
  "title": "", "source_type": "", "source_url": "", "author": "",
  "published_date": "", "category": "", "tags": [], "importance": 4,
  "analyzed_date": "", "summary": "", "key_points": [],
  "detailed_analysis": "", "ax_relevance": "", "action_items": []
}
```

## Step 4: HTML 시각화 저장 (필수!)

**먼저 Read:**
```
/Users/song/Desktop/geun1/ax_research/ax-lab/ax-article/skills/ax-article/template.html
```

읽은 HTML 템플릿의 PLACEHOLDER를 분석 결과로 교체한 후 Write:
→ `/Users/song/Desktop/geun1/ax_research/ax-lab/output/ax-article-visual.html`

**PLACEHOLDER 교체:**
- `{{TITLE}}` → 제목
- `{{SUMMARY}}` → 요약
- `{{ACCENT}}` → 카테고리별 accent (ai-research=#3b82f6, ai-product=#8b5cf6, ai-industry=#f59e0b, dev-tool=#10b981, crypto-web3=#f43f5e, startup=#f97316, design=#ec4899, general=#6b7280)
- `{{ACCENT2}}` → 카테고리별 secondary (ai-research=#2563eb, ai-product=#7c3aed, ai-industry=#d97706, dev-tool=#059669, crypto-web3=#e11d48, startup=#ea580c, design=#db2777, general=#4b5563)
- `{{CATEGORY_LABEL}}` → 한국어 (AI 연구, AI 제품, AI 산업, 개발 도구, 크립토, 스타트업, 디자인, 일반)
- `{{SOURCE_TYPE}}` → 블로그/아티클/유튜브/논문/트윗/기타
- `{{AUTHOR}}` → 저자
- `{{DATE}}` → 발행일
- `{{IMPORTANCE}}` → 숫자
- `{{IMPORTANCE_STARS}}` → ⭐ 반복 (importance 수만큼)
- `{{TAGS}}` → `<span class="tag">tag</span>` 반복
- `{{KEY_POINTS}}` → 각 포인트마다 아래 HTML:
  ```html
  <div class="card kp-item" data-reveal><div class="kp-num">N</div><div class="kp-text">내용</div></div>
  ```
- `{{ANALYSIS}}` → 문단별 `<p>내용</p>`
- `{{AX_RELEVANCE}}` → 텍스트
- `{{ACTION_ITEMS}}` → 각 항목마다:
  ```html
  <div class="card action-item" data-reveal><div class="action-check"></div><span>내용</span></div>
  ```
- `{{ANALYZED_DATE}}` → 분석일
- `{{SOURCE_URL}}` → 원본 URL

## 규칙

- 한국어로 작성
- **Step 3 + Step 4 모두 필수** — 하나라도 빠지면 안 됨
- template.html을 반드시 Read한 뒤 PLACEHOLDER를 교체
