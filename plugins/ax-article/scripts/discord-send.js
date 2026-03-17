#!/usr/bin/env node

/**
 * Discord 웹훅으로 분석 결과를 전송합니다.
 * 카테고리에 따라 적절한 채널로 라우팅됩니다.
 *
 * Usage: node scripts/discord-send.js /tmp/ax-article-result.json
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// .env 파일 수동 로드 (의존성 없이)
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

const CATEGORY_WEBHOOK_MAP = {
  "ai-research": "DISCORD_WEBHOOK_AI_RESEARCH",
  "ai-product": "DISCORD_WEBHOOK_AI_PRODUCT",
  "ai-industry": "DISCORD_WEBHOOK_AI_INDUSTRY",
  "dev-tool": "DISCORD_WEBHOOK_DEV_TOOL",
  "crypto-web3": "DISCORD_WEBHOOK_CRYPTO_WEB3",
  startup: "DISCORD_WEBHOOK_STARTUP",
  design: "DISCORD_WEBHOOK_DESIGN",
  general: "DISCORD_WEBHOOK_GENERAL",
};

const IMPORTANCE_EMOJI = {
  5: "🔴",
  4: "🟠",
  3: "🟡",
  2: "🟢",
  1: "⚪",
};

const SOURCE_TYPE_LABEL = {
  blog: "📝 블로그",
  article: "📰 아티클",
  youtube: "🎬 유튜브",
  paper: "📄 논문",
  tweet: "🐦 트윗",
  other: "📎 기타",
};

function buildDiscordEmbed(data) {
  const importanceEmoji = IMPORTANCE_EMOJI[data.importance] || "⚪";
  const sourceLabel = SOURCE_TYPE_LABEL[data.source_type] || "📎 기타";

  const keyPoints = data.key_points
    .map((p) => `• ${p}`)
    .join("\n")
    .slice(0, 1000);

  const actionItems = data.action_items
    .map((a) => `☐ ${a}`)
    .join("\n")
    .slice(0, 500);

  return {
    embeds: [
      {
        title: `${importanceEmoji} ${data.title}`,
        url: data.source_url || undefined,
        color: getColorByImportance(data.importance),
        description: data.summary,
        fields: [
          {
            name: "📋 핵심 내용",
            value: keyPoints || "없음",
            inline: false,
          },
          {
            name: "🏷️ 분류",
            value: `${sourceLabel} | \`${data.category}\``,
            inline: true,
          },
          {
            name: "✍️ 저자",
            value: data.author || "알 수 없음",
            inline: true,
          },
          {
            name: "📅 발행일",
            value: data.published_date || "unknown",
            inline: true,
          },
          {
            name: "🏷️ 태그",
            value: data.tags.map((t) => `\`${t}\``).join(" ") || "없음",
            inline: false,
          },
          {
            name: "🔗 AX 관련성",
            value: (data.ax_relevance || "").slice(0, 500) || "없음",
            inline: false,
          },
          {
            name: "📌 액션 아이템",
            value: actionItems || "없음",
            inline: false,
          },
        ],
        footer: {
          text: `AX Research | 분석일: ${data.analyzed_date} | 중요도: ${data.importance}/5`,
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

function getColorByImportance(importance) {
  const colors = {
    5: 0xff0000, // 빨강
    4: 0xff8c00, // 주황
    3: 0xffd700, // 노랑
    2: 0x00cc00, // 초록
    1: 0xcccccc, // 회색
  };
  return colors[importance] || 0x5865f2;
}

async function sendToDiscord(data) {
  const webhookEnvKey = CATEGORY_WEBHOOK_MAP[data.category];
  const webhookUrl =
    process.env[webhookEnvKey] || process.env.DISCORD_WEBHOOK_DEFAULT;

  if (!webhookUrl) {
    console.error(
      `[ERROR] Discord 웹훅 URL이 설정되지 않았습니다: ${webhookEnvKey} 또는 DISCORD_WEBHOOK_DEFAULT`
    );
    console.error(
      "  .env 파일에 웹훅 URL을 설정해주세요. (.env.example 참고)"
    );
    process.exit(1);
  }

  const embed = buildDiscordEmbed(data);

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(embed),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Discord API 오류 (${response.status}): ${body}`
    );
  }

  console.log(
    `[OK] Discord 전송 완료 → 카테고리: ${data.category}, 채널: ${webhookEnvKey}`
  );
}

// Main
const jsonPath = process.argv[2];
if (!jsonPath) {
  console.error("Usage: node scripts/discord-send.js <json-file-path>");
  process.exit(1);
}

try {
  const raw = readFileSync(resolve(jsonPath), "utf-8");
  const data = JSON.parse(raw);
  await sendToDiscord(data);
} catch (err) {
  console.error(`[ERROR] ${err.message}`);
  process.exit(1);
}
