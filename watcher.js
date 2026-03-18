#!/usr/bin/env node

/**
 * AX Article Watcher
 * output/ 디렉토리를 감시하여:
 * - ax-article-result.json → Cloudflare Worker API (DB + Discord embed)
 * - ax-article-visual.html → Discord에 파일 첨부로 전송
 *
 * 사용법: node watcher.js
 */

import { watch, readFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(__dirname, "output");
const JSON_FILE = resolve(OUTPUT_DIR, "ax-article-result.json");
const HTML_FILE = resolve(OUTPUT_DIR, "ax-article-visual.html");
const API_URL = "https://ax-article-api.gsong.workers.dev";

// .env에서 웹훅 URL 로드
const CATEGORY_WEBHOOK = {};
const DEFAULT_WEBHOOK = loadWebhooks();

function loadWebhooks() {
  const envPath = resolve(__dirname, ".env");
  let defaultWh = "";
  try {
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (key === "DISCORD_WEBHOOK_DEFAULT") defaultWh = val;
      const match = key.match(/^DISCORD_WEBHOOK_(.+)$/);
      if (match && match[1] !== "DEFAULT") {
        const cat = match[1].toLowerCase().replace(/_/g, "-");
        CATEGORY_WEBHOOK[cat] = val;
      }
    }
  } catch { /* ignore */ }
  return defaultWh;
}

if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

let lastJsonContent = "";
let lastHtmlContent = "";
let lastJsonTime = 0;
let lastHtmlTime = 0;
const DEBOUNCE_MS = 2000;

// 마지막 분석 결과의 카테고리 저장 (HTML 전송 시 채널 결정용)
let lastCategory = "general";

console.log(`
╔════════════════════════════════════════════════════╗
║  AX Article Watcher v2 실행 중                      ║
║  감시: output/ax-article-result.json               ║
║        output/ax-article-visual.html               ║
║  API: ${API_URL}     ║
║  종료: Ctrl+C                                      ║
╚════════════════════════════════════════════════════╝
`);
console.log("대기 중... (Cowork에서 아티클을 분석하면 자동 전송됩니다)\n");

// ── JSON 처리 (DB + Discord embed) ──
async function processJson() {
  const now = Date.now();
  if (now - lastJsonTime < DEBOUNCE_MS) return;

  let raw;
  try { raw = readFileSync(JSON_FILE, "utf-8"); } catch { return; }
  if (raw === lastJsonContent) return;
  lastJsonContent = raw;
  lastJsonTime = now;

  let data;
  try { data = JSON.parse(raw); } catch (err) {
    console.log(`[SKIP] JSON 파싱 실패: ${err.message}`);
    return;
  }
  if (!data.title || !data.category || !data.summary) {
    console.log("[SKIP] 필수 필드 누락");
    return;
  }

  lastCategory = data.category;
  console.log(`[JSON] 아티클 감지: "${data.title}"`);
  console.log(`  카테고리: ${data.category} | 중요도: ${data.importance}/5`);

  try {
    const res = await fetch(`${API_URL}/api/articles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) { console.log(`[ERROR] API: ${JSON.stringify(result)}`); return; }

    console.log(`  DB: ${result.db === "saved" ? "✅" : "❌"} (ID: ${result.id})`);
    console.log(`  Vector: ${result.vectorId ? "✅" : "❌"}`);
    console.log(`  Discord: ${result.discord === "sent" ? "✅" : "❌"}`);
    console.log(`[DONE] JSON 전송 완료!\n`);
  } catch (err) {
    console.log(`[ERROR] JSON 전송 실패: ${err.message}`);
  }
}

// ── HTML 처리 (Discord 파일 첨부) ──
async function processHtml() {
  const now = Date.now();
  if (now - lastHtmlTime < DEBOUNCE_MS) return;

  let raw;
  try { raw = readFileSync(HTML_FILE, "utf-8"); } catch { return; }
  if (raw === lastHtmlContent) return;
  if (raw.length < 100) return; // 불완전한 파일 무시
  lastHtmlContent = raw;
  lastHtmlTime = now;

  console.log(`[HTML] 시각화 파일 감지 (${(raw.length / 1024).toFixed(1)}KB)`);

  // 카테고리에 맞는 웹훅 URL
  const webhookUrl = CATEGORY_WEBHOOK[lastCategory] || DEFAULT_WEBHOOK;
  if (!webhookUrl) {
    console.log("[ERROR] Discord 웹훅 URL 미설정");
    return;
  }

  // 제목 추출
  const titleMatch = raw.match(/<title>(.*?)<\/title>/);
  const title = titleMatch ? titleMatch[1] : "AX Article Visualization";

  try {
    // multipart/form-data로 파일 전송
    const boundary = "----AXBoundary" + Date.now();
    const filename = "ax-article-visual.html";

    const bodyParts = [];
    // JSON payload (메시지)
    bodyParts.push(
      `--${boundary}\r\n`,
      `Content-Disposition: form-data; name="payload_json"\r\n`,
      `Content-Type: application/json\r\n\r\n`,
      JSON.stringify({
        content: `📊 **시각화 리포트** — ${title}\n> 첨부된 HTML 파일을 다운로드하여 브라우저에서 열어주세요. (다크/라이트 테마, PNG 다운로드, 인쇄 지원)`,
      }),
      `\r\n`,
    );
    // 파일
    bodyParts.push(
      `--${boundary}\r\n`,
      `Content-Disposition: form-data; name="files[0]"; filename="${filename}"\r\n`,
      `Content-Type: text/html\r\n\r\n`,
      raw,
      `\r\n`,
      `--${boundary}--\r\n`,
    );

    const body = bodyParts.join("");

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` },
      body,
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.log(`[ERROR] Discord HTML 전송 실패 (${res.status}): ${errBody}`);
      return;
    }

    console.log(`  Discord 파일 전송: ✅`);
    console.log(`[DONE] HTML 전송 완료!\n`);
  } catch (err) {
    console.log(`[ERROR] HTML 전송 실패: ${err.message}`);
  }
}

// ── 파일 감시 ──
watch(OUTPUT_DIR, { persistent: true }, (eventType, filename) => {
  if (filename === "ax-article-result.json") processJson();
  if (filename === "ax-article-visual.html") processHtml();
});

if (existsSync(JSON_FILE)) {
  watch(JSON_FILE, { persistent: true }, () => processJson());
}
if (existsSync(HTML_FILE)) {
  watch(HTML_FILE, { persistent: true }, () => processHtml());
}
