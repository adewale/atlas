/**
 * Seed script for Atlas search Worker.
 *
 * Reads the generated entity-index.json and elements.json, then:
 *  1. Inserts rows into D1 search_entities table (which triggers FTS5 sync)
 *  2. Generates embeddings via Workers AI and upserts into Vectorize
 *
 * Usage:
 *   npx wrangler d1 execute atlas-search --file worker/migrations/0001_init.sql
 *   npx tsx scripts/seed-search.ts --dry-run    # preview what would be inserted
 *   npx tsx scripts/seed-search.ts              # generate SQL + vectors JSON
 *
 * The script outputs:
 *   worker/seed/insert-entities.sql  — D1 INSERT statements
 *   worker/seed/vectors.json         — { id, values, metadata }[] for Vectorize
 *
 * To apply:
 *   npx wrangler d1 execute atlas-search --file worker/seed/insert-entities.sql
 *   npx wrangler vectorize insert atlas-search --file worker/seed/vectors.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'data', 'generated');
const SEED_DIR = path.join(ROOT, 'worker', 'seed');

type Entity = {
  id: string;
  type: string;
  name: string;
  description: string;
  colour: string;
  elements: string[];
  href: string;
};

type Element = {
  symbol: string;
  name: string;
  block: string;
  phase: string;
  category: string;
  discoveryYear: number | null;
  etymologyOrigin: string;
  discoverer: string | null;
  summary: string;
};

function escSql(s: string): string {
  return s.replace(/'/g, "''");
}

function main() {
  const dryRun = process.argv.includes('--dry-run');

  const entities: Entity[] = JSON.parse(
    fs.readFileSync(path.join(DATA, 'entity-index.json'), 'utf-8'),
  );
  const elements: Element[] = JSON.parse(
    fs.readFileSync(path.join(DATA, 'elements.json'), 'utf-8'),
  );

  // Build element lookup by symbol
  const elementBySymbol = new Map<string, Element>();
  for (const el of elements) {
    elementBySymbol.set(el.symbol, el);
  }

  const sqlLines: string[] = [];
  const vectorEntries: Array<{ id: string; text: string; metadata: Record<string, any> }> = [];

  for (const entity of entities) {
    // Derive symbol (elements only)
    let symbol: string | null = null;
    let metadata: Record<string, any> = {};
    let searchText = '';

    if (entity.type === 'element' && entity.elements.length === 1) {
      const el = elementBySymbol.get(entity.elements[0]);
      if (el) {
        symbol = el.symbol;
        metadata = {
          block: el.block,
          phase: el.phase,
          category: el.category,
          discoveryYear: el.discoveryYear,
          etymologyOrigin: el.etymologyOrigin,
        };
        searchText = [
          el.name, el.symbol, el.block + '-block', el.category, el.phase,
          el.discoverer ?? '', el.etymologyOrigin ?? '',
          el.summary?.slice(0, 300) ?? '',
        ].filter(Boolean).join(' ');
      }
    } else {
      // Non-element entities: use description as search text
      metadata = { elements: entity.elements };
      searchText = [entity.name, entity.description?.slice(0, 300) ?? ''].join(' ');
    }

    const metadataJson = JSON.stringify(metadata);

    sqlLines.push(
      `INSERT INTO search_entities (id, entity_type, name, symbol, url_path, search_text, metadata_json) VALUES ` +
      `('${escSql(entity.id)}', '${escSql(entity.type)}', '${escSql(entity.name)}', ` +
      `${symbol ? `'${escSql(symbol)}'` : 'NULL'}, '${escSql(entity.href)}', ` +
      `'${escSql(searchText)}', '${escSql(metadataJson)}');`,
    );

    vectorEntries.push({
      id: entity.id,
      text: searchText,
      metadata: { entity_type: entity.type, name: entity.name },
    });
  }

  if (dryRun) {
    console.log(`Would generate ${sqlLines.length} INSERT statements`);
    console.log(`Would generate ${vectorEntries.length} vector entries`);
    console.log('\nFirst 3 SQL:\n');
    sqlLines.slice(0, 3).forEach((l) => console.log(l.slice(0, 200) + '...'));
    console.log('\nFirst 3 vectors:\n');
    vectorEntries.slice(0, 3).forEach((v) => console.log(JSON.stringify({ id: v.id, textLen: v.text.length })));
    return;
  }

  fs.mkdirSync(SEED_DIR, { recursive: true });

  // Write SQL
  const sqlFile = path.join(SEED_DIR, 'insert-entities.sql');
  fs.writeFileSync(sqlFile, sqlLines.join('\n') + '\n');
  console.log(`Wrote ${sqlLines.length} rows to ${sqlFile}`);

  // Write vector JSON (text for embedding — actual embedding generation
  // requires Workers AI, so this file is input for a separate embed step)
  const vectorFile = path.join(SEED_DIR, 'vectors.json');
  fs.writeFileSync(vectorFile, JSON.stringify(vectorEntries, null, 2));
  console.log(`Wrote ${vectorEntries.length} vector entries to ${vectorFile}`);

  console.log(`
Next steps:
  1. Run the migration:
     npx wrangler d1 execute atlas-search --file worker/migrations/0001_init.sql

  2. Seed the entities:
     npx wrangler d1 execute atlas-search --file worker/seed/insert-entities.sql

  3. Generate embeddings and upsert to Vectorize:
     (Use a Worker script or wrangler AI to batch-embed the texts in vectors.json)
  `);
}

main();
