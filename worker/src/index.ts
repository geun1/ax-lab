/**
 * AX Article API - Cloudflare Worker
 *
 * D1 + Vectorize + Workers AI + Discord 전송
 * POST /api/articles 하나로 DB 저장 + Discord 전송 모두 처리
 */

interface Env {
  DB: D1Database;
  VECTOR_INDEX: VectorizeIndex;
  AI: Ai;
  AX_API_TOKEN?: string;
  ENVIRONMENT: string;
  // Discord 웹훅 URL (Cloudflare 환경변수로 관리)
  DISCORD_WEBHOOK_AI_RESEARCH?: string;
  DISCORD_WEBHOOK_AI_PRODUCT?: string;
  DISCORD_WEBHOOK_AI_INDUSTRY?: string;
  DISCORD_WEBHOOK_DEV_TOOL?: string;
  DISCORD_WEBHOOK_CRYPTO_WEB3?: string;
  DISCORD_WEBHOOK_STARTUP?: string;
  DISCORD_WEBHOOK_DESIGN?: string;
  DISCORD_WEBHOOK_GENERAL?: string;
}

interface ArticlePayload {
  title: string;
  source_type: string;
  source_url?: string;
  author?: string;
  published_date?: string;
  category: string;
  tags: string[];
  importance: number;
  analyzed_date: string;
  summary: string;
  key_points: string[];
  detailed_analysis?: string;
  ax_relevance?: string;
  action_items: string[];
  full_markdown?: string;
  visual_html?: string;
}

const CATEGORY_WEBHOOK_KEY: Record<string, string> = {
  "ai-research": "DISCORD_WEBHOOK_AI_RESEARCH",
  "ai-product": "DISCORD_WEBHOOK_AI_PRODUCT",
  "ai-industry": "DISCORD_WEBHOOK_AI_INDUSTRY",
  "dev-tool": "DISCORD_WEBHOOK_DEV_TOOL",
  "crypto-web3": "DISCORD_WEBHOOK_CRYPTO_WEB3",
  startup: "DISCORD_WEBHOOK_STARTUP",
  design: "DISCORD_WEBHOOK_DESIGN",
  general: "DISCORD_WEBHOOK_GENERAL",
};

const IMPORTANCE_EMOJI: Record<number, string> = {
  5: "\u{1F534}", 4: "\u{1F7E0}", 3: "\u{1F7E1}", 2: "\u{1F7E2}", 1: "\u26AA",
};

const IMPORTANCE_COLOR: Record<number, number> = {
  5: 0xff0000, 4: 0xff8c00, 3: 0xffd700, 2: 0x00cc00, 1: 0xcccccc,
};

const SOURCE_LABEL: Record<string, string> = {
  blog: "\u{1F4DD} 블로그", article: "\u{1F4F0} 아티클", youtube: "\u{1F3AC} 유튜브",
  paper: "\u{1F4C4} 논문", tweet: "\u{1F426} 트윗", other: "\u{1F4CE} 기타",
};

function generateId(): string {
  return crypto.randomUUID();
}

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

function authenticate(request: Request, env: Env): boolean {
  if (!env.AX_API_TOKEN) return true;
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return false;
  return authHeader.replace("Bearer ", "") === env.AX_API_TOKEN;
}

async function generateEmbedding(ai: Ai, text: string): Promise<number[]> {
  const result = await ai.run("@cf/baai/bge-base-en-v1.5", { text: [text] });
  return (result as { data: number[][] }).data[0];
}

