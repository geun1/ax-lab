---
name: ax-article
description: AX 아티클(블로그, 아티클, 유튜브 등)을 분석하여 Discord 전송 및 DB 저장
allowed-tools: Read, Write, Bash, Grep, Glob, WebFetch, Agent
---

# AX 아티클 분석

사용자가 제공한 콘텐츠를 분석하고, API에 POST하면 **DB 저장 + Discord 전송이 자동으로 처리**됩니다.

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

## Step 3: 분석 및 API 전송

분석 결과를 아래 JSON으로 구성한 뒤, **Bash 도구로 아래 curl 명령을 실행**합니다.
이 한 번의 API 호출로 DB 저장, Vector DB 저장, Discord 전송이 모두 자동 처리됩니다.

```bash
curl -s -X POST "https://ax-article-api.gsong.workers.dev/api/articles" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "원본 제목",
    "source_type": "blog 또는 article/youtube/paper/tweet/other",
    "source_url": "https://원본URL",
    "author": "저자/채널명",
    "published_date": "YYYY-MM-DD 또는 unknown",
    "category": "카테고리ID",
    "tags": ["tag1", "tag2"],
    "importance": 4,
    "analyzed_date": "YYYY-MM-DD",
    "summary": "1-2문장 핵심 요약",
    "key_points": ["핵심1", "핵심2", "핵심3"],
    "detailed_analysis": "3-5문단 상세 분석",
    "ax_relevance": "AX Research 관련성",
    "action_items": ["액션1", "액션2"]
  }'
```

**반드시 Bash 도구로 curl을 직접 실행하세요. 안내만 하지 말고 실행하세요.**

응답 예시: `{"id":"...","vectorId":"...","db":"saved","discord":"sent"}`
- `discord: "sent"` → 성공
- `discord: "웹훅 미설정: ..."` → 관리자에게 알림

## 규칙

- 한국어로 작성 (원문이 영어여도)
- importance: AX Research 관점 중요도 (1-5)
- tags: 소문자 영어, 최대 5개
- 카테고리: 위 표의 ID만 사용
- JSON의 문자열 값에 큰따옴표가 포함될 경우 이스케이프 처리
- **분석 완료 후 curl 실행은 필수 — 사용자 확인 불필요**
