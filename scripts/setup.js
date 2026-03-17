#!/usr/bin/env node

/**
 * 초기 설정 가이드 스크립트
 */

console.log(`
╔══════════════════════════════════════════════════════════╗
║         AX Article Plugin - 초기 설정 가이드             ║
╚══════════════════════════════════════════════════════════╝

📋 설정 순서:

1. .env 파일 생성
   cp .env.example .env
   → 각 항목을 실제 값으로 수정하세요.

2. Cloudflare 리소스 생성 (worker/ 디렉토리에서)
   cd worker
   npm install
   npx wrangler login                     # Cloudflare 로그인
   npx wrangler d1 create ax-articles     # D1 데이터베이스 생성
   → 출력된 database_id를 wrangler.toml에 업데이트

   npx wrangler vectorize create ax-articles-vectors \\
     --dimensions=768 --metric=cosine     # Vectorize 인덱스 생성

3. DB 마이그레이션 실행
   npx wrangler d1 execute ax-articles --file=./migrations/001_init.sql

4. Worker 배포
   npx wrangler deploy
   → 출력된 URL을 .env의 AX_API_URL에 설정

5. API 토큰 설정 (선택사항)
   npx wrangler secret put AX_API_TOKEN
   → .env의 AX_API_TOKEN도 같은 값으로 설정

6. Discord 웹훅 설정
   Discord 서버 → 채널 설정 → 연동 → 웹훅 → 새 웹훅
   → 각 카테고리 채널의 웹훅 URL을 .env에 설정

7. 플러그인 테스트
   claude --plugin-dir /path/to/ax-lab
   → 세션에서: /ax-article:ax-article <URL 또는 텍스트>

✅ 설정 완료 후 Claude Cowork에서 플러그인을 사용할 수 있습니다.
`);
