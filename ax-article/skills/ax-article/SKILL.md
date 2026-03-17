---
name: ax-article
description: AX 아티클(블로그, 아티클, 유튜브 등)을 분석하여 Discord 전송 및 DB 저장
allowed-tools: Read, Write, Bash, Grep, Glob, WebFetch, Agent, mcp__ax-article-api__submit_article, mcp__ax-article-api__search_articles, mcp__ax-article-api__list_articles
---

# AX 아티클 분석

사용자가 제공한 콘텐츠를 분석하고, `submit_article` MCP 도구로 전송하면 **DB 저장 + Discord 전송이 자동으로 처리**됩니다.

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

## Step 3: submit_article MCP 도구 호출

분석이 완료되면 **반드시 `submit_article` MCP 도구를 호출**합니다. 이 도구가 DB 저장, Vector DB 저장, Discord 전송을 모두 처리합니다.

도구 파라미터:
- `title`: 원본 제목
- `source_type`: blog / article / youtube / paper / tweet / other
- `source_url`: 원본 URL
- `author`: 저자/채널명
- `published_date`: YYYY-MM-DD 또는 unknown
- `category`: 위 카테고리 ID
- `tags`: 태그 배열 (소문자 영어, 최대 5개)
- `importance`: 1-5 (AX Research 관점 중요도)
- `analyzed_date`: 오늘 날짜 YYYY-MM-DD
- `summary`: 1-2문장 핵심 요약
- `key_points`: 핵심 포인트 배열
- `detailed_analysis`: 3-5문단 상세 분석
- `ax_relevance`: AX Research 관련성
- `action_items`: 후속 액션 배열

**curl이나 Bash를 사용하지 마세요. 반드시 submit_article MCP 도구를 호출하세요.**

## 규칙

- 한국어로 작성 (원문이 영어여도)
- importance: AX Research 관점 중요도 (1-5)
- tags: 소문자 영어, 최대 5개
- 카테고리: 위 표의 ID만 사용
- **분석 완료 후 submit_article 호출은 필수 — 사용자 확인 불필요**
