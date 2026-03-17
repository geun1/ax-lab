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

## Step 3: JSON 생성

분석 결과를 아래 JSON으로 `/tmp/ax-article-result.json`에 Write 도구로 저장합니다. **모든 필드 필수**:

```json
{
  "title": "원본 제목",
  "source_type": "blog | article | youtube | paper | tweet | other",
  "source_url": "https://...",
  "author": "저자/채널명",
  "published_date": "YYYY-MM-DD 또는 unknown",
  "category": "카테고리 ID (위 표에서 선택)",
  "tags": ["tag1", "tag2"],
  "importance": 4,
  "analyzed_date": "YYYY-MM-DD (오늘)",
  "summary": "1-2문장 핵심 요약",
  "key_points": ["핵심 포인트1", "핵심 포인트2", "핵심 포인트3"],
  "detailed_analysis": "3-5문단 상세 분석",
  "ax_relevance": "AX Research에 어떤 의미가 있는지",
  "action_items": ["후속 액션1", "후속 액션2"],
  "full_markdown": "전체 분석 마크다운"
}
```

## Step 4: Discord 전송 + DB 저장

JSON 저장이 완료되면, **먼저 config.json 파일을 Read 도구로 읽어서** 웹훅 URL과 API URL을 확인합니다:

```
Read: /Users/song/Desktop/geun1/ax_research/ax-lab/config.json
```

그 다음, 분석 결과의 `category` 값에 해당하는 Discord 웹훅 URL을 config에서 찾아, 아래와 같이 **Bash 도구로 curl을 실행**합니다.

### Discord Embed 전송

```bash
curl -s -X POST "WEBHOOK_URL_FROM_CONFIG" \
  -H "Content-Type: application/json" \
  -d '{
    "embeds": [{
      "title": "IMPORTANCE_EMOJI ARTICLE_TITLE",
      "url": "SOURCE_URL",
      "color": COLOR_BY_IMPORTANCE,
      "description": "SUMMARY",
      "fields": [
        {"name": "📋 핵심 내용", "value": "• point1\n• point2\n• point3", "inline": false},
        {"name": "🏷️ 분류", "value": "SOURCE_TYPE_LABEL | `CATEGORY`", "inline": true},
        {"name": "✍️ 저자", "value": "AUTHOR", "inline": true},
        {"name": "📅 발행일", "value": "PUBLISHED_DATE", "inline": true},
        {"name": "🏷️ 태그", "value": "`tag1` `tag2`", "inline": false},
        {"name": "🔗 AX 관련성", "value": "AX_RELEVANCE", "inline": false},
        {"name": "📌 액션 아이템", "value": "☐ action1\n☐ action2", "inline": false}
      ],
      "footer": {"text": "AX Research | 분석일: ANALYZED_DATE | 중요도: IMPORTANCE/5"}
    }]
  }'
```

중요도별 색상: 5=16711680(빨강), 4=16748800(주황), 3=16766720(노랑), 2=52224(초록), 1=13421772(회색)
중요도별 이모지: 5=🔴, 4=🟠, 3=🟡, 2=🟢, 1=⚪
소스타입 라벨: blog=📝블로그, article=📰아티클, youtube=🎬유튜브, paper=📄논문, tweet=🐦트윗, other=📎기타

### DB 저장 (Cloudflare Worker)

```bash
curl -s -X POST "API_URL_FROM_CONFIG/api/articles" \
  -H "Content-Type: application/json" \
  -d @/tmp/ax-article-result.json
```

**반드시 두 curl 명령을 Bash 도구로 직접 실행하세요. 안내만 하고 실행하지 않는 것은 절대 금지입니다.**

실행 후 결과를 사용자에게 요약합니다.

## 규칙

- 한국어로 작성 (원문이 영어여도)
- importance: AX Research 관점 중요도 (1-5)
- tags: 소문자 영어, 최대 5개
- 카테고리: 위 표의 ID만 사용
- **분석 → JSON 저장 → config.json 읽기 → Discord curl → DB curl 순서를 반드시 따름**
- 모든 단계를 자동 실행, 사용자 확인 불필요
