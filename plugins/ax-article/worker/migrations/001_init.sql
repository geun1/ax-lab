-- AX Articles 테이블
CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK(source_type IN ('blog', 'article', 'youtube', 'paper', 'tweet', 'other')),
  source_url TEXT,
  author TEXT,
  published_date TEXT,
  category TEXT NOT NULL CHECK(category IN ('ai-research', 'ai-product', 'ai-industry', 'dev-tool', 'crypto-web3', 'startup', 'design', 'general')),
  tags TEXT, -- JSON array as text
  importance INTEGER NOT NULL CHECK(importance BETWEEN 1 AND 5),
  analyzed_date TEXT NOT NULL,
  summary TEXT NOT NULL,
  key_points TEXT NOT NULL, -- JSON array as text
  detailed_analysis TEXT,
  ax_relevance TEXT,
  action_items TEXT, -- JSON array as text
  full_markdown TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_importance ON articles(importance DESC);
CREATE INDEX IF NOT EXISTS idx_articles_analyzed_date ON articles(analyzed_date DESC);
CREATE INDEX IF NOT EXISTS idx_articles_source_type ON articles(source_type);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
