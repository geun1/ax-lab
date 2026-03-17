# AX 아티클 카테고리 정의

## Discord 채널 매핑

각 카테고리는 Discord의 특정 채널로 매핑됩니다.
환경변수로 웹훅 URL을 설정합니다.

| 카테고리 ID | Discord 채널명 | 환경변수 키 |
|------------|---------------|------------|
| `ai-research` | #ai-연구 | `DISCORD_WEBHOOK_AI_RESEARCH` |
| `ai-product` | #ai-제품 | `DISCORD_WEBHOOK_AI_PRODUCT` |
| `ai-industry` | #ai-산업 | `DISCORD_WEBHOOK_AI_INDUSTRY` |
| `dev-tool` | #개발도구 | `DISCORD_WEBHOOK_DEV_TOOL` |
| `crypto-web3` | #크립토-web3 | `DISCORD_WEBHOOK_CRYPTO_WEB3` |
| `startup` | #스타트업 | `DISCORD_WEBHOOK_STARTUP` |
| `design` | #디자인 | `DISCORD_WEBHOOK_DESIGN` |
| `general` | #일반 | `DISCORD_WEBHOOK_GENERAL` |

## 중요도 기준

| 점수 | 의미 | 기준 |
|------|------|------|
| 5 | 매우 중요 | AX의 핵심 전략에 직접 영향, 즉시 대응 필요 |
| 4 | 중요 | 현재 프로젝트에 활용 가능, 빠른 검토 권장 |
| 3 | 보통 | 참고할 만한 정보, 시간 있을 때 검토 |
| 2 | 낮음 | 간접적 관련, 트렌드 파악용 |
| 1 | 매우 낮음 | 직접 관련성 낮으나 기록용 보관 |
