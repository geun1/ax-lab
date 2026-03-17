#!/usr/bin/env node

/**
 * AX Article Watcher
 * /tmp/ax-article-result.json 파일 변경을 감지하여 자동으로
 * Cloudflare Worker API에 전송합니다 (DB 저장 + Discord 전송).
 *
 * 사용법: node watcher.js
 * (별도 터미널에서 상시 실행)
 */

import { watch, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WATCH_FILE = "/tmp/ax-article-result.json";
const API_URL = "https://ax-article-api.gsong.workers.dev";

let lastProcessed = 0;
const DEBOUNCE_MS = 2000; // 2초 디바운스

console.log(`
╔═══════════════════════════════════════════════╗
║  AX Article Watcher 실행 중                    ║
║  감시 파일: ${WATCH_FILE}        ║
║  API: ${API_URL}  ║
║  종료: Ctrl+C                                 ║
╚═══════════════════════════════════════════════╝
`);

async function processFile() {
  const now = Date.now();
  if (now - lastProcessed < DEBOUNCE_MS) return;
  lastProcessed = now;

  let data;
  try {
    const raw = readFileSync(WATCH_FILE, "utf-8");
    data = JSON.parse(raw);
  } catch (err) {
    console.log(`[SKIP] 파일 읽기/파싱 실패: ${err.message}`);
    return;
  }

  if (!data.title || !data.category || !data.summary) {
    console.log("[SKIP] 필수 필드 누락 (title, category, summary)");
    return;
  }

  console.log(`\n[NEW] 아티클 감지: "${data.title}"`);
  console.log(`  카테고리: ${data.category} | 중요도: ${data.importance}/5`);

  try {
    const response = await fetch(`${API_URL}/api/articles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      console.log(`[ERROR] API 오류 (${response.status}): ${JSON.stringify(result)}`);
      return;
    }

    const dbIcon = result.db === "saved" ? "✅" : "❌";
    const vectorIcon = result.vectorId ? "✅" : "❌";
    const discordIcon = result.discord === "sent" ? "✅" : "❌";

    console.log(`  DB 저장: ${dbIcon} (ID: ${result.id})`);
    console.log(`  Vector DB: ${vectorIcon}`);
    console.log(`  Discord: ${discordIcon}${result.discord !== "sent" ? ` (${result.discord})` : ""}`);
    console.log(`[DONE] 전송 완료!\n`);
  } catch (err) {
    console.log(`[ERROR] 전송 실패: ${err.message}`);
  }
}

// 파일이 이미 있으면 무시하고 대기 (새 변경만 처리)
console.log("대기 중... (Cowork에서 아티클을 분석하면 자동 전송됩니다)\n");

watch(WATCH_FILE, { persistent: true }, (eventType) => {
  if (eventType === "change" || eventType === "rename") {
    processFile();
  }
});

// 파일이 아직 없을 수 있으므로 디렉토리도 감시
watch("/tmp", { persistent: true }, (eventType, filename) => {
  if (filename === "ax-article-result.json") {
    processFile();
  }
});