// Discord Embed 전송
async function sendToDiscord(data: ArticlePayload, env: Env, articleId?: string): Promise<{ success: boolean; error?: string }> {
  const webhookKey = CATEGORY_WEBHOOK_KEY[data.category] || "DISCORD_WEBHOOK_GENERAL";
  const webhookUrl = (env as unknown as Record<string, string>)[webhookKey];

  if (!webhookUrl) {
    return { success: false, error: `웹훅 미설정: ${webhookKey}` };
  }

  const emoji = IMPORTANCE_EMOJI[data.importance] || "\u26AA";
  const color = IMPORTANCE_COLOR[data.importance] || 0x5865f2;
  const sourceLabel = SOURCE_LABEL[data.source_type] || "\u{1F4CE} 기타";

  // 메타 정보 한 줄로
  const metaLine = [
    sourceLabel,
    data.author ? `by **${data.author}**` : null,
    data.published_date && data.published_date !== "unknown" ? data.published_date : null,
  ].filter(Boolean).join("  \u2022  ");

  // 태그 뱃지
  const tagBadges = data.tags.map((t) => `\`${t}\``).join("  ");

  // 핵심 내용 (번호 매기기)
  const keyPoints = data.key_points
    .map((p, i) => `**${i + 1}.** ${p}`)
    .join("\n\n")
    .slice(0, 1000);

  // 상세 분석 (앞부분만)
  const analysis = data.detailed_analysis
    ? data.detailed_analysis.slice(0, 600) + (data.detailed_analysis.length > 600 ? "..." : "")
    : "";

  // 액션 아이템
  const actionItems = data.action_items
    .map((a) => `\u2610  ${a}`)
    .join("\n")
    .slice(0, 400);

  // 중요도 별
  const importanceStars = "\u2B50".repeat(data.importance);

  // 설명 블록: 요약 + 메타
  const description = [
    `> ${data.summary}`,
    "",
    `${metaLine}`,
    tagBadges ? `${tagBadges}` : "",
  ].filter((l) => l !== undefined).join("\n");

  const fields: Array<{ name: string; value: string; inline: boolean }> = [];

  if (keyPoints) {
    fields.push({
      name: "\u2500\u2500\u2500\u2500  \u{1F4CB} \uD575\uC2EC \uB0B4\uC6A9  \u2500\u2500\u2500\u2500",
      value: keyPoints,
      inline: false,
    });
  }

  if (analysis) {
    fields.push({
      name: "\u2500\u2500\u2500\u2500  \u{1F50D} \uC0C1\uC138 \uBD84\uC11D  \u2500\u2500\u2500\u2500",
      value: analysis,
      inline: false,
    });
  }

  if (data.ax_relevance) {
    fields.push({
      name: "\u2500\u2500\u2500\u2500  \u{1F517} AX \uAD00\uB828\uC131  \u2500\u2500\u2500\u2500",
      value: data.ax_relevance.slice(0, 400),
      inline: false,
    });
  }

  if (actionItems) {
    fields.push({
      name: "\u2500\u2500\u2500\u2500  \u{1F4CC} \uC561\uC158 \uC544\uC774\uD15C  \u2500\u2500\u2500\u2500",
      value: actionItems,
      inline: false,
    });
  }

  // 시각화 링크 (HTML이 저장된 경우)
  if (articleId && data.visual_html) {
    fields.push({
      name: "\u2500\u2500\u2500\u2500  \u{1F4CA} \uC2DC\uAC01\uD654 \uB9AC\uD3EC\uD2B8  \u2500\u2500\u2500\u2500",
      value: `[\u{1F517} \uC778\uD3EC\uADF8\uB798\uD53D \uBCF4\uAE30](https://ax-article-api.gsong.workers.dev/v/${articleId})`,
      inline: false,
    });
  }

  const embed = {
    embeds: [{
      title: `${emoji}  ${data.title}`.slice(0, 256),
      url: data.source_url || undefined,
      color,
      description,
      fields,
      footer: {
        text: `AX Research  \u2502  ${data.category}  \u2502  ${importanceStars}  \u2502  ${data.analyzed_date}`,
      },
      timestamp: new Date().toISOString(),
    }],
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(embed),
  });

  if (!res.ok) {
    const body = await res.text();
    return { success: false, error: `Discord ${res.status}: ${body}` };
  }

  return { success: true };
}

// POST /api/articles - DB 저장 + Discord 전송
async function createArticle(request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as ArticlePayload;

  if (!body.title || !body.category || !body.summary) {
    return errorResponse("title, category, summary는 필수입니다.");
  }

  const id = generateId();

  // 1. D1에 저장
  await env.DB.prepare(
    `INSERT INTO articles (id, title, source_type, source_url, author, published_date, category, tags, importance, analyzed_date, summary, key_points, detailed_analysis, ax_relevance, action_items, full_markdown, visual_html)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, body.title, body.source_type, body.source_url || null,
    body.author || null, body.published_date || null, body.category,
    JSON.stringify(body.tags || []), body.importance, body.analyzed_date,
    body.summary, JSON.stringify(body.key_points || []),
    body.detailed_analysis || null, body.ax_relevance || null,
    JSON.stringify(body.action_items || []), body.full_markdown || null,
    body.visual_html || null
  ).run();

  // 2. Vectorize 저장
  let vectorId: string | null = null;
  try {
    const embeddingText = `${body.title}\n${body.summary}\n${body.key_points.join("\n")}\n${body.detailed_analysis || ""}`;
    const embedding = await generateEmbedding(env.AI, embeddingText);
    await env.VECTOR_INDEX.upsert([{
      id,
      values: embedding,
      metadata: {
        title: body.title, category: body.category,
        importance: body.importance, source_type: body.source_type,
        analyzed_date: body.analyzed_date, tags: body.tags.join(","),
      },
    }]);
    vectorId = id;
  } catch (err) {
    console.error("Vector DB 저장 실패:", err);
  }

  // 3. Discord 전송
  const discordResult = await sendToDiscord(body, env, id);

  return jsonResponse({
    id,
    vectorId,
    db: "saved",
    discord: discordResult.success ? "sent" : discordResult.error,
    visualUrl: body.visual_html ? `https://ax-article-api.gsong.workers.dev/v/${id}` : null,
  }, 201);
}

