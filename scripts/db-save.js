#!/usr/bin/env node

/**
 * Cloudflare Worker API를 통해 D1(DB) + Vectorize(Vector DB)에 저장합니다.
 *
 * Usage: node scripts/db-save.js /tmp/ax-article-result.json
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = resolve(__dirname, "../.env");
  try {
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env 파일 없으면 무시
  }
}

loadEnv();

async function saveToDb(data) {
  const apiUrl = process.env.AX_API_URL;
  if (!apiUrl) {
    console.error("[ERROR] AX_API_URL이 설정되지 않았습니다. .env 파일을 확인해주세요.");
    process.exit(1);
  }

  const response = await fetch(`${apiUrl}/api/articles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.AX_API_TOKEN || ""}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API 오류 (${response.status}): ${body}`);
  }

  const result = await response.json();
  console.log(`[OK] DB 저장 완료 → ID: ${result.id}`);
  console.log(`[OK] Vector DB 저장 완료 → ID: ${result.vectorId}`);
  return result;
}

// Main
const jsonPath = process.argv[2];
if (!jsonPath) {
  console.error("Usage: node scripts/db-save.js <json-file-path>");
  process.exit(1);
}

try {
  const raw = readFileSync(resolve(jsonPath), "utf-8");
  const data = JSON.parse(raw);
  await saveToDb(data);
} catch (err) {
  console.error(`[ERROR] ${err.message}`);
  process.exit(1);
}
