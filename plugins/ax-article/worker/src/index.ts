/**
 * AX Article API - Cloudflare Worker
 *
 * D1 (SQL DB) + Vectorize (Vector DB) + Workers AI (임베딩)
 */

interface Env {
  DB: D1Database;
  VECTOR_INDEX: VectorizeIndex;
  AI: Ai;
  AX_API_TOKEN?: string;
  ENVIRONMENT: string;
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
}

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
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(),
    },
  });
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

function authenticate(request: Request, env: Env): boolean {
  if (!env.AX_API_TOKEN) return true; // 토큰 미설정시 인증 스킵
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return false;
  const token = authHeader.replace("Bearer ", "");
  return token === env.AX_API_TOKEN;
}

async function generateEmbedding(ai: Ai, text: string): Promise<number[]> {
  const result = await ai.run("@cf/baai/bge-base-en-v1.5", {
    text: [text],
  });
  return (result as { data: number[][] }).data[0];
}

// POST /api/articles - 아티클 저장
async function createArticle(
  request: Request,
  env: Env
): Promise<Response> {
  const body = (await request.json()) as ArticlePayload;

  // 필수 필드 검증
  if (!body.title || !body.category || !body.summary) {
    return errorResponse("title, category, summary는 필수입니다.");
  }

  const id = generateId();

  // D1에 저장
  await env.DB.prepare(
    `INSERT INTO articles (id, title, source_type, source_url, author, published_date, category, tags, importance, analyzed_date, summary, key_points, detailed_analysis, ax_relevance, action_items, full_markdown)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      body.title,
      body.source_type,
      body.source_url || null,
      body.author || null,
      body.published_date || null,
      body.category,
      JSON.stringify(body.tags || []),
      body.importance,
      body.analyzed_date,
      body.summary,
      JSON.stringify(body.key_points || []),
      body.detailed_analysis || null,
      body.ax_relevance || null,
      JSON.stringify(body.action_items || []),
      body.full_markdown || null
    )
    .run();

  // 임베딩 생성 및 Vectorize에 저장
  const embeddingText = `${body.title}\n${body.summary}\n${body.key_points.join("\n")}\n${body.detailed_analysis || ""}`;
  let vectorId: string | null = null;

  try {
    const embedding = await generateEmbedding(env.AI, embeddingText);
    await env.VECTOR_INDEX.upsert([
      {
        id: id,
        values: embedding,
        metadata: {
          title: body.title,
          category: body.category,
          importance: body.importance,
          source_type: body.source_type,
          analyzed_date: body.analyzed_date,
          tags: body.tags.join(","),
        },
      },
    ]);
    vectorId = id;
  } catch (err) {
    console.error("Vector DB 저장 실패:", err);
    // Vector DB 실패해도 D1 저장은 성공으로 처리
  }

  return jsonResponse({ id, vectorId, status: "saved" }, 201);
}

// GET /api/articles - 아티클 목록 조회
async function listArticles(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const importance = url.searchParams.get("importance");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
  const offset = parseInt(url.searchParams.get("offset") || "0");

  let query = "SELECT * FROM articles WHERE 1=1";
  const params: unknown[] = [];

  if (category) {
    query += " AND category = ?";
    params.push(category);
  }
  if (importance) {
    query += " AND importance >= ?";
    params.push(parseInt(importance));
  }

  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const result = await env.DB.prepare(query)
    .bind(...params)
    .all();

  // JSON 문자열 필드를 파싱
  const articles = result.results.map((row: Record<string, unknown>) => ({
    ...row,
    tags: JSON.parse((row.tags as string) || "[]"),
    key_points: JSON.parse((row.key_points as string) || "[]"),
    action_items: JSON.parse((row.action_items as string) || "[]"),
  }));

  return jsonResponse({ articles, total: result.results.length });
}

// GET /api/articles/:id - 아티클 상세 조회
async function getArticle(id: string, env: Env): Promise<Response> {
  const result = await env.DB.prepare("SELECT * FROM articles WHERE id = ?")
    .bind(id)
    .first();

  if (!result) {
    return errorResponse("아티클을 찾을 수 없습니다.", 404);
  }

  const article = {
    ...result,
    tags: JSON.parse((result.tags as string) || "[]"),
    key_points: JSON.parse((result.key_points as string) || "[]"),
    action_items: JSON.parse((result.action_items as string) || "[]"),
  };

  return jsonResponse(article);
}

// POST /api/search - 벡터 유사도 검색
async function searchArticles(
  request: Request,
  env: Env
): Promise<Response> {
  const { query, category, limit = 10 } = (await request.json()) as {
    query: string;
    category?: string;
    limit?: number;
  };

  if (!query) {
    return errorResponse("query는 필수입니다.");
  }

  const embedding = await generateEmbedding(env.AI, query);

  const filter: VectorizeVectorMetadataFilter = {};
  if (category) {
    filter.category = category;
  }

  const vectorResults = await env.VECTOR_INDEX.query(embedding, {
    topK: limit,
    filter: Object.keys(filter).length > 0 ? filter : undefined,
    returnMetadata: "all",
  });

  // D1에서 상세 정보 가져오기
  const ids = vectorResults.matches.map((m) => m.id);
  if (ids.length === 0) {
    return jsonResponse({ results: [] });
  }

  const placeholders = ids.map(() => "?").join(",");
  const dbResults = await env.DB.prepare(
    `SELECT * FROM articles WHERE id IN (${placeholders})`
  )
    .bind(...ids)
    .all();

  const articleMap = new Map<string, Record<string, unknown>>();
  for (const row of dbResults.results) {
    articleMap.set(row.id as string, {
      ...row,
      tags: JSON.parse((row.tags as string) || "[]"),
      key_points: JSON.parse((row.key_points as string) || "[]"),
      action_items: JSON.parse((row.action_items as string) || "[]"),
    });
  }

  const results = vectorResults.matches.map((match) => ({
    score: match.score,
    article: articleMap.get(match.id) || { id: match.id, metadata: match.metadata },
  }));

  return jsonResponse({ results });
}

// DELETE /api/articles/:id - 아티클 삭제
async function deleteArticle(id: string, env: Env): Promise<Response> {
  await env.DB.prepare("DELETE FROM articles WHERE id = ?").bind(id).run();

  try {
    await env.VECTOR_INDEX.deleteByIds([id]);
  } catch {
    // Vector DB 삭제 실패 무시
  }

  return jsonResponse({ status: "deleted" });
}

// Router
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    // 인증 확인
    if (!authenticate(request, env)) {
      return errorResponse("인증 실패", 401);
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // POST /api/articles
      if (path === "/api/articles" && request.method === "POST") {
        return await createArticle(request, env);
      }

      // GET /api/articles
      if (path === "/api/articles" && request.method === "GET") {
        return await listArticles(request, env);
      }

      // POST /api/search
      if (path === "/api/search" && request.method === "POST") {
        return await searchArticles(request, env);
      }

      // GET /api/articles/:id
      const articleMatch = path.match(/^\/api\/articles\/([a-f0-9-]+)$/);
      if (articleMatch && request.method === "GET") {
        return await getArticle(articleMatch[1], env);
      }

      // DELETE /api/articles/:id
      if (articleMatch && request.method === "DELETE") {
        return await deleteArticle(articleMatch[1], env);
      }

      // Health check
      if (path === "/health") {
        return jsonResponse({ status: "ok", environment: env.ENVIRONMENT });
      }

      return errorResponse("Not Found", 404);
    } catch (err) {
      console.error("Unhandled error:", err);
      return errorResponse(
        `서버 오류: ${err instanceof Error ? err.message : "unknown"}`,
        500
      );
    }
  },
} satisfies ExportedHandler<Env>;
