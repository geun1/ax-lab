---
name: ax-article
description: AX 아티클(블로그, 아티클, 유튜브 등)을 분석하여 Discord 전송 및 DB 저장. 사용법 - /ax-article:ax-article <URL 또는 텍스트>
allowed-tools: Read, Write, Bash, Grep, Glob, WebFetch, Agent
---

# AX 아티클 분석 플러그인

사용자가 제공한 콘텐츠를 분석 → JSON 생성 → Discord 전송 → DB 저장까지 **자동으로 모두 수행**합니다.

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

## Step 3: JSON 생성 및 저장

분석 결과를 아래 JSON으로 `/tmp/ax-article-result.json`에 저장합니다. **모든 필드 필수**:

```json
{
  "title": "원본 제목",
  "source_type": "blog | article | youtube | paper | tweet | other",
  "source_url": "https://...",
  "author": "저자/채널명",
  "published_date": "YYYY-MM-DD 또는 unknown",
  "category": "카테고리 ID",
  "tags": ["tag1", "tag2"],
  "importance": 4,
  "analyzed_date": "YYYY-MM-DD (오늘)",
  "summary": "1-2문장 핵심 요약",
  "key_points": ["핵심 포인트1", "핵심 포인트2", "핵심 포인트3"],
  "detailed_analysis": "3-5문단 상세 분석 (주요 주장, 기술 세부사항, 시장 영향, 기존 접근법과 차이)",
  "ax_relevance": "AX Research에 어떤 의미가 있는지",
  "action_items": ["후속 액션1", "후속 액션2"],
  "full_markdown": "전체 분석 마크다운"
}
```

## Step 4: Discord 전송 + DB 저장 (자동 실행)

JSON을 `/tmp/ax-article-result.json`에 Write 도구로 저장한 후, **반드시 아래 두 Bash 명령을 순서대로 실행**합니다. 사용자에게 묻지 않고 바로 실행합니다:

**Discord 전송:**
```bash
node /Users/song/Desktop/geun1/ax_research/ax-lab/scripts/discord-send.js /tmp/ax-article-result.json
```

**DB 저장:**
```bash
node /Users/song/Desktop/geun1/ax_research/ax-lab/scripts/db-save.js /tmp/ax-article-result.json
```

두 명령 모두 실행한 후 결과를 사용자에게 요약해서 보여줍니다.
실행하지 않고 안내만 하는 것은 금지입니다. 반드시 Bash 도구로 직접 실행하세요.

## 규칙

- 한국어로 작성 (원문이 영어여도)
- importance: AX Research 관점 중요도 (1-5)
- tags: 소문자 영어, 최대 5개
- 카테고리: 위 표의 ID만 사용
- **분석 완료 후 Discord 전송과 DB 저장은 무조건 자동 실행** — 사용자 확인 불필요
