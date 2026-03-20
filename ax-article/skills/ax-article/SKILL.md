---
name: ax-article
description: AX 아티클(블로그, 아티클, 유튜브 등)을 분석하여 Discord 전송 + DB 저장 + 비주얼 카드 생성
allowed-tools: Read, Write, Bash, Grep, Glob, WebFetch, Agent
---

# AX 아티클 분석

콘텐츠 분석 후 **반드시 두 파일을 모두 Write** 합니다:
1. `output/ax-article-result.json` → DB + Discord embed
2. `output/ax-article-visual.html` → PNG → Discord 이미지

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

## Step 4: 비주얼 카드 저장 (필수!)

**먼저 Read:**
```
/Users/song/Desktop/geun1/ax_research/ax-lab/ax-article/skills/ax-article/template.html
```

읽은 템플릿의 PLACEHOLDER를 교체 후 Write:
→ `/Users/song/Desktop/geun1/ax_research/ax-lab/output/ax-article-visual.html`

**교체 규칙:**

| PLACEHOLDER | 값 | 주의사항 |
|---|---|---|
| `{{TITLE}}` | 제목 | 최대 2줄 |
| `{{SUMMARY}}` | 핵심 1-2문장 | 짧고 임팩트 있게 |
| `{{ACCENT}}` | 카테고리 색상 | 아래 표 참고 |
| `{{ACCENT2}}` | 카테고리 보조색 | 아래 표 참고 |
| `{{CATEGORY_LABEL}}` | 한국어 카테고리명 | AI 연구, 개발 도구 등 |
| `{{AUTHOR}}` | 저자 | |
| `{{DATE}}` | 발행일 | |
| `{{SOURCE_TYPE}}` | 블로그/아티클/유튜브 등 | |
| `{{IMPORTANCE_DOTS}}` | 중요도 도트 HTML | 아래 예시 참고 |
| `{{KEY_INSIGHTS}}` | 핵심 인사이트 HTML | **3개로 압축**, 각 1줄 |
| `{{AX_TAKEAWAY}}` | AX 시사점 | **1-2문장으로 압축** |
| `{{ACTIONS}}` | 액션 아이템 HTML | 각 1줄로 압축 |
| `{{TAGS}}` | 태그 HTML | |
| `{{ANALYZED_DATE}}` | 분석일 | |
| `{{SOURCE_URL}}` | 원본 URL | |

**카테고리 색상:**
- ai-research: `#3b82f6` / `#2563eb`
- ai-product: `#8b5cf6` / `#7c3aed`
- ai-industry: `#f59e0b` / `#d97706`
- dev-tool: `#10b981` / `#059669`
- crypto-web3: `#f43f5e` / `#e11d48`
- startup: `#f97316` / `#ea580c`
- design: `#ec4899` / `#db2777`
- general: `#6b7280` / `#4b5563`

**중요도 도트 (importance=4 예시):**
```html
<div class="imp-dot on"></div><div class="imp-dot on"></div><div class="imp-dot on"></div><div class="imp-dot on"></div><div class="imp-dot"></div>
```

**Key Insights (핵심을 3개로 압축, 각 1줄):**
```html
<div class="insight"><div class="insight-marker"></div><div class="insight-text">짧은 핵심 1줄</div></div>
```

**Actions (각 1줄로 압축):**
```html
<div class="action"><div class="action-box"></div><span>짧은 액션</span></div>
```

**Tags:**
```html
<span class="tag">tag1</span><span class="tag">tag2</span>
```

## 비주얼 카드 작성 원칙

- **짧게**: key_points가 5개여도 시각화에는 **가장 중요한 3개만** 선별하여 각 1줄로 압축
- **직관적**: 긴 문장 대신 핵심 키워드 + 숫자/비율 중심
- **한눈에**: detailed_analysis는 시각화에 넣지 않음 (텍스트 embed에서 봄)
- **AX 시사점**: ax_relevance를 1-2문장으로 재압축
- **액션**: 동사로 시작, 10자 이내

## 규칙

- 한국어로 작성
- **Step 3 + Step 4 모두 필수**
- template.html을 반드시 Read한 뒤 PLACEHOLDER 교체
