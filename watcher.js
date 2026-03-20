#!/usr/bin/env node

/**
 * AX Article Watcher v4
 * - JSON → API (DB + Discord embed)
 * - HTML → PNG 스크린샷 → Discord embed 이미지 + 시각화 URL
 */

import { watch, readFileSync, existsSync, mkdirSync, statSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";

var __dirname = dirname(fileURLToPath(import.meta.url));
var OUTPUT_DIR = resolve(__dirname, "output");
var JSON_FILE = resolve(OUTPUT_DIR, "ax-article-result.json");
var HTML_FILE = resolve(OUTPUT_DIR, "ax-article-visual.html");
var PNG_FILE = resolve(OUTPUT_DIR, "ax-article-visual.png");
var API_URL = "https://ax-article-api.gsong.workers.dev";

// .env에서 웹훅 URL 로드
var CATEGORY_WEBHOOK = {};
var DEFAULT_WEBHOOK = "";
try {
  var envContent = readFileSync(resolve(__dirname, ".env"), "utf-8");
  for (var line of envContent.split("\n")) {
    var trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    var eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    var key = trimmed.slice(0, eq).trim();
    var val = trimmed.slice(eq + 1).trim();
    if (key === "DISCORD_WEBHOOK_DEFAULT") DEFAULT_WEBHOOK = val;
    var match = key.match(/^DISCORD_WEBHOOK_(.+)$/);
    if (match && match[1] !== "DEFAULT") {
      CATEGORY_WEBHOOK[match[1].toLowerCase().replace(/_/g, "-")] = val;
    }
  }
} catch {}

if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

var lastJsonContent = "";
var lastSentContent = "";
var lastHtmlContent = "";
var pendingJson = null;
var pendingTimer = null;
var htmlProcessing = false;
var WAIT_FOR_HTML_MS = 15000;

console.log(`
╔════════════════════════════════════════════════════╗
║  AX Article Watcher v4                             ║
║  JSON → API (DB + Discord embed)                   ║
║  HTML → PNG → Discord 이미지 + 시각화 링크          ║
║  종료: Ctrl+C                                      ║
╚════════════════════════════════════════════════════╝
`);
console.log("대기 중...\n");

// HTML → PNG 스크린샷
async function screenshotHtml(htmlPath) {
  console.log("  PNG 스크린샷 생성 중...");
  var browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  try {
    var page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 2 });
    await page.goto("file://" + htmlPath, { waitUntil: "networkidle0", timeout: 15000 });
    await page.evaluate(function() { window.scrollTo(0, 0); });
    // 전체 페이지 스크린샷
    await page.screenshot({ path: PNG_FILE, fullPage: true, type: "png" });
    console.log(`  PNG 생성 완료: ${(statSync(PNG_FILE).size / 1024).toFixed(0)}KB`);
    return PNG_FILE;
  } finally {
    await browser.close();
  }
}

// Discord에 PNG 이미지 embed로 전송
async function sendImageToDiscord(pngPath, title, category, visualUrl) {
  var webhookUrl = CATEGORY_WEBHOOK[category] || DEFAULT_WEBHOOK;
  if (!webhookUrl) { console.log("[ERROR] Discord 웹훅 미설정"); return; }

  var pngData = readFileSync(pngPath);
  var boundary = "----AXBoundary" + Date.now();

  // multipart: embed JSON + PNG 파일
  var payloadJson = JSON.stringify({
    embeds: [{
      title: "\u{1F4CA} " + title + " — 시각화 리포트",
      url: visualUrl || undefined,
      color: 0x3b82f6,
      image: { url: "attachment://ax-article-visual.png" },
      footer: { text: "AX Research · 인포그래픽 · " + (visualUrl ? "인터랙티브 버전: " + visualUrl : "") },
    }],
  });

  var parts = [];
  parts.push("--" + boundary + "\r\n");
  parts.push("Content-Disposition: form-data; name=\"payload_json\"\r\n");
  parts.push("Content-Type: application/json\r\n\r\n");
  parts.push(payloadJson + "\r\n");
  parts.push("--" + boundary + "\r\n");
  parts.push("Content-Disposition: form-data; name=\"files[0]\"; filename=\"ax-article-visual.png\"\r\n");
  parts.push("Content-Type: image/png\r\n\r\n");

  var headerBuf = Buffer.from(parts.join(""), "utf-8");
  var footerBuf = Buffer.from("\r\n--" + boundary + "--\r\n", "utf-8");
  var body = Buffer.concat([headerBuf, pngData, footerBuf]);

  var res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "multipart/form-data; boundary=" + boundary },
    body: body,
  });

  if (!res.ok) {
    console.log(`[ERROR] Discord 이미지 전송 실패 (${res.status}): ${await res.text()}`);
    return;
  }
  console.log("  Discord 이미지: ✅");
}

