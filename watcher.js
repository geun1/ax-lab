#!/usr/bin/env node

/**
 * AX Article Watcher v3
 * output/ 디렉토리를 감시하여:
 * - ax-article-result.json 변경 → API 전송 대기
 * - ax-article-visual.html 변경 → JSON과 합쳐서 API 전송
 * - JSON만 있어도 5초 후 자동 전송
 *
 * API가 DB + Discord embed + HTML 시각화 서빙 모두 처리
 */

import { watch, readFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(__dirname, "output");
const JSON_FILE = resolve(OUTPUT_DIR, "ax-article-result.json");
const HTML_FILE = resolve(OUTPUT_DIR, "ax-article-visual.html");
const API_URL = "https://ax-article-api.gsong.workers.dev";

if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

var lastJsonContent = "";
var lastSentContent = "";
var pendingJson = null;
var pendingTimer = null;
const DEBOUNCE_MS = 2000;
const WAIT_FOR_HTML_MS = 8000; // HTML 파일을 8초간 기다림

console.log(`
╔════════════════════════════════════════════════════╗
║  AX Article Watcher v3                             ║
║  감시: output/ax-article-result.json               ║
║        output/ax-article-visual.html               ║
║  API: ${API_URL}     ║
║  종료: Ctrl+C                                      ║
╚════════════════════════════════════════════════════╝
`);
console.log("대기 중... (Cowork에서 아티클을 분석하면 자동 전송됩니다)\n");

async function sendToApi(data, html) {
  if (html) data.visual_html = html;

  console.log(`[SEND] "${data.title}"`);
  console.log(`  카테고리: ${data.category} | 중요도: ${data.importance}/5`);
  if (html) console.log(`  시각화 HTML: ${(html.length / 1024).toFixed(1)}KB`);

  try {
    var res = await fetch(`${API_URL}/api/articles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    var result = await res.json();
    if (!res.ok) { console.log(`[ERROR] API: ${JSON.stringify(result)}`); return; }

    console.log(`  DB: ${result.db === "saved" ? "✅" : "❌"} (ID: ${result.id})`);
    console.log(`  Vector: ${result.vectorId ? "✅" : "❌"}`);
    console.log(`  Discord: ${result.discord === "sent" ? "✅" : "❌"}`);
    if (result.visualUrl) console.log(`  시각화: ${result.visualUrl}`);
    console.log(`[DONE] 전송 완료!\n`);
  } catch (err) {
    console.log(`[ERROR] 전송 실패: ${err.message}`);
  }
}

function tryReadJson() {
  try {
    var raw = readFileSync(JSON_FILE, "utf-8");
    if (raw === lastJsonContent || raw === lastSentContent) return null;
    var data = JSON.parse(raw);
    if (!data.title || !data.category || !data.summary) return null;
    lastJsonContent = raw;
    return data;
  } catch { return null; }
}

function tryReadHtml() {
  try {
    var raw = readFileSync(HTML_FILE, "utf-8");
    if (raw.length < 200) return null; // 불완전한 파일
    return raw;
  } catch { return null; }
}

function onJsonDetected() {
  var data = tryReadJson();
  if (!data) return;

  console.log(`[JSON] 아티클 감지: "${data.title}"`);
  console.log(`  HTML 시각화 파일 대기 중 (${WAIT_FOR_HTML_MS / 1000}초)...`);

  pendingJson = data;

  // 기존 타이머 취소
  if (pendingTimer) clearTimeout(pendingTimer);

  // HTML을 기다렸다가 없으면 JSON만 전송
  pendingTimer = setTimeout(function() {
    if (!pendingJson) return;
    var html = tryReadHtml();
    lastSentContent = lastJsonContent;
    sendToApi(pendingJson, html);
    pendingJson = null;
    pendingTimer = null;
  }, WAIT_FOR_HTML_MS);
}

function onHtmlDetected() {
  if (!pendingJson) return; // JSON이 아직 없으면 무시

  var html = tryReadHtml();
  if (!html) return;

  console.log(`[HTML] 시각화 파일 감지 (${(html.length / 1024).toFixed(1)}KB)`);

  // 타이머 취소하고 바로 전송
  if (pendingTimer) clearTimeout(pendingTimer);
  lastSentContent = lastJsonContent;
  sendToApi(pendingJson, html);
  pendingJson = null;
  pendingTimer = null;
}

// ── 파일 감시 ──
watch(OUTPUT_DIR, { persistent: true }, function(eventType, filename) {
  if (filename === "ax-article-result.json") {
    setTimeout(onJsonDetected, 500); // 파일 쓰기 완료 대기
  }
  if (filename === "ax-article-visual.html") {
    setTimeout(onHtmlDetected, 500);
  }
});

if (existsSync(JSON_FILE)) {
  watch(JSON_FILE, { persistent: true }, function() {
    setTimeout(onJsonDetected, 500);
  });
}
if (existsSync(HTML_FILE)) {
  watch(HTML_FILE, { persistent: true }, function() {
    setTimeout(onHtmlDetected, 500);
  });
}
