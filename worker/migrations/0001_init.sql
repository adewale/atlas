-- Atlas search schema — D1 (SQLite)
-- Per search-spec.md and Cloudflare skill: use lowercase fts5 on D1 (case-sensitive).

-- Source of truth: one row per searchable entity (~300 rows).
CREATE TABLE search_entities (
  id          TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  name        TEXT NOT NULL,
  symbol      TEXT,
  url_path    TEXT NOT NULL,
  search_text TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_entity_type ON search_entities(entity_type);

-- FTS5 virtual table for BM25 keyword ranking.
-- Tokenizer: porter stemmer + unicode61 (handles plurals, verb forms).
-- Must use lowercase 'fts5' on D1.
CREATE VIRTUAL TABLE search_fts USING fts5(
  name,
  symbol,
  search_text,
  content='search_entities',
  content_rowid='rowid',
  tokenize='porter unicode61'
);

-- Triggers to keep FTS index in sync with source table.
CREATE TRIGGER search_entities_ai AFTER INSERT ON search_entities BEGIN
  INSERT INTO search_fts(rowid, name, symbol, search_text)
  VALUES (new.rowid, new.name, new.symbol, new.search_text);
END;

CREATE TRIGGER search_entities_ad AFTER DELETE ON search_entities BEGIN
  INSERT INTO search_fts(search_fts, rowid, name, symbol, search_text)
  VALUES ('delete', old.rowid, old.name, old.symbol, old.search_text);
END;

CREATE TRIGGER search_entities_au AFTER UPDATE ON search_entities BEGIN
  INSERT INTO search_fts(search_fts, rowid, name, symbol, search_text)
  VALUES ('delete', old.rowid, old.name, old.symbol, old.search_text);
  INSERT INTO search_fts(rowid, name, symbol, search_text)
  VALUES (new.rowid, new.name, new.symbol, new.search_text);
END;

-- Explicit synonym table for chemistry-specific terms.
-- The Vectorize leg handles most synonyms implicitly via embeddings,
-- but these Latin names need guaranteed coverage.
CREATE TABLE synonyms (
  term    TEXT NOT NULL,
  synonym TEXT NOT NULL,
  PRIMARY KEY (term, synonym)
);

-- Bidirectional: every Latin/German name maps to English AND vice versa.
INSERT INTO synonyms (term, synonym) VALUES
  ('wolfram', 'tungsten'),
  ('tungsten', 'wolfram'),
  ('ferrum', 'iron'),
  ('iron', 'ferrum'),
  ('quicksilver', 'mercury'),
  ('mercury', 'quicksilver'),
  ('natrium', 'sodium'),
  ('sodium', 'natrium'),
  ('kalium', 'potassium'),
  ('potassium', 'kalium'),
  ('plumbum', 'lead'),
  ('lead', 'plumbum'),
  ('stannum', 'tin'),
  ('tin', 'stannum'),
  ('aurum', 'gold'),
  ('gold', 'aurum'),
  ('argentum', 'silver'),
  ('silver', 'argentum'),
  ('cuprum', 'copper'),
  ('copper', 'cuprum'),
  ('hydrargyrum', 'mercury'),
  ('noble gas', 'inert gas'),
  ('inert gas', 'noble gas'),
  ('stibium', 'antimony'),
  ('antimony', 'stibium');

-- Cross-references between entities (enrichment spec Phase 2).
CREATE TABLE entity_refs (
  source_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  rel_type  TEXT NOT NULL,
  PRIMARY KEY (source_id, target_id, rel_type)
);

CREATE INDEX idx_refs_target ON entity_refs(target_id);
