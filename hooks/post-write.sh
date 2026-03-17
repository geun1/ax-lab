#!/bin/bash

# PostToolUse hook: Write 도구로 /tmp/ax-article-result.json이 작성되면
# 자동으로 Discord 전송 + DB 저장 실행

# stdin으로 tool 정보가 JSON으로 들어옴
INPUT=$(cat)

# file_path 추출 (여러 JSON 형식 대응)
FILE_PATH=$(echo "$INPUT" | grep -oE '"file_path"\s*:\s*"[^"]*"' | head -1 | sed 's/.*:.*"\(.*\)"/\1/')

# 환경변수로 들어오는 경우도 체크
if [ -z "$FILE_PATH" ]; then
  FILE_PATH="$TOOL_INPUT_FILE_PATH"
fi

# /tmp/ax-article-result.json 에 쓸 때만 실행
if [ "$FILE_PATH" = "/tmp/ax-article-result.json" ]; then
  SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

  # Discord 전송
  node "$SCRIPT_DIR/scripts/discord-send.js" /tmp/ax-article-result.json 2>&1

  # DB 저장
  node "$SCRIPT_DIR/scripts/db-save.js" /tmp/ax-article-result.json 2>&1
fi
