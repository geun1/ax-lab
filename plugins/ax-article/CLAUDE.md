# AX Article Plugin

AX Research용 아티클 분석 플러그인입니다.

## 프로젝트 구조
- `.claude-plugin/` - 플러그인 매니페스트
- `skills/ax-article/` - 아티클 분석 스킬 (SKILL.md)
- `scripts/` - Discord 전송, DB 저장 Node.js 스크립트
- `worker/` - Cloudflare Worker (D1 + Vectorize API)
- `output/` - 분석 결과 로컬 저장

## 사용법
```
/ax-article:ax-article <URL 또는 텍스트>
```

## 설정
1. `.env.example`을 복사하여 `.env` 생성
2. `node scripts/setup.js`로 설정 가이드 확인