// GET /api/articles
async function listArticles(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const importance = url.searchParams.get("importance");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
  const offset = parseInt(url.searchParams.get("offset") || "0");

  let query = "SELECT * FROM articles WHERE 1=1";
  const params: unknown[] = [];
  if (category) { query += " AND category = ?"; params.push(category); }
  if (importance) { query += " AND importance >= ?"; params.push(parseInt(importance)); }
  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const result = await env.DB.prepare(query).bind(...params).all();
  const articles = result.results.map((row: Record<string, unknown>) => ({
    ...row,
    tags: JSON.parse((row.tags as string) || "[]"),
    key_points: JSON.parse((row.key_points as string) || "[]"),
    action_items: JSON.parse((row.action_items as string) || "[]"),
  }));

  return jsonResponse({ articles, total: result.results.length });
}

// GET /api/articles/:id
async function getArticle(id: string, env: Env): Promise<Response> {
  const result = await env.DB.prepare("SELECT * FROM articles WHERE id = ?").bind(id).first();
  if (!result) return errorResponse("아티클을 찾을 수 없습니다.", 404);
  return jsonResponse({
    ...result,
    tags: JSON.parse((result.tags as string) || "[]"),
    key_points: JSON.parse((result.key_points as string) || "[]"),
    action_items: JSON.parse((result.action_items as string) || "[]"),
  });
}

// POST /api/search
async function searchArticles(request: Request, env: Env): Promise<Response> {
  const { query, category, limit = 10 } = (await request.json()) as {
    query: string; category?: string; limit?: number;
  };
  if (!query) return errorResponse("query는 필수입니다.");

  const embedding = await generateEmbedding(env.AI, query);
  const filter: VectorizeVectorMetadataFilter = {};
  if (category) filter.category = category;

  const vectorResults = await env.VECTOR_INDEX.query(embedding, {
    topK: limit,
    filter: Object.keys(filter).length > 0 ? filter : undefined,
    returnMetadata: "all",
  });

  const ids = vectorResults.matches.map((m) => m.id);
  if (ids.length === 0) return jsonResponse({ results: [] });

  const placeholders = ids.map(() => "?").join(",");
  const dbResults = await env.DB.prepare(`SELECT * FROM articles WHERE id IN (${placeholders})`).bind(...ids).all();
  const articleMap = new Map<string, Record<string, unknown>>();
  for (const row of dbResults.results) {
    articleMap.set(row.id as string, {
      ...row,
      tags: JSON.parse((row.tags as string) || "[]"),
      key_points: JSON.parse((row.key_points as string) || "[]"),
      action_items: JSON.parse((row.action_items as string) || "[]"),
    });
  }

  return jsonResponse({
    results: vectorResults.matches.map((match) => ({
      score: match.score,
      article: articleMap.get(match.id) || { id: match.id, metadata: match.metadata },
    })),
  });
}

// DELETE /api/articles/:id
async function deleteArticle(id: string, env: Env): Promise<Response> {
  await env.DB.prepare("DELETE FROM articles WHERE id = ?").bind(id).run();
  try { await env.VECTOR_INDEX.deleteByIds([id]); } catch { /* ignore */ }
  return jsonResponse({ status: "deleted" });
}

// Router
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    const url = new URL(request.url);
    const path = url.pathname;

    // GET /v/:id — HTML 시각화 서빙 (인증 불필요, 공개 접근)
    const visualMatch = path.match(/^\/v\/([a-f0-9-]+)$/);
    if (visualMatch && request.method === "GET") {
      try {
        const row = await env.DB.prepare("SELECT visual_html, title FROM articles WHERE id = ?")
          .bind(visualMatch[1]).first();
        if (!row || !row.visual_html) {
          return new Response("<h1>시각화를 찾을 수 없습니다</h1>", {
            status: 404,
            headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders() },
          });
        }
        return new Response(row.visual_html as string, {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
            ...corsHeaders(),
          },
        });
      } catch (err) {
        return errorResponse("서버 오류", 500);
      }
    }

    if (!authenticate(request, env)) {
      return errorResponse("인증 실패", 401);
    }

    try {
      if (path === "/api/articles" && request.method === "POST") return await createArticle(request, env);
      if (path === "/api/articles" && request.method === "GET") return await listArticles(request, env);
      if (path === "/api/search" && request.method === "POST") return await searchArticles(request, env);

      const articleMatch = path.match(/^\/api\/articles\/([a-f0-9-]+)$/);
      if (articleMatch && request.method === "GET") return await getArticle(articleMatch[1], env);
      if (articleMatch && request.method === "DELETE") return await deleteArticle(articleMatch[1], env);

      if (path === "/health") return jsonResponse({ status: "ok", environment: env.ENVIRONMENT });
      return errorResponse("Not Found", 404);
    } catch (err) {
      console.error("Unhandled error:", err);
      return errorResponse(`서버 오류: ${err instanceof Error ? err.message : "unknown"}`, 500);
    }
  },
} satisfies ExportedHandler<Env>;