// API 전송 (DB + Discord embed + 시각화 HTML 저장)
async function sendToApi(data, html) {
  if (html) data.visual_html = html;

  console.log(`[SEND] "${data.title}"`);
  console.log(`  카테고리: ${data.category} | 중요도: ${data.importance}/5`);

  try {
    var res = await fetch(API_URL + "/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    var result = await res.json();
    if (!res.ok) { console.log("[ERROR] API: " + JSON.stringify(result)); return null; }

    console.log("  DB: " + (result.db === "saved" ? "✅" : "❌") + " (ID: " + result.id + ")");
    console.log("  Vector: " + (result.vectorId ? "✅" : "❌"));
    console.log("  Discord embed: " + (result.discord === "sent" ? "✅" : "❌"));
    if (result.visualUrl) console.log("  시각화 URL: " + result.visualUrl);
    return result;
  } catch (err) {
    console.log("[ERROR] API 전송 실패: " + err.message);
    return null;
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
    if (raw.length < 500) return null;
    return raw;
  } catch { return null; }
}

function onJsonDetected() {
  var data = tryReadJson();
  if (!data) return;

  console.log("[JSON] 아티클 감지: \"" + data.title + "\"");
  console.log("  HTML 대기 중 (" + (WAIT_FOR_HTML_MS / 1000) + "초)...");

  pendingJson = data;

  if (pendingTimer) clearTimeout(pendingTimer);
  pendingTimer = setTimeout(async function() {
    if (!pendingJson) return;
    var html = tryReadHtml();
    lastSentContent = lastJsonContent;
    if (html) lastHtmlContent = html; // 중복 전송 방지

    var result = await sendToApi(pendingJson, html);

    if (html && result) {
      htmlProcessing = true;
      try {
        await screenshotHtml(HTML_FILE);
        await sendImageToDiscord(PNG_FILE, pendingJson.title, pendingJson.category, result.visualUrl);
      } catch (err) {
        console.log("[ERROR] PNG/Discord: " + err.message);
      }
      htmlProcessing = false;
    }

    console.log("[DONE] 완료!\n");
    pendingJson = null;
    pendingTimer = null;
  }, WAIT_FOR_HTML_MS);
}

function onHtmlDetected() {
  var html = tryReadHtml();
  if (!html) return;
  // 중복 방지: 같은 내용이거나 이미 처리 중이면 무시
  if (html === lastHtmlContent || htmlProcessing) return;
  lastHtmlContent = html;
  htmlProcessing = true;

  console.log("[HTML] 시각화 감지 (" + (html.length / 1024).toFixed(1) + "KB)");

  if (pendingJson) {
    if (pendingTimer) clearTimeout(pendingTimer);
    lastSentContent = lastJsonContent;

    (async function() {
      var result = await sendToApi(pendingJson, html);
      if (result) {
        try { await screenshotHtml(HTML_FILE); await sendImageToDiscord(PNG_FILE, pendingJson.title, pendingJson.category, result.visualUrl); } catch (err) { console.log("[ERROR] PNG/Discord: " + err.message); }
      }
      console.log("[DONE] 완료!\n");
      pendingJson = null; pendingTimer = null; htmlProcessing = false;
    })();
  } else {
    (async function() {
      try {
        var jsonData = JSON.parse(readFileSync(JSON_FILE, "utf-8"));
        console.log("  늦게 도착한 HTML → PNG + Discord 전송");
        await screenshotHtml(HTML_FILE);
        await sendImageToDiscord(PNG_FILE, jsonData.title, jsonData.category, null);
      } catch (err) {
        console.log("[ERROR] 늦은 HTML 처리: " + err.message);
      }
      console.log("[DONE] 완료!\n");
      htmlProcessing = false;
    })();
  }
}

// 감시
watch(OUTPUT_DIR, { persistent: true }, function(eventType, filename) {
  if (filename === "ax-article-result.json") setTimeout(onJsonDetected, 500);
  if (filename === "ax-article-visual.html") setTimeout(onHtmlDetected, 1000);
});
if (existsSync(JSON_FILE)) watch(JSON_FILE, { persistent: true }, function() { setTimeout(onJsonDetected, 500); });
if (existsSync(HTML_FILE)) watch(HTML_FILE, { persistent: true }, function() { setTimeout(onHtmlDetected, 1000); });
