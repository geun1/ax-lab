#!/usr/bin/env node

const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { z } = require("zod");

const API_URL = "https://ax-article-api.gsong.workers.dev";

const server = new McpServer({
  name: "ax-article-api",
  version: "1.0.0",
});

// 아티클 제출 도구
server.tool(
  "submit_article",
  "분석된 아티클을 DB에 저장하고 Discord로 전송합니다. 이 도구를 호출하면 Cloudflare Worker가 D1 DB 저장, Vector DB 저장, Discord 채널 전송을 모두 처리합니다.",
  {
    title: z.string().describe("아티클 원본 제목"),
    source_type: z.enum(["blog", "article", "youtube", "paper", "tweet", "other"]).describe("소스 타입"),
    source_url: z.string().optional().describe("원본 URL"),
    author: z.string().optional().describe("저자/채널명"),
    published_date: z.string().optional().describe("발행일 YYYY-MM-DD 또는 unknown"),
    category: z.enum(["ai-research", "ai-product", "ai-industry", "dev-tool", "crypto-web3", "startup", "design", "general"]).describe("카테고리 ID"),
    tags: z.array(z.string()).describe("태그 배열 (소문자 영어, 최대 5개)"),
    importance: z.number().min(1).max(5).describe("중요도 1-5"),
    analyzed_date: z.string().describe("분석일 YYYY-MM-DD"),
    summary: z.string().describe("1-2문장 핵심 요약"),
    key_points: z.array(z.string()).describe("핵심 포인트 배열"),
    detailed_analysis: z.string().optional().describe("3-5문단 상세 분석"),
    ax_relevance: z.string().optional().describe("AX Research 관련성"),
    action_items: z.array(z.string()).describe("후속 액션 아이템 배열"),
    full_markdown: z.string().optional().describe("전체 분석 마크다운"),
  },
  async (params) => {
    try {
      const response = await fetch(`${API_URL}/api/articles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          content: [{ type: "text", text: `[ERROR] API 오류 (${response.status}): ${JSON.stringify(result)}` }],
        };
      }

      const dbStatus = result.db === "saved" ? "✅" : "❌";
      const discordStatus = result.discord === "sent" ? "✅" : "❌";

      return {
        content: [{
          type: "text",
          text: `아티클 저장 및 전송 완료!\n\n- ID: ${result.id}\n- DB 저장: ${dbStatus}\n- Vector DB: ${result.vectorId ? "✅" : "❌"}\n- Discord 전송: ${discordStatus}${result.discord !== "sent" ? ` (${result.discord})` : ""}`,
        }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `[ERROR] 요청 실패: ${err.message}` }],
      };
    }
  }
);

// 아티클 검색 도구
server.tool(
  "search_articles",
  "Vector DB에서 유사한 아티클을 검색합니다.",
  {
    query: z.string().describe("검색 쿼리"),
    category: z.string().optional().describe("카테고리 필터"),
    limit: z.number().optional().describe("결과 수 (기본 5)"),
  },
  async (params) => {
    try {
      const response = await fetch(`${API_URL}/api/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: params.query, category: params.category, limit: params.limit || 5 }),
      });

      const result = await response.json();

      if (!response.ok) {
        return { content: [{ type: "text", text: `[ERROR] 검색 오류: ${JSON.stringify(result)}` }] };
      }

      if (!result.results || result.results.length === 0) {
        return { content: [{ type: "text", text: "검색 결과가 없습니다." }] };
      }

      const formatted = result.results.map((r, i) => {
        const a = r.article;
        return `${i + 1}. [${a.importance}/5] ${a.title}\n   카테고리: ${a.category} | 유사도: ${(r.score * 100).toFixed(1)}%\n   요약: ${a.summary || "없음"}`;
      }).join("\n\n");

      return { content: [{ type: "text", text: `검색 결과 (${result.results.length}건):\n\n${formatted}` }] };
    } catch (err) {
      return { content: [{ type: "text", text: `[ERROR] 검색 실패: ${err.message}` }] };
    }
  }
);

// 아티클 목록 도구
server.tool(
  "list_articles",
  "저장된 아티클 목록을 조회합니다.",
  {
    category: z.string().optional().describe("카테고리 필터"),
    importance: z.number().optional().describe("최소 중요도 필터"),
    limit: z.number().optional().describe("결과 수 (기본 10)"),
  },
  async (params) => {
    try {
      const searchParams = new URLSearchParams();
      if (params.category) searchParams.set("category", params.category);
      if (params.importance) searchParams.set("importance", String(params.importance));
      searchParams.set("limit", String(params.limit || 10));

      const response = await fetch(`${API_URL}/api/articles?${searchParams}`);
      const result = await response.json();

      if (!result.articles || result.articles.length === 0) {
        return { content: [{ type: "text", text: "저장된 아티클이 없습니다." }] };
      }

      const formatted = result.articles.map((a, i) =>
        `${i + 1}. [${a.importance}/5] ${a.title}\n   ${a.category} | ${a.source_type} | ${a.analyzed_date}`
      ).join("\n\n");

      return { content: [{ type: "text", text: `아티클 목록 (${result.articles.length}건):\n\n${formatted}` }] };
    } catch (err) {
      return { content: [{ type: "text", text: `[ERROR] 조회 실패: ${err.message}` }] };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
