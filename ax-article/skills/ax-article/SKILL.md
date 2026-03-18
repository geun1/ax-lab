---
name: ax-article
description: AX 아티클(블로그, 아티클, 유튜브 등)을 분석하여 Discord 전송 및 DB 저장
allowed-tools: Read, Write, Grep, Glob, WebFetch, Agent
---

# AX 아티클 분석

사용자가 제공한 콘텐츠를 분석하고, `/Users/song/Desktop/geun1/ax_research/ax-lab/output/ax-article-result.json`에 Write하면 **로컬 Watcher가 자동으로 DB 저장 + Discord 전송**을 처리합니다.

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

## Step 3: JSON 파일 저장

분석이 완료되면 아래 JSON을 **Write 도구로 `/Users/song/Desktop/geun1/ax_research/ax-lab/output/ax-article-result.json` 에 저장**합니다.
저장하면 로컬 Watcher가 자동으로 감지하여 DB 저장과 Discord 전송을 처리합니다.

**모든 필드를 빠짐없이 채워주세요:**

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

## Step 4: HTML 시각화 생성

JSON 저장 후, 분석 결과를 **HTML 인포그래픽**으로도 생성합니다.
`/ax-article:ax-visualize` 스킬의 HTML 템플릿을 참고하여 `/Users/song/Desktop/geun1/ax_research/ax-lab/output/ax-article-visual.html` 에 Write합니다.
Watcher가 HTML 파일도 감지하여 Discord에 파일로 첨부 전송합니다.

시각화 생성 시 `ax-visualize` 스킬의 SKILL.md를 Read하여 템플릿과 규칙을 따르세요:
```
Read: /Users/song/Desktop/geun1/ax_research/ax-lab/ax-article/skills/ax-visualize/SKILL.md
```

Write 완료 후 사용자에게 분석 결과를 요약해서 보여줍니다.

## 규칙

- 한국어로 작성 (원문이 영어여도)
- importance: AX Research 관점 중요도 (1-5)
- tags: 소문자 영어, 최대 5개
- 카테고리: 위 표의 ID만 사용
- **분석 완료 후 Write는 필수 — 사용자 확인 불필요**
