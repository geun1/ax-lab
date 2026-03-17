#!/usr/bin/env node

/**
 * AX Article Watcher
 * output/ax-article-result.json 파일 변경을 감지하여 자동으로
 * Cloudflare Worker API에 전송합니다 (DB 저장 + Discord 전송).
 *
 * 사용법: node watcher.js
 * (별도 터미널에서 상시 실행)
 */

import { watch, readFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(__dirname, "output");
const WATCH_FILE = resolve(OUTPUT_DIR, "ax-article-result.json");
const API_URL = "https://ax-article-api.gsong.workers.dev";

// output 디렉토리 없으면 생성
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

let lastProcessed = 0;
let lastContent = "";
const DEBOUNCE_MS = 2000;

console.log(`
╔════════════════════════════════════════════════════╗
║  AX Article Watcher 실행 중                         ║
║  감시: output/ax-article-result.json               ║
║  API: ${API_URL}     ║
║  종료: Ctrl+C                                      ║
╚════════════════════════════════════════════════════╝
`);
console.log("대기 중... (Cowork에서 아티클을 분석하면 자동 전송됩니다)\n");

async function processFile() {
  const now = Date.now();
  if (now - lastProcessed < DEBOUNCE_MS) return;

  let raw;
  try {
    raw = readFileSync(WATCH_FILE, "utf-8");
  } catch {
    return;
  }

  // 같은 내용이면 무시 (중복 전송 방지)
  if (raw === lastContent) return;
  lastContent = raw;
  lastProcessed = now;

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    console.log(`[SKIP] JSON 파싱 실패: ${err.message}`);
    return;
  }

  if (!data.title || !data.category || !data.summary) {
    console.log("[SKIP] 필수 필드 누락 (title, category, summary)");
    return;
  }

  console.log(`[NEW] 아티클 감지: "${data.title}"`);
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

// output 디렉토리 감시
watch(OUTPUT_DIR, { persistent: true }, (eventType, filename) => {
  if (filename === "ax-article-result.json") {
    processFile();
  }
});

// 파일 직접 감시 (이미 존재하는 경우)
if (existsSync(WATCH_FILE)) {
  watch(WATCH_FILE, { persistent: true }, (eventType) => {
    if (eventType === "change" || eventType === "rename") {
      processFile();
    }
  });
}
